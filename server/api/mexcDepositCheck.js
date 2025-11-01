import axios from "axios";
import crypto from "crypto";
import { firestore } from "../firebaseAdmin.js";

const BASE_URL = "https://api.mexc.com";

export async function checkDeposit(address, network, requestedAmount, userId) {
  // TEMP DISABLED: Always return mock response, skip MEXC calls entirely
  console.warn("[MEXC] Integration disabled. Returning mock 'not_found'.");
  return { status: "not_found", amount: 0, txnHash: "" };

  const timestamp = Date.now();
  const recvWindow = 5000; // allow small clock skew
  const query = `timestamp=${timestamp}&recvWindow=${recvWindow}`;
  const signature = crypto
    .createHmac("sha256", process.env.MEXC_SECRET_KEY)
    .update(query)
    .digest("hex");

  const headers = { "X-MEXC-APIKEY": process.env.MEXC_ACCESS_KEY };
  const url = `${BASE_URL}/api/v3/capital/deposit/hisrec?${query}&signature=${signature}`;

  try {
    console.log("[MEXC] Requesting deposit history:", {
      endpoint: "/api/v3/capital/deposit/hisrec",
      timestamp,
      recvWindow,
      address,
      network,
      requestedAmount: Number(requestedAmount || 0)
    });
    const { data } = await axios.get(url, { headers });
    console.log("[MEXC] Raw response received", {
      type: Array.isArray(data) ? "array" : typeof data,
      count: Array.isArray(data) ? data.length : undefined
    });

    // Normalize to array
    const all = Array.isArray(data) ? data : [];

    // Filter strictly by SUCCESS, network, address, and amount >= requested
    const minAmount = Number(requestedAmount || 0);
    const filtered = all.filter((d) => {
      const statusOk = String(d.status).toUpperCase() === "SUCCESS";
      const networkOk = String(d.network) === String(network);
      const addressOk = String(d.address) === String(address);
      const amt = Number(d.amount || 0);
      const amountOk = !Number.isNaN(amt) && amt >= minAmount;
      return statusOk && networkOk && addressOk && amountOk;
    });
    console.log("[MEXC] Post-filter counts", {
      total: all.length,
      filtered: filtered.length,
    });

    if (filtered.length === 0) {
      return { status: "not_found", amount: 0, txnHash: "" };
    }

    // Choose best match: closest amount, then latest insertTime
    const sorted = filtered
      .map((d) => ({
        ...d,
        _amt: Number(d.amount || 0),
        _insert: Number(d.insertTime || 0)
      }))
      .sort((a, b) => {
        const diffA = Math.abs(a._amt - minAmount);
        const diffB = Math.abs(b._amt - minAmount);
        if (diffA !== diffB) return diffA - diffB;
        return b._insert - a._insert; // most recent first
      });

    const best = sorted[0];
    const txnHash = best.txId || best.txHash || "";
    console.log("[MEXC] Selected best match", {
      amount: best._amt,
      insertTime: best._insert,
      txnHash: txnHash || "(none)"
    });

    if (!txnHash) {
      // Without a reliable hash, do not credit to avoid duplicates
      return { status: "not_found", amount: 0, txnHash: "" };
    }

    // Duplicate prevention: check if this txnHash already recorded
    try {
      const snap = await firestore
        .collection('transactions')
        .where('txnHash', '==', txnHash)
        .limit(1)
        .get();
      console.log("[MEXC] Duplicate check result", { exists: !snap.empty });
      if (!snap.empty) {
        // Already processed
        return { status: "not_found", amount: 0, txnHash: "" };
      }
    } catch (dupErr) {
      console.error("Duplicate check error:", dupErr);
      // Fail-safe: if cannot verify duplicates, do not claim success
      return { status: "not_found", amount: 0, txnHash: "" };
    }

    return {
      status: "success",
      amount: Number(best.amount || 0),
      txnHash,
      insertTime: Number(best.insertTime || 0)
    };
  } catch (error) {
    console.error("MEXC API Error:", error.response?.data || error.message);
    // Return not_found instead of throwing to prevent server crashes
    return {
      status: "not_found",
      amount: 0,
      txnHash: ""
    };
  }
}

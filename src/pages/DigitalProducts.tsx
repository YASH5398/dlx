import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  addDoc,
  runTransaction,
  serverTimestamp,
  query,
} from "firebase/firestore";
import { useUser } from "../context/UserContext";
import { firestore } from "../firebase"; // Firestore instance
import {
  ShoppingCart,
  Share2,
  Plus,
  CheckCircle,
  AlertCircle,
  X,
  Download,
  Sparkles,
  TrendingUp,
  Package,
  DollarSign,
  XCircle,
} from "lucide-react";

type Currency = "USDT" | "INR";
type Product = {
  id: string;
  title: string;
  description: string;
  priceUsd: number;
  thumbnailUrl?: string;
  downloadUrl?: string;
  status: "approved" | "pending" | "rejected";
  createdBy?: string;
  createdAt?: any;
  category?: string;
};

const USD_TO_INR = 84;

const gridVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
    },
  },
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.3 },
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    transition: { duration: 0.2 },
  },
};

export default function DigitalProducts() {
  const { user } = useUser();
  const location = useLocation();
  const navigate = useNavigate();
  const referrerId = new URLSearchParams(location.search).get("ref") || undefined;

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [currency, setCurrency] = useState<Currency>("USDT");
  const [addingProduct, setAddingProduct] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [showFailurePopup, setShowFailurePopup] = useState(false);

  // Popups persist until user action (no auto-hide)

  // Validate balance before purchase
  const validateBalance = (productPrice: number, option: string, selectedCurrency: string) => {
    const price = selectedCurrency === "INR" ? Math.round(productPrice * USD_TO_INR) : productPrice;
    
    if (option === "main_only") {
      if (selectedCurrency === "USDT") {
        return walletBalances.mainUsdt >= price;
      } else {
        return walletBalances.mainInr >= price;
      }
    } else if (option === "split") {
      const halfAmount = selectedCurrency === "USDT" ? Number((price / 2).toFixed(2)) : Math.floor(price / 2);
      if (selectedCurrency === "USDT") {
        return walletBalances.mainUsdt >= halfAmount && walletBalances.purchaseUsdt >= halfAmount;
      } else {
        return walletBalances.mainInr >= halfAmount && walletBalances.purchaseInr >= halfAmount;
      }
    } else if (option === "currency_choice") {
      if (selectedCurrency === "USDT") {
        return walletBalances.mainUsdt >= price;
      } else {
        return walletBalances.mainInr >= price;
      }
    }
    return false;
  };

  // Get currency symbol
  const getCurrencySymbol = (currency: string) => {
    return currency === "INR" ? "₹" : "$";
  };

  // Get formatted price
  const getFormattedPrice = (productPrice: number, currency: string) => {
    const price = currency === "INR" ? Math.round(productPrice * USD_TO_INR) : productPrice;
    return `${getCurrencySymbol(currency)}${price.toFixed(currency === "INR" ? 0 : 2)}`;
  };
  const [newProduct, setNewProduct] = useState({
    title: "",
    description: "",
    priceUsd: "",
    thumbnailUrl: "",
    downloadUrl: "",
    category: "",
  });
  const [walletBalances, setWalletBalances] = useState<{
    mainUsdt: number;
    purchaseUsdt: number;
    mainInr: number;
    purchaseInr: number;
  }>({
    mainUsdt: 0,
    purchaseUsdt: 0,
    mainInr: 0,
    purchaseInr: 0,
  });
  const [purchaseOption, setPurchaseOption] = useState<"main_only" | "split" | "currency_choice">("split");

  const isAffiliate = !!user;

  useEffect(() => {
    const productsRef = collection(firestore, "digitalProducts");
    const q = query(productsRef);
    const unsub = onSnapshot(q, (snap) => {
      const list: Product[] = snap.docs.map((d) => {
        const data = d.data() as any;
        return {
          id: d.id,
          title: data.title,
          description: data.description,
          priceUsd: Number(data.priceUsd ?? data.price ?? 0),
          thumbnailUrl: data.thumbnailUrl ?? data.image ?? "",
          downloadUrl: data.downloadUrl ?? data.productLink ?? "",
          status: data.status ?? "approved",
          createdBy: data.createdBy,
          createdAt: data.createdAt,
          category: data.category,
        };
      });
      setProducts(list);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching products:", error);
      setToast({ message: "Failed to load products. Please try again.", type: "error" });
      setTimeout(() => setToast(null), 3000);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Fetch wallet balances from canonical structure
  useEffect(() => {
    if (!user) return;
    
    const walletRef = doc(firestore, "wallets", user.id);
    const unsub = onSnapshot(walletRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data() as any;
        const usdt = data.usdt || {};
        const inr = data.inr || {};
        setWalletBalances({
          mainUsdt: Number(usdt.mainUsdt || 0),
          purchaseUsdt: Number(usdt.purchaseUsdt || 0),
          mainInr: Number(inr.mainInr || 0),
          purchaseInr: Number(inr.purchaseInr || 0),
        });
        
        console.log('DigitalProducts wallet updated (canonical):', { 
          usdt, 
          inr,
          mainUsdt: usdt.mainUsdt,
          purchaseUsdt: usdt.purchaseUsdt
        });
      }
    });
    return () => unsub();
  }, [user]);

  const doPurchase = async () => {
    if (!user || !selectedProduct) return;

    setProcessing(true);
    const walletRef = doc(firestore, "wallets", user.id);
    const ordersRef = collection(firestore, "orders");
    const affiliateId = referrerId && referrerId !== user.id ? referrerId : undefined;
    const productPrice = Number((selectedProduct as any).priceUsd ?? (selectedProduct as any).price ?? 0);
    const commissionUsd = Number((productPrice * 0.7).toFixed(2));

    try {
      await runTransaction(firestore, async (tx) => {
        const walletSnap = await tx.get(walletRef);
        if (!walletSnap.exists()) {
          throw new Error("Wallet not found. Please set up your wallet first.");
        }
        const w = walletSnap.data() as any;

        // Determine payment amount and currency based on purchase option
        let paymentAmount: number;
        let currencyToUse: string;
        
        if (purchaseOption === "currency_choice") {
          currencyToUse = currency;
          paymentAmount = currency === "INR" ? Math.round(productPrice * USD_TO_INR) : productPrice;
        } else {
          currencyToUse = "USDT"; // Default to USDT for main_only and split options
          paymentAmount = productPrice;
        }

        // Check balance and deduct based on purchase option
        if (purchaseOption === "main_only") {
          // Pay from main wallet only
          if (currencyToUse === "USDT") {
            const mainWallet = Number(w?.usdt?.mainUsdt || 0);
            if (mainWallet < paymentAmount) {
              throw new Error("Insufficient balance in main wallet. Please deposit more funds.");
            }
            tx.update(walletRef, { 
              "usdt.mainUsdt": Number((mainWallet - paymentAmount).toFixed(2))
            });
          } else {
            const mainWallet = Number(w?.inr?.mainInr || 0);
            if (mainWallet < paymentAmount) {
              throw new Error("Insufficient balance in main wallet. Please deposit more funds.");
            }
            tx.update(walletRef, { 
              "inr.mainInr": mainWallet - paymentAmount
            });
          }
        } else if (purchaseOption === "split") {
          // Dynamic split: prefer 50/50, fall back to whatever is available in purchase wallet, rest from main
          if (currencyToUse === "USDT") {
            const mainWallet = Number(w?.usdt?.mainUsdt || 0);
            const purchaseWallet = Number(w?.usdt?.purchaseUsdt || 0);
            const totalAvailable = Number((mainWallet + purchaseWallet).toFixed(2));
            if (totalAvailable < paymentAmount) {
              throw new Error("Not enough balance across wallets. Please deposit funds to continue.");
            }
            const idealPurchase = Number((paymentAmount / 2).toFixed(2));
            const idealMain = Number((paymentAmount - idealPurchase).toFixed(2));
            const mainDeficit = Math.max(0, idealMain - mainWallet);
            const takeFromPurchase = Math.min(purchaseWallet, Number((idealPurchase + mainDeficit).toFixed(2)));
            const takeFromMain = Number((paymentAmount - takeFromPurchase).toFixed(2));
            tx.update(walletRef, {
              "usdt.mainUsdt": Number((mainWallet - takeFromMain).toFixed(2)),
              "usdt.purchaseUsdt": Number((purchaseWallet - takeFromPurchase).toFixed(2))
            });
          } else {
            const mainWallet = Number(w?.inr?.mainInr || 0);
            const purchaseWallet = Number(w?.inr?.purchaseInr || 0);
            const totalAvailable = mainWallet + purchaseWallet;
            if (totalAvailable < paymentAmount) {
              throw new Error("Not enough balance across wallets. Please deposit funds to continue.");
            }
            const idealPurchase = Math.floor(paymentAmount / 2);
            const idealMain = paymentAmount - idealPurchase;
            const mainDeficit = Math.max(0, idealMain - mainWallet);
            const takeFromPurchase = Math.min(purchaseWallet, idealPurchase + mainDeficit);
            const takeFromMain = paymentAmount - takeFromPurchase;
            tx.update(walletRef, {
              "inr.mainInr": mainWallet - takeFromMain,
              "inr.purchaseInr": purchaseWallet - takeFromPurchase
            });
          }
        } else if (purchaseOption === "currency_choice") {
          // Pay from main wallet with chosen currency
          if (currencyToUse === "USDT") {
            const mainWallet = Number(w?.usdt?.mainUsdt || 0);
            if (mainWallet < paymentAmount) {
              throw new Error("Insufficient balance in main USDT wallet. Please deposit more funds.");
            }
            tx.update(walletRef, { 
              "usdt.mainUsdt": Number((mainWallet - paymentAmount).toFixed(2))
            });
          } else {
            const mainWallet = Number(w?.inr?.mainInr || 0);
            if (mainWallet < paymentAmount) {
              throw new Error("Insufficient balance in main INR wallet. Please deposit more funds.");
            }
            tx.update(walletRef, { 
              "inr.mainInr": mainWallet - paymentAmount
            });
          }
        }

        // Handle affiliate commission (always in USDT)
        if (affiliateId) {
          const affRef = doc(firestore, "wallets", affiliateId);
          const affSnap = await tx.get(affRef);
          const affMain = Number(((affSnap.data() as any)?.usdt?.mainUsdt) || 0);
          tx.update(affRef, { "usdt.mainUsdt": Number((affMain + commissionUsd).toFixed(2)) });
        }

        // Create order document with required fields
        const orderRef = doc(ordersRef);
        tx.set(orderRef, {
          userId: user.id,
          productId: selectedProduct.id,
          productName: selectedProduct.title,
          amountUsd: productPrice,
          productLink: (selectedProduct as any).downloadUrl ?? (selectedProduct as any).productLink ?? "",
          status: "Completed",
          purchaseOption: purchaseOption,
          currency: currencyToUse,
          timestamp: serverTimestamp(),
        });
      });

      setShowSuccessPopup(true);
      setShowModal(false);
      setSelectedProduct(null);
    } catch (e: any) {
      if (e?.message?.includes("Not enough balance in one or both wallets")) {
        setShowFailurePopup(true);
      } else if (e?.message?.includes("Insufficient balance")) {
        setShowFailurePopup(true);
      } else {
        setToast({ message: e?.message || "Payment failed. Please try again.", type: "error" });
        setTimeout(() => setToast(null), 3000);
      }
    } finally {
      setProcessing(false);
    }
  };

  const submitNewProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setToast({ message: "Login to submit products.", type: "error" });
      setTimeout(() => setToast(null), 2500);
      return;
    }
    try {
      setAddingProduct(true);
      await addDoc(collection(firestore, "digitalProducts"), {
        title: newProduct.title.trim(),
        description: newProduct.description.trim(),
        price: Number(newProduct.priceUsd),
        image: newProduct.thumbnailUrl || "",
        productLink: newProduct.downloadUrl || "",
        status: "pending",
        createdBy: user.id,
        createdAt: serverTimestamp(),
        category: newProduct.category || "",
      });
      setToast({ message: "Submitted. Awaiting admin review.", type: "success" });
      setTimeout(() => setToast(null), 2500);
      setNewProduct({ title: "", description: "", priceUsd: "", thumbnailUrl: "", downloadUrl: "", category: "" });
    } catch (err: any) {
      setToast({ message: err?.message || "Submission failed. Try again.", type: "error" });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setAddingProduct(false);
    }
  };

  const visibleProducts = products.filter((p) => p.status === "approved");

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0d1f] via-[#0d1226] to-[#050812] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-10"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-6">
            <div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight mb-3 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Digital Products Marketplace
              </h1>
              <p className="text-gray-400 text-base sm:text-lg max-w-2xl">
                Discover premium digital products to boost your business and skills
              </p>
            </div>
            <button
              onClick={() => setAddingProduct((s) => !s)}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 transition-all duration-300 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 font-semibold"
            >
              {addingProduct ? (
                <>
                  <X className="w-5 h-5" />
                  <span>Close</span>
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  <span>Add Product</span>
                </>
              )}
            </button>
          </div>

          {/* Stats Section */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-600/10 to-blue-700/10 border border-blue-500/20 rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-xl">
                  <Package className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-400">{visibleProducts.length}</div>
                  <div className="text-xs text-gray-400">Products</div>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-purple-600/10 to-purple-700/10 border border-purple-500/20 rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 rounded-xl">
                  <DollarSign className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-400">${walletBalances.mainUsdt.toFixed(2)} </div>
                  <div className="text-xs text-gray-400">💰 Main Wallet</div>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-pink-600/10 to-pink-700/10 border border-pink-500/20 rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-pink-500/20 rounded-xl">
                  <TrendingUp className="w-6 h-6 text-pink-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-pink-400">30%</div>
                  <div className="text-xs text-gray-400">each sale</div>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-green-600/10 to-green-700/10 border border-green-500/20 rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/20 rounded-xl">
                  <Sparkles className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-400">Instant</div>
                  <div className="text-xs text-gray-400">Delivery</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Toast Notification */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`mb-6 rounded-2xl px-6 py-4 border ${
                toast.type === "success"
                  ? "bg-green-500/10 border-green-500/30 text-green-400"
                  : "bg-red-500/10 border-red-500/30 text-red-400"
              } backdrop-blur-sm flex items-center gap-3 shadow-lg`}
            >
              {toast.type === "success" ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
              <span className="font-medium">{toast.message}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Add Product Form */}
        <AnimatePresence>
          {addingProduct && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mb-10 overflow-hidden"
            >
              <form
                onSubmit={submitNewProduct}
                className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-white/10 rounded-2xl p-6 lg:p-8 backdrop-blur-sm shadow-2xl"
              >
                <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-blue-400" />
                  Submit Your Product
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Product Name *
                    </label>
                    <input
                      placeholder="e.g., Premium WordPress Bundle"
                      className="w-full rounded-xl bg-black/40 border border-white/20 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      value={newProduct.title}
                      onChange={(e) =>
                        setNewProduct((p) => ({ ...p, title: e.target.value }))
                      }
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Price (USD) *
                    </label>
                    <input
                      placeholder="e.g., 5.99"
                      className="w-full rounded-xl bg-black/40 border border-white/20 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      type="number"
                      min={2}
                      max={8}
                      step="0.01"
                      value={newProduct.priceUsd}
                      onChange={(e) =>
                        setNewProduct((p) => ({ ...p, priceUsd: e.target.value }))
                      }
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Category
                    </label>
                    <input
                      placeholder="e.g., Development, Marketing"
                      className="w-full rounded-xl bg-black/40 border border-white/20 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      value={newProduct.category}
                      onChange={(e) =>
                        setNewProduct((p) => ({ ...p, category: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Thumbnail URL
                    </label>
                    <input
                      placeholder="https://example.com/image.jpg"
                      className="w-full rounded-xl bg-black/40 border border-white/20 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      value={newProduct.thumbnailUrl}
                      onChange={(e) =>
                        setNewProduct((p) => ({ ...p, thumbnailUrl: e.target.value }))
                      }
                    />
                  </div>
                  <div className="lg:col-span-2">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Download File / Link
                    </label>
                    <input
                      placeholder="https://drive.google.com/..."
                      className="w-full rounded-xl bg-black/40 border border-white/20 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      value={newProduct.downloadUrl}
                      onChange={(e) =>
                        setNewProduct((p) => ({ ...p, downloadUrl: e.target.value }))
                      }
                    />
                  </div>
                  <div className="lg:col-span-2">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Description *
                    </label>
                    <textarea
                      placeholder="Detailed description of your product..."
                      className="w-full rounded-xl bg-black/40 border border-white/20 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                      rows={4}
                      value={newProduct.description}
                      onChange={(e) =>
                        setNewProduct((p) => ({ ...p, description: e.target.value }))
                      }
                      required
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="mt-6 w-full px-6 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 transition-all duration-300 font-semibold text-lg shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={processing}
                >
                  {processing ? "Submitting..." : "Submit for Review"}
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Products Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-400">Loading amazing products...</p>
            </div>
          </div>
        ) : (
          <motion.div
            variants={gridVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8"
          >
            {visibleProducts.map((product) => (
              <motion.div
                key={product.id}
                variants={cardVariants}
                className="group relative bg-gradient-to-br from-[#0d1226] to-[#0a0d1f] rounded-2xl border border-white/10 overflow-hidden shadow-xl hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-500 hover:-translate-y-2"
              >
                {/* Product Image */}
                <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-blue-900/20 to-purple-900/20">
                  {product.thumbnailUrl ? (
                    <img
                      src={product.thumbnailUrl}
                      alt={product.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-16 h-16 text-white/20" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a0d1f] via-transparent to-transparent opacity-60"></div>
                  
                  {/* Category Badge */}
                  {product.category && (
                    <div className="absolute top-4 right-4">
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 backdrop-blur-sm border border-blue-400/30 text-blue-300">
                        {product.category}
                      </span>
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-2 line-clamp-1 group-hover:text-blue-400 transition-colors">
                    {product.title}
                  </h3>
                  <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                    {product.description}
                  </p>

                  {/* Price & Actions */}
                  <div className="flex items-center justify-between pt-4 border-t border-white/10">
                    <div>
                      <div className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                        ${Number((product as any).priceUsd ?? (product as any).price ?? 0).toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-500">USD</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isAffiliate && (
                        <button
                          onClick={() => {
                            try {
                              const base = typeof window !== 'undefined' ? window.location.origin : 'https://digilinex.com';
                              const link = `${base}/dashboard/digital-products?ref=${user?.id ?? ''}`;
                              navigator.clipboard.writeText(link)
                                .then(() => setToast({ message: 'Referral link copied!', type: 'success' }))
                                .catch(() => setToast({ message: 'Unable to copy. Share manually.', type: 'error' }));
                            } catch {
                              setToast({ message: 'Unable to copy. Share manually.', type: 'error' });
                            } finally {
                              setTimeout(() => setToast(null), 2500);
                            }
                          }}
                          className="p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-blue-400/50 transition-all duration-300 group/share"
                          title="Share & Earn"
                        >
                          <Share2 className="w-4 h-4 text-gray-400 group-hover/share:text-blue-400 transition-colors" />
                        </button>
                      )}
                      <button
                        onClick={() => { 
                          setSelectedProduct(product); 
                          setShowModal(true);
                          setPurchaseOption("split"); // Reset to default
                          setCurrency("USDT"); // Reset to default
                        }}
                        className="flex items-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 transition-all duration-300 font-semibold text-sm shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        <span>Buy Now</span>
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Empty State */}
        {!loading && visibleProducts.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <Package className="w-20 h-20 text-gray-600 mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-2">No Products Yet</h3>
            <p className="text-gray-400 mb-6">Be the first to add a product!</p>
            <button
              onClick={() => setAddingProduct(true)}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 transition-all duration-300 font-semibold"
            >
              Add Your First Product
            </button>
          </motion.div>
        )}
      </div>

      {/* Checkout Modal */}
      <AnimatePresence>
        {showModal && selectedProduct && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => { setShowModal(false); setSelectedProduct(null); }}
          >
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg max-h-[90vh] bg-gradient-to-br from-[#0d1226] to-[#0a0d1f] border border-white/20 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-b border-white/10 px-6 py-5 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <ShoppingCart className="w-6 h-6 text-blue-400" />
                    Checkout
                  </h2>
                  <button
                    onClick={() => { setShowModal(false); setSelectedProduct(null); }}
                    className="p-2 rounded-xl hover:bg-white/10 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Modal Body - Scrollable */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Product Info */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <div className="text-sm text-gray-400 mb-1">Product</div>
                  <div className="text-lg font-semibold">{selectedProduct.title}</div>
                </div>

                {/* Wallet Balances */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Your Wallet Balances
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                        <div className="text-sm text-gray-400 mb-1">Main Wallet</div>
                        <div className="text-lg font-semibold">
                          {currency === "USDT" 
                            ? `${walletBalances.mainUsdt.toFixed(2)} USDT`
                            : `₹${walletBalances.mainInr.toFixed(2)}`
                          }
                        </div>
                      </div>
                      <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                        <div className="text-sm text-gray-400 mb-1">Purchase Wallet</div>
                        <div className="text-lg font-semibold">
                          {currency === "USDT" 
                            ? `${walletBalances.purchaseUsdt.toFixed(2)} USDT`
                            : `₹${walletBalances.purchaseInr.toFixed(2)}`
                          }
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Options */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Purchase Option
                    </label>
                    <div className="space-y-3">
                      <label className={`flex items-center space-x-3 p-3 rounded-xl border cursor-pointer transition-all ${
                        purchaseOption === "main_only" 
                          ? "bg-blue-500/20 border-blue-500/50" 
                          : "bg-white/5 border-white/10 hover:bg-white/10"
                      }`}>
                        <input
                          type="radio"
                          name="purchaseOption"
                          value="main_only"
                          checked={purchaseOption === "main_only"}
                          onChange={(e) => setPurchaseOption(e.target.value as any)}
                          className="w-4 h-4 text-blue-600"
                        />
                        <div className="flex-1">
                          <div className="font-medium">Main Wallet Only</div>
                          <div className="text-sm text-gray-400">
                            Pay {getFormattedPrice(selectedProduct?.priceUsd || 0, currency)} from main wallet
                          </div>
                          {!validateBalance(selectedProduct?.priceUsd || 0, "main_only", currency) && (
                            <div className="text-xs text-red-400 mt-1">⚠️ Insufficient balance</div>
                          )}
                        </div>
                      </label>
                      
                      <label className={`flex items-center space-x-3 p-3 rounded-xl border cursor-pointer transition-all ${
                        purchaseOption === "split" 
                          ? "bg-blue-500/20 border-blue-500/50" 
                          : "bg-white/5 border-white/10 hover:bg-white/10"
                      }`}>
                        <input
                          type="radio"
                          name="purchaseOption"
                          value="split"
                          checked={purchaseOption === "split"}
                          onChange={(e) => setPurchaseOption(e.target.value as any)}
                          className="w-4 h-4 text-blue-600"
                        />
                        <div className="flex-1">
                          <div className="font-medium">50% Main + 50% Purchase</div>
                          <div className="text-sm text-gray-400">
                            Split {getFormattedPrice(selectedProduct?.priceUsd || 0, currency)} between both wallets
                          </div>
                          {!validateBalance(selectedProduct?.priceUsd || 0, "split", currency) && (
                            <div className="text-xs text-red-400 mt-1">⚠️ Not enough balance in one or both wallets</div>
                          )}
                        </div>
                      </label>
                      
                      <label className={`flex items-center space-x-3 p-3 rounded-xl border cursor-pointer transition-all ${
                        purchaseOption === "currency_choice" 
                          ? "bg-blue-500/20 border-blue-500/50" 
                          : "bg-white/5 border-white/10 hover:bg-white/10"
                      }`}>
                        <input
                          type="radio"
                          name="purchaseOption"
                          value="currency_choice"
                          checked={purchaseOption === "currency_choice"}
                          onChange={(e) => setPurchaseOption(e.target.value as any)}
                          className="w-4 h-4 text-blue-600"
                        />
                        <div className="flex-1">
                          <div className="font-medium">Choose Currency</div>
                          <div className="text-sm text-gray-400">Select USDT or INR payment</div>
                        </div>
                      </label>
                    </div>
                  </div>
                  
                  {purchaseOption === "currency_choice" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Currency
                      </label>
                      <div className="space-y-3">
                        <label className={`flex items-center space-x-3 p-3 rounded-xl border cursor-pointer transition-all ${
                          currency === "USDT" 
                            ? "bg-green-500/20 border-green-500/50" 
                            : "bg-white/5 border-white/10 hover:bg-white/10"
                        }`}>
                          <input
                            type="radio"
                            name="currency"
                            value="USDT"
                            checked={currency === "USDT"}
                            onChange={(e) => setCurrency(e.target.value as Currency)}
                            className="w-4 h-4 text-green-600"
                          />
                          <div className="flex-1">
                            <div className="font-medium">USDT</div>
                            <div className="text-sm text-gray-400">
                              Pay {getFormattedPrice(selectedProduct?.priceUsd || 0, "USDT")} from main USDT wallet
                            </div>
                            {!validateBalance(selectedProduct?.priceUsd || 0, "currency_choice", "USDT") && (
                              <div className="text-xs text-red-400 mt-1">⚠️ Insufficient USDT balance</div>
                            )}
                          </div>
                        </label>
                        
                        <label className={`flex items-center space-x-3 p-3 rounded-xl border cursor-pointer transition-all ${
                          currency === "INR" 
                            ? "bg-green-500/20 border-green-500/50" 
                            : "bg-white/5 border-white/10 hover:bg-white/10"
                        }`}>
                          <input
                            type="radio"
                            name="currency"
                            value="INR"
                            checked={currency === "INR"}
                            onChange={(e) => setCurrency(e.target.value as Currency)}
                            className="w-4 h-4 text-green-600"
                          />
                          <div className="flex-1">
                            <div className="font-medium">INR</div>
                            <div className="text-sm text-gray-400">
                              Pay {getFormattedPrice(selectedProduct?.priceUsd || 0, "INR")} from main INR wallet
                            </div>
                            {!validateBalance(selectedProduct?.priceUsd || 0, "currency_choice", "INR") && (
                              <div className="text-xs text-red-400 mt-1">⚠️ Insufficient INR balance</div>
                            )}
                          </div>
                        </label>
                      </div>
                    </div>
                  )}
                </div>

                {/* Price Summary */}
                <div className="bg-gradient-to-br from-blue-600/10 to-purple-600/10 border border-blue-500/20 rounded-xl p-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-400">Total Price</span>
                    <span className="font-semibold text-lg">
                      {getFormattedPrice(selectedProduct?.priceUsd || 0, currency)}
                    </span>
                  </div>
                  {purchaseOption === "split" && (
                    <div className="flex items-center justify-between text-sm text-gray-400">
                      <span>Split Payment (50% each)</span>
                      <span>
                        {getCurrencySymbol(currency)}{((selectedProduct?.priceUsd || 0) / 2).toFixed(currency === "INR" ? 0 : 2)}
                      </span>
                    </div>
                  )}
                  {purchaseOption === "currency_choice" && currency === "INR" && (
                    <div className="flex items-center justify-between text-sm text-gray-400">
                      <span>Exchange Rate</span>
                      <span>1 USD = ₹{USD_TO_INR}</span>
                    </div>
                  )}
                </div>

                {/* Info Box */}
                <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 flex gap-3">
                  <Download className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-green-300">
                    You'll get instant access to download this product after successful payment.
                  </div>
                </div>
              </div>

              {/* Modal Footer - Sticky */}
              <div className="bg-white/5 border-t border-white/10 px-6 py-5 flex items-center justify-end gap-3 flex-shrink-0">
                <button
                  onClick={() => { setShowModal(false); setSelectedProduct(null); }}
                  className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300 font-semibold"
                  disabled={processing}
                >
                  Cancel
                </button>
                <button
                  onClick={doPurchase}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 transition-all duration-300 font-semibold shadow-lg shadow-green-500/30 hover:shadow-green-500/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  disabled={processing || !validateBalance(selectedProduct?.priceUsd || 0, purchaseOption, currency)}
                >
                  {processing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      <span>Complete Purchase</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Popup */}
      <AnimatePresence>
        {showSuccessPopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowSuccessPopup(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl max-w-md w-full p-8 text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center"
              >
                <CheckCircle className="w-10 h-10 text-white" />
              </motion.div>
              
              <h3 className="text-2xl font-bold text-white mb-2">
                ✅ Purchase Successful!
              </h3>
              <p className="text-slate-300 mb-6">
                Your product is ready. View it in the Orders section.
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowSuccessPopup(false)}
                  className="flex-1 px-4 py-2 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 rounded-lg transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setShowSuccessPopup(false);
                    navigate('/dashboard/orders');
                  }}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg transition-all duration-200"
                >
                  Go to Orders
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Failure Popup */}
      <AnimatePresence>
        {showFailurePopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowFailurePopup(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl max-w-md w-full p-8 text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center"
              >
                <XCircle className="w-10 h-10 text-white" />
              </motion.div>
              
              <h3 className="text-2xl font-bold text-white mb-2">
                ⚠️ Insufficient Balance!
              </h3>
              <p className="text-slate-300 mb-6">
                Please add funds to your wallet to complete the purchase.
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowFailurePopup(false)}
                  className="flex-1 px-4 py-2 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 rounded-lg transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setShowFailurePopup(false);
                    navigate('/wallet');
                  }}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-semibold rounded-lg transition-all duration-200"
                >
                  Go to Wallet
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
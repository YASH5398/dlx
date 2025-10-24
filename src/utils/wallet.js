const BAL_KEY = 'wallet.balances';
const TX_KEY = 'wallet.txHistory';
const DLX_KEY = 'wallet.dlxBalance';
const DEFAULT_BALANCES = {
    main: { inr: 0, usdt: 0 },
    purchase: { inr: 0, usdt: 0 },
    dlx: 0,
};
function readJSON(key, fallback) {
    try {
        const raw = localStorage.getItem(key);
        if (!raw)
            return fallback;
        return JSON.parse(raw);
    }
    catch {
        return fallback;
    }
}
function writeJSON(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}
function dispatchWalletNotification(type, message, meta) {
    try {
        document.dispatchEvent(new CustomEvent('notifications:add', {
            detail: { type, message, meta },
        }));
    }
    catch { }
}
export function getBalances() {
    const balances = readJSON(BAL_KEY, DEFAULT_BALANCES);
    // Merge in DLX from mining if present
    const dlxFromMining = readJSON(DLX_KEY, null);
    if (typeof dlxFromMining === 'number') {
        balances.dlx = dlxFromMining;
    }
    return balances;
}
export function setBalances(next) {
    writeJSON(BAL_KEY, next);
    document.dispatchEvent(new CustomEvent('wallet:update'));
}
export function getTxHistory() {
    return readJSON(TX_KEY, []);
}
export function addTx(tx) {
    const list = getTxHistory();
    list.unshift(tx);
    writeJSON(TX_KEY, list);
    document.dispatchEvent(new CustomEvent('wallet:update'));
    // Push a notification describing the transaction
    let msg = '';
    if (tx.type === 'deposit') {
        msg = `Deposited ${tx.amount} ${tx.currency} to ${(tx.meta?.target ?? 'wallet')}`;
    }
    else if (tx.type === 'withdraw') {
        msg = `Withdrew ${tx.amount} ${tx.currency} from ${(tx.meta?.from ?? 'wallet')}`;
    }
    else if (tx.type === 'swap') {
        const rate = tx.meta?.rate ? ` at ${tx.meta.rate}` : '';
        msg = `Swapped ${tx.meta?.dlxSpent ?? ''} DLX to ${tx.amount} USDT${rate}`;
    }
    else if (tx.type === 'purchase') {
        msg = `Purchase completed: ${tx.amount} ${tx.currency}`;
    }
    if (msg)
        dispatchWalletNotification('transaction', msg, { tx });
}
export function onWalletUpdate(handler) {
    const fn = () => handler();
    document.addEventListener('wallet:update', fn);
    window.addEventListener('storage', fn);
    return () => {
        document.removeEventListener('wallet:update', fn);
        window.removeEventListener('storage', fn);
    };
}
function uid() {
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
export async function deposit(target, currency, amount) {
    if (amount <= 0)
        throw new Error('Amount must be positive');
    const balances = getBalances();
    balances[target][currency.toLowerCase()] += amount;
    setBalances(balances);
    addTx({ id: uid(), type: 'deposit', currency, amount, status: 'success', createdAt: Date.now(), meta: { target } });
}
export async function withdraw(currency, amount) {
    if (amount <= 0)
        throw new Error('Amount must be positive');
    const balances = getBalances();
    const key = currency.toLowerCase();
    if (balances.main[key] < amount)
        throw new Error('Insufficient Main Wallet balance');
    balances.main[key] -= amount;
    setBalances(balances);
    addTx({ id: uid(), type: 'withdraw', currency, amount, status: 'success', createdAt: Date.now(), meta: { from: 'main' } });
}
export async function swapDLXtoUSDT(amountDLX) {
    if (amountDLX <= 0)
        throw new Error('Amount must be positive');
    const RATE = 0.1; // 1 DLX = 0.1 USDT
    const balances = getBalances();
    if (balances.dlx < amountDLX)
        throw new Error('Insufficient DLX');
    balances.dlx -= amountDLX;
    balances.purchase.usdt += amountDLX * RATE;
    setBalances(balances);
    addTx({ id: uid(), type: 'swap', currency: 'USDT', amount: amountDLX * RATE, status: 'success', createdAt: Date.now(), meta: { from: 'DLX', rate: RATE, dlxSpent: amountDLX } });
}
export async function purchase(amount, currency) {
    if (amount <= 0)
        throw new Error('Amount must be positive');
    const balances = getBalances();
    const key = currency.toLowerCase();
    const half = amount / 2;
    const useFromPurchase = Math.min(balances.purchase[key], half);
    const useFromMain = amount - useFromPurchase;
    if (balances.main[key] < useFromMain)
        throw new Error('Insufficient Main Wallet for purchase');
    balances.purchase[key] -= useFromPurchase;
    balances.main[key] -= useFromMain;
    setBalances(balances);
    addTx({ id: uid(), type: 'purchase', currency, amount, status: 'success', createdAt: Date.now(), meta: { main: useFromMain, purchase: useFromPurchase } });
}
export function syncMiningBalanceToWallet(dlx) {
    const prev = readJSON(DLX_KEY, null);
    writeJSON(DLX_KEY, dlx);
    const balances = getBalances();
    balances.dlx = dlx;
    setBalances(balances);
    const delta = typeof prev === 'number' ? dlx - prev : dlx;
    if (delta !== 0) {
        const direction = delta > 0 ? '+' : '';
        dispatchWalletNotification('mining', `Mining rewards synced: ${direction}${delta} DLX`, { dlx, prev });
    }
}

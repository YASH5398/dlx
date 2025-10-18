export type Currency = 'INR' | 'USDT' | 'DLX';
export type WalletType = 'main' | 'purchase' | 'dlx';

export interface WalletBalances {
  main: { inr: number; usdt: number };
  purchase: { inr: number; usdt: number };
  dlx: number;
}

export type TxType = 'deposit' | 'withdraw' | 'swap' | 'purchase';
export interface WalletTx {
  id: string;
  type: TxType;
  currency: Currency;
  amount: number; // positive amounts
  meta?: Record<string, any>;
  status: 'success' | 'failed' | 'pending';
  createdAt: number; // epoch ms
}

const BAL_KEY = 'wallet.balances';
const TX_KEY = 'wallet.txHistory';
const DLX_KEY = 'wallet.dlxBalance';

const DEFAULT_BALANCES: WalletBalances = {
  main: { inr: 0, usdt: 0 },
  purchase: { inr: 0, usdt: 0 },
  dlx: 0,
};

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function writeJSON(key: string, value: any) {
  localStorage.setItem(key, JSON.stringify(value));
}

function dispatchWalletNotification(type: 'wallet' | 'transaction' | 'mining', message: string, meta?: Record<string, any>) {
  try {
    document.dispatchEvent(
      new CustomEvent('notifications:add', {
        detail: { type, message, meta },
      })
    );
  } catch {}
}

export function getBalances(): WalletBalances {
  const balances = readJSON<WalletBalances>(BAL_KEY, DEFAULT_BALANCES);
  // Merge in DLX from mining if present
  const dlxFromMining = readJSON<number | null>(DLX_KEY, null);
  if (typeof dlxFromMining === 'number') {
    balances.dlx = dlxFromMining;
  }
  return balances;
}

export function setBalances(next: WalletBalances) {
  writeJSON(BAL_KEY, next);
  document.dispatchEvent(new CustomEvent('wallet:update'));
}

export function getTxHistory(): WalletTx[] {
  return readJSON<WalletTx[]>(TX_KEY, []);
}

export function addTx(tx: WalletTx) {
  const list = getTxHistory();
  list.unshift(tx);
  writeJSON(TX_KEY, list);
  document.dispatchEvent(new CustomEvent('wallet:update'));
  // Push a notification describing the transaction
  let msg = '';
  if (tx.type === 'deposit') {
    msg = `Deposited ${tx.amount} ${tx.currency} to ${(tx.meta?.target ?? 'wallet')}`;
  } else if (tx.type === 'withdraw') {
    msg = `Withdrew ${tx.amount} ${tx.currency} from ${(tx.meta?.from ?? 'wallet')}`;
  } else if (tx.type === 'swap') {
    const rate = tx.meta?.rate ? ` at ${tx.meta.rate}` : '';
    msg = `Swapped ${tx.meta?.dlxSpent ?? ''} DLX to ${tx.amount} USDT${rate}`;
  } else if (tx.type === 'purchase') {
    msg = `Purchase completed: ${tx.amount} ${tx.currency}`;
  }
  if (msg) dispatchWalletNotification('transaction', msg, { tx });
}

export function onWalletUpdate(handler: () => void) {
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

export async function deposit(target: 'main' | 'purchase', currency: Exclude<Currency, 'DLX'>, amount: number) {
  if (amount <= 0) throw new Error('Amount must be positive');
  const balances = getBalances();
  balances[target][currency.toLowerCase() as 'inr' | 'usdt'] += amount;
  setBalances(balances);
  addTx({ id: uid(), type: 'deposit', currency, amount, status: 'success', createdAt: Date.now(), meta: { target } });
}

export async function withdraw(currency: Exclude<Currency, 'DLX'>, amount: number) {
  if (amount <= 0) throw new Error('Amount must be positive');
  const balances = getBalances();
  const key = currency.toLowerCase() as 'inr' | 'usdt';
  if (balances.main[key] < amount) throw new Error('Insufficient Main Wallet balance');
  balances.main[key] -= amount;
  setBalances(balances);
  addTx({ id: uid(), type: 'withdraw', currency, amount, status: 'success', createdAt: Date.now(), meta: { from: 'main' } });
}

export async function swapDLXtoUSDT(amountDLX: number) {
  if (amountDLX <= 0) throw new Error('Amount must be positive');
  const RATE = 0.1; // 1 DLX = 0.1 USDT
  const balances = getBalances();
  if (balances.dlx < amountDLX) throw new Error('Insufficient DLX');
  balances.dlx -= amountDLX;
  balances.purchase.usdt += amountDLX * RATE;
  setBalances(balances);
  addTx({ id: uid(), type: 'swap', currency: 'USDT', amount: amountDLX * RATE, status: 'success', createdAt: Date.now(), meta: { from: 'DLX', rate: RATE, dlxSpent: amountDLX } });
}

export async function purchase(amount: number, currency: Exclude<Currency, 'DLX'>) {
  if (amount <= 0) throw new Error('Amount must be positive');
  const balances = getBalances();
  const key = currency.toLowerCase() as 'inr' | 'usdt';
  const half = amount / 2;
  const useFromPurchase = Math.min(balances.purchase[key], half);
  const useFromMain = amount - useFromPurchase;
  if (balances.main[key] < useFromMain) throw new Error('Insufficient Main Wallet for purchase');
  balances.purchase[key] -= useFromPurchase;
  balances.main[key] -= useFromMain;
  setBalances(balances);
  addTx({ id: uid(), type: 'purchase', currency, amount, status: 'success', createdAt: Date.now(), meta: { main: useFromMain, purchase: useFromPurchase } });
}

export function syncMiningBalanceToWallet(dlx: number) {
  const prev = readJSON<number | null>(DLX_KEY, null);
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
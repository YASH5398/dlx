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

  // Fetch wallet balances
  useEffect(() => {
    if (!user) return;
    
    const walletRef = doc(firestore, "wallets", user.id);
    const unsub = onSnapshot(walletRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data() as any;
        setWalletBalances({
          mainUsdt: Number(data.mainUsdt || 0),
          purchaseUsdt: Number(data.purchaseUsdt || 0),
          mainInr: Number(data.mainInr || 0),
          purchaseInr: Number(data.purchaseInr || 0),
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
            const mainWallet = Number(w.mainUsdt || 0);
            if (mainWallet < paymentAmount) {
              throw new Error("Insufficient balance in main wallet. Please deposit more funds.");
            }
            tx.update(walletRef, { 
              mainUsdt: mainWallet - paymentAmount
            });
          } else {
            const mainWallet = Number(w.mainInr || 0);
            if (mainWallet < paymentAmount) {
              throw new Error("Insufficient balance in main wallet. Please deposit more funds.");
            }
            tx.update(walletRef, { 
              mainInr: mainWallet - paymentAmount
            });
          }
        } else if (purchaseOption === "split") {
          // Split 50/50 between main and purchase wallets, fallback to main wallet only if purchase wallet insufficient
          const halfAmount = Number((paymentAmount / 2).toFixed(2));
          
          if (currencyToUse === "USDT") {
            const mainWallet = Number(w.mainUsdt || 0);
            const purchaseWallet = Number(w.purchaseUsdt || 0);
            
            // Check if main wallet has enough for full amount
            if (mainWallet < paymentAmount) {
              throw new Error("Insufficient balance in main wallet. Please deposit more funds.");
            }
            
            // If purchase wallet has enough for 50%, split the payment
            if (purchaseWallet >= halfAmount) {
              tx.update(walletRef, { 
                mainUsdt: mainWallet - halfAmount, 
                purchaseUsdt: purchaseWallet - halfAmount 
              });
            } else {
              // Use only main wallet if purchase wallet is insufficient
              tx.update(walletRef, { 
                mainUsdt: mainWallet - paymentAmount
              });
            }
          } else {
            const halfAmountInr = Math.floor(paymentAmount / 2);
            const mainWallet = Number(w.mainInr || 0);
            const purchaseWallet = Number(w.purchaseInr || 0);
            
            // Check if main wallet has enough for full amount
            if (mainWallet < paymentAmount) {
              throw new Error("Insufficient balance in main wallet. Please deposit more funds.");
            }
            
            // If purchase wallet has enough for 50%, split the payment
            if (purchaseWallet >= halfAmountInr) {
              tx.update(walletRef, { 
                mainInr: mainWallet - halfAmountInr, 
                purchaseInr: purchaseWallet - halfAmountInr 
              });
            } else {
              // Use only main wallet if purchase wallet is insufficient
              tx.update(walletRef, { 
                mainInr: mainWallet - paymentAmount
              });
            }
          }
        } else if (purchaseOption === "currency_choice") {
          // Pay from main wallet with chosen currency
          if (currencyToUse === "USDT") {
            const mainWallet = Number(w.mainUsdt || 0);
            if (mainWallet < paymentAmount) {
              throw new Error("Insufficient balance in main wallet. Please deposit more funds.");
            }
            tx.update(walletRef, { 
              mainUsdt: mainWallet - paymentAmount
            });
          } else {
            const mainWallet = Number(w.mainInr || 0);
            if (mainWallet < paymentAmount) {
              throw new Error("Insufficient balance in main wallet. Please deposit more funds.");
            }
            tx.update(walletRef, { 
              mainInr: mainWallet - paymentAmount
            });
          }
        }

        // Handle affiliate commission (always in USDT)
        if (affiliateId) {
          const affRef = doc(firestore, "wallets", affiliateId);
          const affSnap = await tx.get(affRef);
          const affMain = Number((affSnap.data() as any)?.mainUsdt || 0);
          tx.update(affRef, { mainUsdt: Number((affMain + commissionUsd).toFixed(2)) });
        }

        // Create order document with required fields
        await addDoc(ordersRef, {
          userId: user.id,
          productId: selectedProduct.id,
          productName: selectedProduct.title,
          productPrice: productPrice,
          productLink: (selectedProduct as any).downloadUrl ?? (selectedProduct as any).productLink ?? "",
          status: "completed", // Changed to completed since payment is successful
          purchaseOption: purchaseOption,
          currency: currencyToUse,
          createdAt: serverTimestamp(),
        });
      });

      setToast({ message: "Purchase successful! Access link available in Orders.", type: "success" });
      setTimeout(() => setToast(null), 2500);
      setShowModal(false);
      setSelectedProduct(null);
    } catch (e: any) {
      setToast({ message: e?.message || "Payment failed. Please try again.", type: "error" });
      setTimeout(() => setToast(null), 3000);
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
                  <div className="text-2xl font-bold text-purple-400">$2-$8</div>
                  <div className="text-xs text-gray-400">Price Range</div>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-pink-600/10 to-pink-700/10 border border-pink-500/20 rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-pink-500/20 rounded-xl">
                  <TrendingUp className="w-6 h-6 text-pink-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-pink-400">70%</div>
                  <div className="text-xs text-gray-400">Commission</div>
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
                      <label className="flex items-center space-x-3 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 cursor-pointer">
                        <input
                          type="radio"
                          name="purchaseOption"
                          value="main_only"
                          checked={purchaseOption === "main_only"}
                          onChange={(e) => setPurchaseOption(e.target.value as any)}
                          className="w-4 h-4 text-blue-600"
                        />
                        <div>
                          <div className="font-medium">Main Wallet Only</div>
                          <div className="text-sm text-gray-400">Pay from main wallet only</div>
                        </div>
                      </label>
                      
                      <label className="flex items-center space-x-3 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 cursor-pointer">
                        <input
                          type="radio"
                          name="purchaseOption"
                          value="split"
                          checked={purchaseOption === "split"}
                          onChange={(e) => setPurchaseOption(e.target.value as any)}
                          className="w-4 h-4 text-blue-600"
                        />
                        <div>
                          <div className="font-medium">50% Main + 50% Purchase</div>
                          <div className="text-sm text-gray-400">Split payment between both wallets</div>
                        </div>
                      </label>
                      
                      <label className="flex items-center space-x-3 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 cursor-pointer">
                        <input
                          type="radio"
                          name="purchaseOption"
                          value="currency_choice"
                          checked={purchaseOption === "currency_choice"}
                          onChange={(e) => setPurchaseOption(e.target.value as any)}
                          className="w-4 h-4 text-blue-600"
                        />
                        <div>
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
                      <select
                        className="w-full rounded-xl bg-black/40 border border-white/20 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value as Currency)}
                      >
                        <option value="USDT">USDT</option>
                        <option value="INR">INR</option>
                      </select>
                    </div>
                  )}
                </div>

                {/* Price Summary */}
                <div className="bg-gradient-to-br from-blue-600/10 to-purple-600/10 border border-blue-500/20 rounded-xl p-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-400">Price</span>
                    <span className="font-semibold">
                      ${selectedProduct.priceUsd.toFixed(2)} USD
                    </span>
                  </div>
                  {currency === "INR" && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Equivalent</span>
                      <span className="text-gray-300">
                        ₹{Math.round(Number((selectedProduct as any).priceUsd ?? (selectedProduct as any).price ?? 0) * USD_TO_INR)}
                      </span>
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
                  disabled={processing}
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
    </div>
  );
}
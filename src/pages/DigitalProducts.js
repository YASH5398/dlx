import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import { collection, doc, getDocs, onSnapshot, addDoc, runTransaction, serverTimestamp, query, } from "firebase/firestore";
import { useUser } from "../context/UserContext";
import { firestore } from "../firebase"; // Firestore instance
import { ShoppingCart, Share2, Plus, CheckCircle, AlertCircle, X, Download, Sparkles, TrendingUp, Package, DollarSign, } from "lucide-react";
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
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [currency, setCurrency] = useState("USDT");
    const [useSplit, setUseSplit] = useState(false);
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
    const isAffiliate = !!user;
    useEffect(() => {
        const productsRef = collection(firestore, "digitalProducts");
        const q = query(productsRef);
        const unsub = onSnapshot(q, (snap) => {
            const list = snap.docs.map((d) => {
                const data = d.data();
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
    const doPurchase = async () => {
        if (!user || !selectedProduct)
            return;
        setProcessing(true);
        const walletRef = doc(firestore, "wallets", user.id);
        const ordersRef = collection(firestore, "orders");
        const affiliateId = referrerId && referrerId !== user.id ? referrerId : undefined;
        const amountUsd = Number(selectedProduct.priceUsd ?? selectedProduct.price ?? 0);
        const amountInr = Math.round(amountUsd * USD_TO_INR);
        const commissionUsd = Number((amountUsd * 0.7).toFixed(2));
        try {
            await runTransaction(firestore, async (tx) => {
                const walletSnap = await tx.get(walletRef);
                if (!walletSnap.exists()) {
                    throw new Error("Wallet not found. Please set up your wallet first.");
                }
                const w = walletSnap.data();
                if (currency === "USDT") {
                    const main = Number(w.mainUsdt || 0);
                    const purchase = Number(w.purchaseUsdt || 0);
                    if (useSplit) {
                        const half = Number((amountUsd / 2).toFixed(2));
                        if (purchase < half || main < half)
                            throw new Error("Insufficient USDT in wallets for split.");
                        tx.update(walletRef, { mainUsdt: main - half, purchaseUsdt: purchase - half });
                    }
                    else {
                        if (main < amountUsd)
                            throw new Error("Insufficient USDT in Main Wallet.");
                        tx.update(walletRef, { mainUsdt: main - amountUsd });
                    }
                }
                else {
                    const main = Number(w.mainInr || 0);
                    const purchase = Number(w.purchaseInr || 0);
                    if (useSplit) {
                        const half = Math.floor(amountInr / 2);
                        if (purchase < half || main < half)
                            throw new Error("Insufficient INR in wallets for split.");
                        tx.update(walletRef, { mainInr: main - half, purchaseInr: purchase - half });
                    }
                    else {
                        if (main < amountInr)
                            throw new Error("Insufficient INR in Main Wallet.");
                        tx.update(walletRef, { mainInr: main - amountInr });
                    }
                }
                if (affiliateId) {
                    const affRef = doc(firestore, "wallets", affiliateId);
                    const affSnap = await tx.get(affRef);
                    const affMain = Number(affSnap.data()?.mainUsdt || 0);
                    tx.update(affRef, { mainUsdt: Number((affMain + commissionUsd).toFixed(2)) });
                }
                await addDoc(ordersRef, {
                    userId: user.id,
                    productId: selectedProduct.id,
                    productTitle: selectedProduct.title,
                    paymentMode: currency,
                    amountUsd,
                    amountInr,
                    status: "Completed",
                    timestamp: serverTimestamp(),
                    downloadUrl: selectedProduct.downloadUrl ?? selectedProduct.productLink ?? "",
                    affiliateId: affiliateId || null,
                    split: useSplit,
                });
            });
            setToast({ message: "Purchase successful. Access link available in Orders.", type: "success" });
            setTimeout(() => setToast(null), 2500);
            setShowModal(false);
            setSelectedProduct(null);
        }
        catch (e) {
            setToast({ message: e?.message || "Payment failed. Try again.", type: "error" });
            setTimeout(() => setToast(null), 3000);
        }
        finally {
            setProcessing(false);
        }
    };
    const submitNewProduct = async (e) => {
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
        }
        catch (err) {
            setToast({ message: err?.message || "Submission failed. Try again.", type: "error" });
            setTimeout(() => setToast(null), 3000);
        }
        finally {
            setAddingProduct(false);
        }
    };
    const visibleProducts = products.filter((p) => p.status === "approved");
    return (_jsxs("div", { className: "min-h-screen bg-gradient-to-br from-[#0a0d1f] via-[#0d1226] to-[#050812] text-white", children: [_jsxs("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12", children: [_jsxs(motion.div, { initial: { opacity: 0, y: -20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.6 }, className: "mb-10", children: [_jsxs("div", { className: "flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-6", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight mb-3 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent", children: "Digital Products Marketplace" }), _jsx("p", { className: "text-gray-400 text-base sm:text-lg max-w-2xl", children: "Discover premium digital products to boost your business and skills" })] }), _jsx("button", { onClick: () => setAddingProduct((s) => !s), className: "flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 transition-all duration-300 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 font-semibold", children: addingProduct ? (_jsxs(_Fragment, { children: [_jsx(X, { className: "w-5 h-5" }), _jsx("span", { children: "Close" })] })) : (_jsxs(_Fragment, { children: [_jsx(Plus, { className: "w-5 h-5" }), _jsx("span", { children: "Add Product" })] })) })] }), _jsxs("div", { className: "grid grid-cols-2 lg:grid-cols-4 gap-4", children: [_jsx("div", { className: "bg-gradient-to-br from-blue-600/10 to-blue-700/10 border border-blue-500/20 rounded-2xl p-4", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "p-2 bg-blue-500/20 rounded-xl", children: _jsx(Package, { className: "w-6 h-6 text-blue-400" }) }), _jsxs("div", { children: [_jsx("div", { className: "text-2xl font-bold text-blue-400", children: visibleProducts.length }), _jsx("div", { className: "text-xs text-gray-400", children: "Products" })] })] }) }), _jsx("div", { className: "bg-gradient-to-br from-purple-600/10 to-purple-700/10 border border-purple-500/20 rounded-2xl p-4", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "p-2 bg-purple-500/20 rounded-xl", children: _jsx(DollarSign, { className: "w-6 h-6 text-purple-400" }) }), _jsxs("div", { children: [_jsx("div", { className: "text-2xl font-bold text-purple-400", children: "$2-$8" }), _jsx("div", { className: "text-xs text-gray-400", children: "Price Range" })] })] }) }), _jsx("div", { className: "bg-gradient-to-br from-pink-600/10 to-pink-700/10 border border-pink-500/20 rounded-2xl p-4", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "p-2 bg-pink-500/20 rounded-xl", children: _jsx(TrendingUp, { className: "w-6 h-6 text-pink-400" }) }), _jsxs("div", { children: [_jsx("div", { className: "text-2xl font-bold text-pink-400", children: "70%" }), _jsx("div", { className: "text-xs text-gray-400", children: "Commission" })] })] }) }), _jsx("div", { className: "bg-gradient-to-br from-green-600/10 to-green-700/10 border border-green-500/20 rounded-2xl p-4", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "p-2 bg-green-500/20 rounded-xl", children: _jsx(Sparkles, { className: "w-6 h-6 text-green-400" }) }), _jsxs("div", { children: [_jsx("div", { className: "text-2xl font-bold text-green-400", children: "Instant" }), _jsx("div", { className: "text-xs text-gray-400", children: "Delivery" })] })] }) })] })] }), _jsx(AnimatePresence, { children: toast && (_jsxs(motion.div, { initial: { opacity: 0, y: -20 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -20 }, className: `mb-6 rounded-2xl px-6 py-4 border ${toast.type === "success"
                                ? "bg-green-500/10 border-green-500/30 text-green-400"
                                : "bg-red-500/10 border-red-500/30 text-red-400"} backdrop-blur-sm flex items-center gap-3 shadow-lg`, children: [toast.type === "success" ? (_jsx(CheckCircle, { className: "w-5 h-5" })) : (_jsx(AlertCircle, { className: "w-5 h-5" })), _jsx("span", { className: "font-medium", children: toast.message })] })) }), _jsx(AnimatePresence, { children: addingProduct && (_jsx(motion.div, { initial: { opacity: 0, height: 0 }, animate: { opacity: 1, height: "auto" }, exit: { opacity: 0, height: 0 }, transition: { duration: 0.3 }, className: "mb-10 overflow-hidden", children: _jsxs("form", { onSubmit: submitNewProduct, className: "bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-white/10 rounded-2xl p-6 lg:p-8 backdrop-blur-sm shadow-2xl", children: [_jsxs("h3", { className: "text-2xl font-bold mb-6 flex items-center gap-2", children: [_jsx(Sparkles, { className: "w-6 h-6 text-blue-400" }), "Submit Your Product"] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-300 mb-2", children: "Product Name *" }), _jsx("input", { placeholder: "e.g., Premium WordPress Bundle", className: "w-full rounded-xl bg-black/40 border border-white/20 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all", value: newProduct.title, onChange: (e) => setNewProduct((p) => ({ ...p, title: e.target.value })), required: true })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-300 mb-2", children: "Price (USD) *" }), _jsx("input", { placeholder: "e.g., 5.99", className: "w-full rounded-xl bg-black/40 border border-white/20 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all", type: "number", min: 2, max: 8, step: "0.01", value: newProduct.priceUsd, onChange: (e) => setNewProduct((p) => ({ ...p, priceUsd: e.target.value })), required: true })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-300 mb-2", children: "Category" }), _jsx("input", { placeholder: "e.g., Development, Marketing", className: "w-full rounded-xl bg-black/40 border border-white/20 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all", value: newProduct.category, onChange: (e) => setNewProduct((p) => ({ ...p, category: e.target.value })) })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-300 mb-2", children: "Thumbnail URL" }), _jsx("input", { placeholder: "https://example.com/image.jpg", className: "w-full rounded-xl bg-black/40 border border-white/20 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all", value: newProduct.thumbnailUrl, onChange: (e) => setNewProduct((p) => ({ ...p, thumbnailUrl: e.target.value })) })] }), _jsxs("div", { className: "lg:col-span-2", children: [_jsx("label", { className: "block text-sm font-medium text-gray-300 mb-2", children: "Download File / Link" }), _jsx("input", { placeholder: "https://drive.google.com/...", className: "w-full rounded-xl bg-black/40 border border-white/20 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all", value: newProduct.downloadUrl, onChange: (e) => setNewProduct((p) => ({ ...p, downloadUrl: e.target.value })) })] }), _jsxs("div", { className: "lg:col-span-2", children: [_jsx("label", { className: "block text-sm font-medium text-gray-300 mb-2", children: "Description *" }), _jsx("textarea", { placeholder: "Detailed description of your product...", className: "w-full rounded-xl bg-black/40 border border-white/20 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none", rows: 4, value: newProduct.description, onChange: (e) => setNewProduct((p) => ({ ...p, description: e.target.value })), required: true })] })] }), _jsx("button", { type: "submit", className: "mt-6 w-full px-6 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 transition-all duration-300 font-semibold text-lg shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed", disabled: processing, children: processing ? "Submitting..." : "Submit for Review" })] }) })) }), loading ? (_jsx("div", { className: "flex items-center justify-center py-20", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" }), _jsx("p", { className: "text-gray-400", children: "Loading amazing products..." })] }) })) : (_jsx(motion.div, { variants: gridVariants, initial: "hidden", animate: "visible", className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8", children: visibleProducts.map((product) => (_jsxs(motion.div, { variants: cardVariants, className: "group relative bg-gradient-to-br from-[#0d1226] to-[#0a0d1f] rounded-2xl border border-white/10 overflow-hidden shadow-xl hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-500 hover:-translate-y-2", children: [_jsxs("div", { className: "relative aspect-video overflow-hidden bg-gradient-to-br from-blue-900/20 to-purple-900/20", children: [product.thumbnailUrl ? (_jsx("img", { src: product.thumbnailUrl, alt: product.title, className: "w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" })) : (_jsx("div", { className: "w-full h-full flex items-center justify-center", children: _jsx(Package, { className: "w-16 h-16 text-white/20" }) })), _jsx("div", { className: "absolute inset-0 bg-gradient-to-t from-[#0a0d1f] via-transparent to-transparent opacity-60" }), product.category && (_jsx("div", { className: "absolute top-4 right-4", children: _jsx("span", { className: "px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 backdrop-blur-sm border border-blue-400/30 text-blue-300", children: product.category }) }))] }), _jsxs("div", { className: "p-6", children: [_jsx("h3", { className: "text-xl font-bold mb-2 line-clamp-1 group-hover:text-blue-400 transition-colors", children: product.title }), _jsx("p", { className: "text-gray-400 text-sm mb-4 line-clamp-2", children: product.description }), _jsxs("div", { className: "flex items-center justify-between pt-4 border-t border-white/10", children: [_jsxs("div", { children: [_jsxs("div", { className: "text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent", children: ["$", Number(product.priceUsd ?? product.price ?? 0).toFixed(2)] }), _jsx("div", { className: "text-xs text-gray-500", children: "USD" })] }), _jsxs("div", { className: "flex items-center gap-2", children: [isAffiliate && (_jsx("button", { onClick: () => {
                                                                try {
                                                                    const base = typeof window !== 'undefined' ? window.location.origin : 'https://digilinex.com';
                                                                    const link = `${base}/dashboard/digital-products?ref=${user?.id ?? ''}`;
                                                                    navigator.clipboard.writeText(link)
                                                                        .then(() => setToast({ message: 'Referral link copied!', type: 'success' }))
                                                                        .catch(() => setToast({ message: 'Unable to copy. Share manually.', type: 'error' }));
                                                                }
                                                                catch {
                                                                    setToast({ message: 'Unable to copy. Share manually.', type: 'error' });
                                                                }
                                                                finally {
                                                                    setTimeout(() => setToast(null), 2500);
                                                                }
                                                            }, className: "p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-blue-400/50 transition-all duration-300 group/share", title: "Share & Earn", children: _jsx(Share2, { className: "w-4 h-4 text-gray-400 group-hover/share:text-blue-400 transition-colors" }) })), _jsxs("button", { onClick: () => { setSelectedProduct(product); setShowModal(true); }, className: "flex items-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 transition-all duration-300 font-semibold text-sm shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50", children: [_jsx(ShoppingCart, { className: "w-4 h-4" }), _jsx("span", { children: "Buy Now" })] })] })] })] })] }, product.id))) })), !loading && visibleProducts.length === 0 && (_jsxs(motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, className: "text-center py-20", children: [_jsx(Package, { className: "w-20 h-20 text-gray-600 mx-auto mb-4" }), _jsx("h3", { className: "text-2xl font-bold mb-2", children: "No Products Yet" }), _jsx("p", { className: "text-gray-400 mb-6", children: "Be the first to add a product!" }), _jsx("button", { onClick: () => setAddingProduct(true), className: "px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 transition-all duration-300 font-semibold", children: "Add Your First Product" })] }))] }), _jsx(AnimatePresence, { children: showModal && selectedProduct && (_jsx(motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, className: "fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4", onClick: () => { setShowModal(false); setSelectedProduct(null); }, children: _jsxs(motion.div, { variants: modalVariants, initial: "hidden", animate: "visible", exit: "exit", onClick: (e) => e.stopPropagation(), className: "w-full max-w-lg bg-gradient-to-br from-[#0d1226] to-[#0a0d1f] border border-white/20 rounded-2xl shadow-2xl overflow-hidden", children: [_jsx("div", { className: "bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-b border-white/10 px-6 py-5", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("h2", { className: "text-2xl font-bold flex items-center gap-2", children: [_jsx(ShoppingCart, { className: "w-6 h-6 text-blue-400" }), "Checkout"] }), _jsx("button", { onClick: () => { setShowModal(false); setSelectedProduct(null); }, className: "p-2 rounded-xl hover:bg-white/10 transition-colors", children: _jsx(X, { className: "w-5 h-5" }) })] }) }), _jsxs("div", { className: "p-6 space-y-6", children: [_jsxs("div", { className: "bg-white/5 border border-white/10 rounded-xl p-4", children: [_jsx("div", { className: "text-sm text-gray-400 mb-1", children: "Product" }), _jsx("div", { className: "text-lg font-semibold", children: selectedProduct.title })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-300 mb-2", children: "Currency" }), _jsxs("select", { className: "w-full rounded-xl bg-black/40 border border-white/20 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all", value: currency, onChange: (e) => setCurrency(e.target.value), children: [_jsx("option", { value: "USDT", children: "USDT" }), _jsx("option", { value: "INR", children: "INR" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-300 mb-2", children: "Payment Method" }), _jsxs("select", { className: "w-full rounded-xl bg-black/40 border border-white/20 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all", value: useSplit ? "split" : "main", onChange: (e) => setUseSplit(e.target.value === "split"), children: [_jsx("option", { value: "main", children: "Main Wallet" }), _jsx("option", { value: "split", children: "50% Purchase + 50% Main" })] })] })] }), _jsxs("div", { className: "bg-gradient-to-br from-blue-600/10 to-purple-600/10 border border-blue-500/20 rounded-xl p-5", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("span", { className: "text-gray-400", children: "Price" }), _jsxs("span", { className: "font-semibold", children: ["$", selectedProduct.priceUsd.toFixed(2), " USD"] })] }), currency === "INR" && (_jsxs("div", { className: "flex items-center justify-between text-sm", children: [_jsx("span", { className: "text-gray-400", children: "Equivalent" }), _jsxs("span", { className: "text-gray-300", children: ["\u20B9", Math.round(Number(selectedProduct.priceUsd ?? selectedProduct.price ?? 0) * USD_TO_INR)] })] }))] }), _jsxs("div", { className: "bg-green-500/10 border border-green-500/30 rounded-xl p-4 flex gap-3", children: [_jsx(Download, { className: "w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" }), _jsx("div", { className: "text-sm text-green-300", children: "You'll get instant access to download this product after successful payment." })] })] }), _jsxs("div", { className: "bg-white/5 border-t border-white/10 px-6 py-5 flex items-center justify-end gap-3", children: [_jsx("button", { onClick: () => { setShowModal(false); setSelectedProduct(null); }, className: "px-6 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300 font-semibold", disabled: processing, children: "Cancel" }), _jsx("button", { onClick: doPurchase, className: "px-6 py-3 rounded-xl bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 transition-all duration-300 font-semibold shadow-lg shadow-green-500/30 hover:shadow-green-500/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2", disabled: processing, children: processing ? (_jsxs(_Fragment, { children: [_jsx("div", { className: "w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" }), _jsx("span", { children: "Processing..." })] })) : (_jsxs(_Fragment, { children: [_jsx(CheckCircle, { className: "w-5 h-5" }), _jsx("span", { children: "Complete Purchase" })] })) })] })] }) })) })] }));
}

import React, { useEffect, useState, useMemo } from 'react';
import { firestore } from '../../firebase';
import { collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc, serverTimestamp, setDoc, query, orderBy } from 'firebase/firestore';
import { toast } from 'react-toastify';
import { 
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  PhotoIcon,
  LinkIcon,
  CurrencyDollarIcon,
  TagIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

type Product = { 
  id: string; 
  name: string; 
  title?: string; 
  description?: string; 
  price: number; 
  link?: string; 
  image?: string; 
  status?: 'active'|'inactive';
  createdAt?: any;
  updatedAt?: any;
  category?: string;
  tags?: string[];
};

export default function AdminProducts() {
  const [rows, setRows] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all'|'active'|'inactive'>('all');
  const [sortBy, setSortBy] = useState<'name'|'price'|'created'|'status'>('created');
  const [sortOrder, setSortOrder] = useState<'asc'|'desc'>('desc');
  const [viewMode, setViewMode] = useState<'grid'|'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<{ 
    name: string; 
    title: string; 
    description: string; 
    price: number; 
    link: string; 
    image: string; 
    status: 'active'|'inactive';
    category: string;
    tags: string;
  }>({ 
    name: '', 
    title: '', 
    description: '', 
    price: 0, 
    link: '', 
    image: '', 
    status: 'active',
    category: '',
    tags: ''
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLoading(true);
    const q = query(collection(firestore, 'products'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const arr: Product[] = [];
      snap.forEach((docSnap) => {
        const d: any = docSnap.data() || {};
        arr.push({ 
          id: docSnap.id, 
          name: d.name || d.title || '-', 
          title: d.title || '', 
          description: d.description || '', 
          price: Number(d.price || d.priceUsd || 0), 
          link: d.link || d.downloadUrl || '', 
          image: d.image || d.thumbnailUrl || '', 
          status: (d.status || 'active'),
          createdAt: d.createdAt,
          updatedAt: d.updatedAt,
          category: d.category || '',
          tags: d.tags || []
        });
      });
      setRows(arr);
      setLoading(false);
    }, (err) => {
      console.error('Failed to stream products:', err);
      toast.error('Failed to load products');
      setLoading(false);
    });
    return () => { try { unsub(); } catch {} };
  }, []);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let filtered = rows;

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(searchLower) ||
        product.title?.toLowerCase().includes(searchLower) ||
        product.description?.toLowerCase().includes(searchLower) ||
        product.category?.toLowerCase().includes(searchLower)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(product => product.status === statusFilter);
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'price':
          comparison = a.price - b.price;
          break;
        case 'status':
          comparison = (a.status || '').localeCompare(b.status || '');
          break;
        case 'created':
          const aTime = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
          const bTime = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
          comparison = aTime - bTime;
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [rows, search, statusFilter, sortBy, sortOrder]);

  const resetForm = () => { 
    setForm({ 
      name: '', 
      title: '', 
      description: '', 
      price: 0, 
      link: '', 
      image: '', 
      status: 'active',
      category: '',
      tags: ''
    }); 
    setEditingId(null); 
    setShowForm(false);
  };

  const onEdit = (p: Product) => {
    setEditingId(p.id);
    setForm({ 
      name: p.name || '', 
      title: p.title || '', 
      description: p.description || '', 
      price: Number(p.price||0), 
      link: p.link || '', 
      image: p.image || '', 
      status: (p.status as any) || 'active',
      category: p.category || '',
      tags: Array.isArray(p.tags) ? p.tags.join(', ') : ''
    });
    setShowForm(true);
  };

  const saveProduct = async () => {
    setSaving(true);
    const tagsArray = form.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
    const data = { 
      name: form.name.trim(), 
      title: form.title.trim(), 
      description: form.description.trim(), 
      price: Number(form.price || 0), 
      link: form.link.trim(), 
      image: form.image.trim(), 
      status: form.status,
      category: form.category.trim(),
      tags: tagsArray,
      updatedAt: serverTimestamp() 
    };
    try {
      if (!data.name) { toast.error('Name is required'); return; }
      if (editingId) {
        await updateDoc(doc(firestore, 'products', editingId), data);
        toast.success('Product updated');
      } else {
        const docRef = await addDoc(collection(firestore, 'products'), { ...data, createdAt: serverTimestamp() });
        toast.success('Product created');
        await setDoc(doc(firestore, 'products', docRef.id), { id: docRef.id }, { merge: true });
      }
      resetForm();
    } catch (e) {
      console.error(e);
      toast.error('Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const removeProduct = async (id: string) => {
    if (!confirm('Delete this product?')) return;
    try {
      await deleteDoc(doc(firestore, 'products', id));
      toast.success('Product deleted');
      if (editingId === id) resetForm();
    } catch (e) {
      console.error(e);
      toast.error('Failed to delete product');
    }
  };

  const toggleStatus = async (p: Product) => {
    try {
      const next = (p.status === 'active') ? 'inactive' : 'active';
      await updateDoc(doc(firestore, 'products', p.id), { status: next, updatedAt: serverTimestamp() });
      toast.success(`Product ${next}`);
    } catch (e) {
      console.error(e);
      toast.error('Failed to update status');
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'active' 
      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
      : 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50';
  };

  const getStatusIcon = (status: string) => {
    return status === 'active' ? CheckCircleIcon : XCircleIcon;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-800 rounded w-64 mb-4"></div>
            <div className="h-4 bg-gray-800 rounded w-96 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-gray-800 rounded-xl p-6">
                  <div className="h-4 bg-gray-700 rounded w-32 mb-2"></div>
                  <div className="h-6 bg-gray-700 rounded w-24 mb-3"></div>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-700 rounded w-full"></div>
                    <div className="h-3 bg-gray-700 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div className="flex-1">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Product Management
            </h1>
            <p className="text-gray-400 text-sm sm:text-base">Manage your digital products and services</p>
            <div className="flex items-center gap-2 mt-3">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-400">Live updates</span>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mt-6 lg:mt-0">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-all duration-200 ${
                  viewMode === 'grid' 
                    ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30' 
                    : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700/50 hover:text-white border border-gray-700/50'
                }`}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-all duration-200 ${
                  viewMode === 'list' 
                    ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30' 
                    : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700/50 hover:text-white border border-gray-700/50'
                }`}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 hover:text-white border border-gray-700/50 hover:border-gray-600/50 rounded-lg text-sm font-medium transition-all duration-200"
            >
              <FunnelIcon className="w-4 h-4" />
              {showFilters ? 'Hide Filters' : 'Filters'}
              {showFilters ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
            </button>

            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 hover:text-blue-200 border border-blue-500/30 hover:border-blue-500/50 rounded-lg text-sm font-medium transition-all duration-200"
            >
              <PlusIcon className="w-4 h-4" />
              Add Product
            </button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="bg-gradient-to-br from-gray-800/30 to-gray-900/30 border border-gray-700/50 rounded-xl p-4 sm:p-6 mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Search</label>
                <div className="relative">
                  <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search products..."
                    className="w-full pl-10 pr-4 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 text-sm"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Sort By</label>
                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [field, order] = e.target.value.split('-');
                    setSortBy(field as any);
                    setSortOrder(order as any);
                  }}
                  className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 text-sm"
                >
                  <option value="created-desc">Date (Newest)</option>
                  <option value="created-asc">Date (Oldest)</option>
                  <option value="name-asc">Name (A-Z)</option>
                  <option value="name-desc">Name (Z-A)</option>
                  <option value="price-desc">Price (Highest)</option>
                  <option value="price-asc">Price (Lowest)</option>
                  <option value="status-asc">Status (A-Z)</option>
                  <option value="status-desc">Status (Z-A)</option>
                </select>
              </div>
              
              <div className="sm:col-span-2 lg:col-span-1">
                <label className="block text-sm font-medium text-gray-300 mb-2">Quick Actions</label>
                <div className="flex gap-2">
                  <button className="px-3 py-2 bg-blue-600/20 text-blue-300 border border-blue-500/30 rounded-lg text-xs font-medium hover:bg-blue-600/30 transition-colors">
                    Export
                  </button>
                  <button className="px-3 py-2 bg-green-600/20 text-green-300 border border-green-500/30 rounded-lg text-xs font-medium hover:bg-green-600/30 transition-colors">
                    Bulk Actions
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 border border-blue-500/30 rounded-lg p-3 sm:p-4">
            <div className="text-xl sm:text-2xl font-bold text-blue-300">{filteredProducts.length}</div>
            <div className="text-xs sm:text-sm text-blue-200">Total Products</div>
          </div>
          <div className="bg-gradient-to-br from-green-600/20 to-green-800/20 border border-green-500/30 rounded-lg p-3 sm:p-4">
            <div className="text-xl sm:text-2xl font-bold text-green-300">
              {filteredProducts.filter(p => p.status === 'active').length}
            </div>
            <div className="text-xs sm:text-sm text-green-200">Active</div>
          </div>
          <div className="bg-gradient-to-br from-yellow-600/20 to-yellow-800/20 border border-yellow-500/30 rounded-lg p-3 sm:p-4">
            <div className="text-xl sm:text-2xl font-bold text-yellow-300">
              {filteredProducts.filter(p => p.status === 'inactive').length}
            </div>
            <div className="text-xs sm:text-sm text-yellow-200">Inactive</div>
          </div>
          <div className="bg-gradient-to-br from-purple-600/20 to-purple-800/20 border border-purple-500/30 rounded-lg p-3 sm:p-4">
            <div className="text-xl sm:text-2xl font-bold text-purple-300">
              ${filteredProducts.reduce((sum, p) => sum + p.price, 0).toFixed(2)}
            </div>
            <div className="text-xs sm:text-sm text-purple-200">Total Value</div>
          </div>
        </div>

        {/* Products Display */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} onEdit={onEdit} onToggleStatus={toggleStatus} onDelete={removeProduct} />
            ))}
          </div>
        ) : (
          <ProductTable products={filteredProducts} onEdit={onEdit} onToggleStatus={toggleStatus} onDelete={removeProduct} />
        )}

        {/* Empty State */}
        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <PhotoIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-300 mb-2">No products found</h3>
            <p className="text-gray-500">
              {search || statusFilter !== 'all'
                ? 'Try adjusting your filters to see more products.'
                : 'No products have been created yet.'}
            </p>
          </div>
        )}

        {/* Product Form Modal */}
        {showForm && (
          <ProductFormModal 
            form={form} 
            setForm={setForm} 
            editingId={editingId}
            saving={saving}
            onSave={saveProduct} 
            onCancel={resetForm} 
          />
        )}
      </div>
    </div>
  );
}

// Product Card Component
const ProductCard = ({ product, onEdit, onToggleStatus, onDelete }: { 
  product: Product; 
  onEdit: (product: Product) => void; 
  onToggleStatus: (product: Product) => void; 
  onDelete: (id: string) => void; 
}) => {
  const StatusIcon = product.status === 'active' ? CheckCircleIcon : XCircleIcon;
  
  return (
    <div className="group relative bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50 rounded-xl p-6 hover:border-gray-600/50 transition-all duration-300 hover:shadow-xl hover:shadow-gray-900/20">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <PhotoIcon className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-white group-hover:text-blue-300 transition-colors">
                {product.name}
              </h3>
              {product.title && (
                <p className="text-sm text-gray-400">{product.title}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2 mb-3">
            <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium border ${
              product.status === 'active' 
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                : 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50'
            }`}>
              <StatusIcon className="w-3 h-3" />
              {product.status?.toUpperCase()}
            </div>
            {product.category && (
              <span className="text-xs text-gray-400 bg-gray-700/50 px-2 py-1 rounded">
                {product.category}
              </span>
            )}
          </div>
        </div>
      </div>

      {product.image && (
        <div className="mb-4">
          <img 
            src={product.image} 
            alt={product.name} 
            className="w-full h-32 object-cover rounded-lg"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
      )}

      <div className="space-y-3 mb-4">
        {product.description && (
          <div className="text-sm text-gray-300 line-clamp-3">
            {product.description}
          </div>
        )}
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">Price</span>
          <span className="text-lg font-semibold text-emerald-400">
            ${product.price.toFixed(2)}
          </span>
        </div>
        
        {product.tags && product.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {product.tags.slice(0, 3).map((tag, index) => (
              <span key={index} className="text-xs text-blue-300 bg-blue-500/20 px-2 py-1 rounded">
                {tag}
              </span>
            ))}
            {product.tags.length > 3 && (
              <span className="text-xs text-gray-400">+{product.tags.length - 3} more</span>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onEdit(product)}
          className="flex-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 hover:text-blue-200 border border-blue-500/30 hover:border-blue-500/50 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2"
        >
          <PencilIcon className="w-4 h-4" />
          Edit
        </button>
        
        <button
          onClick={() => onToggleStatus(product)}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
            product.status === 'active'
              ? 'bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-300 hover:text-yellow-200 border border-yellow-500/30 hover:border-yellow-500/50'
              : 'bg-green-600/20 hover:bg-green-600/30 text-green-300 hover:text-green-200 border border-green-500/30 hover:border-green-500/50'
          }`}
        >
          {product.status === 'active' ? (
            <>
              <XCircleIcon className="w-4 h-4" />
              Deactivate
            </>
          ) : (
            <>
              <CheckCircleIcon className="w-4 h-4" />
              Activate
            </>
          )}
        </button>
        
        <button
          onClick={() => onDelete(product.id)}
          className="px-3 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-300 hover:text-red-200 border border-red-500/30 hover:border-red-500/50 rounded-lg text-sm font-medium transition-all duration-200"
        >
          <TrashIcon className="w-4 h-4" />
        </button>
      </div>

      {product.link && (
        <div className="mt-3 pt-3 border-t border-gray-700/50">
          <a
            href={product.link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-xs text-blue-300 hover:text-blue-200 transition-colors"
          >
            <LinkIcon className="w-3 h-3" />
            View Link
          </a>
        </div>
      )}
    </div>
  );
};

// Product Table Component
const ProductTable = ({ products, onEdit, onToggleStatus, onDelete }: { 
  products: Product[]; 
  onEdit: (product: Product) => void; 
  onToggleStatus: (product: Product) => void; 
  onDelete: (id: string) => void; 
}) => (
  <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl overflow-hidden">
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-700/50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Product</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Price</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Category</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-700/50">
          {products.map((product) => {
            const StatusIcon = product.status === 'active' ? CheckCircleIcon : XCircleIcon;
            return (
              <tr key={product.id} className="hover:bg-gray-700/30 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <PhotoIcon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">{product.name}</div>
                      {product.title && (
                        <div className="text-sm text-gray-400">{product.title}</div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium border ${
                    product.status === 'active' 
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                      : 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50'
                  }`}>
                    <StatusIcon className="w-3 h-3" />
                    {product.status?.toUpperCase()}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-semibold text-emerald-400">${product.price.toFixed(2)}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-300">{product.category || '-'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onEdit(product)}
                      className="text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onToggleStatus(product)}
                      className={`transition-colors ${
                        product.status === 'active'
                          ? 'text-yellow-400 hover:text-yellow-300'
                          : 'text-green-400 hover:text-green-300'
                      }`}
                    >
                      {product.status === 'active' ? <XCircleIcon className="w-4 h-4" /> : <CheckCircleIcon className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => onDelete(product.id)}
                      className="text-red-400 hover:text-red-300 transition-colors"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  </div>
);

// Product Form Modal Component
const ProductFormModal = ({ 
  form, 
  setForm, 
  editingId, 
  saving, 
  onSave, 
  onCancel 
}: { 
  form: any; 
  setForm: (form: any) => void; 
  editingId: string | null; 
  saving: boolean; 
  onSave: () => void; 
  onCancel: () => void; 
}) => (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div className="bg-gray-900 border border-gray-700/50 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">
            {editingId ? 'Edit Product' : 'Add New Product'}
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({...form, name: e.target.value})}
                placeholder="Product name"
                className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Title</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({...form, title: e.target.value})}
                placeholder="Product title"
                className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Price *</label>
              <input
                type="number"
                value={form.price}
                onChange={(e) => setForm({...form, price: Number(e.target.value)})}
                placeholder="0.00"
                step="0.01"
                className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({...form, status: e.target.value})}
                className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
              <input
                type="text"
                value={form.category}
                onChange={(e) => setForm({...form, category: e.target.value})}
                placeholder="Product category"
                className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Tags</label>
              <input
                type="text"
                value={form.tags}
                onChange={(e) => setForm({...form, tags: e.target.value})}
                placeholder="tag1, tag2, tag3"
                className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({...form, description: e.target.value})}
              placeholder="Product description"
              rows={3}
              className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Image URL</label>
            <input
              type="url"
              value={form.image}
              onChange={(e) => setForm({...form, image: e.target.value})}
              placeholder="https://example.com/image.jpg"
              className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Download/Link URL</label>
            <input
              type="url"
              value={form.link}
              onChange={(e) => setForm({...form, link: e.target.value})}
              placeholder="https://example.com/download"
              className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
            />
          </div>
        </div>
        
        <div className="flex items-center justify-end gap-3 mt-6">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-600/20 hover:bg-gray-600/30 text-gray-300 hover:text-white border border-gray-500/30 hover:border-gray-500/50 rounded-lg text-sm font-medium transition-all duration-200"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={saving}
            className="px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 hover:text-blue-200 border border-blue-500/30 hover:border-blue-500/50 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : editingId ? 'Update Product' : 'Create Product'}
          </button>
        </div>
      </div>
    </div>
  </div>
);
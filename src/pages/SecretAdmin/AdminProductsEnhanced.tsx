import React, { useEffect, useState } from 'react';
import { firestore } from '../../firebase';
import { collection, doc, onSnapshot, addDoc, updateDoc, deleteDoc, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Textarea } from '../../components/ui/textarea';
import Modal from '../../components/ui/Modal';
import { 
  Search, 
  Plus,
  Edit,
  Trash2,
  Eye,
  Package,
  DollarSign,
  Star,
  TrendingUp,
  ShoppingCart,
  Download,
  RefreshCw,
  Save,
  X,
  Filter,
  AlertCircle
} from 'lucide-react';

interface DigitalProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl?: string;
  features?: string[];
  isActive: boolean;
  createdAt: any;
  updatedAt?: any;
  sales?: number;
  rating?: number;
}

export default function AdminProductsEnhanced() {
  const [products, setProducts] = useState<DigitalProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<DigitalProduct | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newFeature, setNewFeature] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    category: '',
    imageUrl: '',
    features: [] as string[],
    isActive: true
  });

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const q = query(collection(firestore, 'digitalProducts'), orderBy('createdAt', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const productsData: DigitalProduct[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          productsData.push({
            id: doc.id,
            name: data.name || '',
            description: data.description || '',
            price: data.price || 0,
            category: data.category || '',
            imageUrl: data.imageUrl || '',
            features: data.features || [],
            isActive: data.isActive !== undefined ? data.isActive : true,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
            sales: data.sales || 0,
            rating: data.rating || 0
          });
        });
        setProducts(productsData);
        setLoading(false);
      });
      
      return () => unsubscribe();
    } catch (error) {
      console.error('Error loading products:', error);
      setLoading(false);
    }
  };

  const handleAddProduct = async () => {
    if (!formData.name || !formData.description || formData.price <= 0) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setIsSubmitting(true);
      await addDoc(collection(firestore, 'digitalProducts'), {
        ...formData,
        createdAt: serverTimestamp(),
        sales: 0,
        rating: 0
      });
      
      setIsAddModalOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error adding product:', error);
      alert('Failed to add product. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditProduct = async () => {
    if (!selectedProduct || !formData.name || !formData.description || formData.price <= 0) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setIsSubmitting(true);
      await updateDoc(doc(firestore, 'digitalProducts', selectedProduct.id), {
        ...formData,
        updatedAt: serverTimestamp()
      });
      
      setIsEditModalOpen(false);
      setSelectedProduct(null);
      resetForm();
    } catch (error) {
      console.error('Error updating product:', error);
      alert('Failed to update product. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!selectedProduct) return;

    try {
      setIsSubmitting(true);
      await deleteDoc(doc(firestore, 'digitalProducts', selectedProduct.id));
      setIsDeleteModalOpen(false);
      setSelectedProduct(null);
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Failed to delete product. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: 0,
      category: '',
      imageUrl: '',
      features: [],
      isActive: true
    });
    setNewFeature('');
  };

  const openEditModal = (product: DigitalProduct) => {
    setSelectedProduct(product);
    setFormData({
      name: product.name || '',
      description: product.description || '',
      price: product.price || 0,
      category: product.category || '',
      imageUrl: product.imageUrl || '',
      features: product.features || [],
      isActive: product.isActive !== undefined ? product.isActive : true
    });
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (product: DigitalProduct) => {
    setSelectedProduct(product);
    setIsDeleteModalOpen(true);
  };

  const addFeature = () => {
    if (newFeature.trim()) {
      setFormData({
        ...formData,
        features: [...formData.features, newFeature.trim()]
      });
      setNewFeature('');
    }
  };

  const removeFeature = (index: number) => {
    setFormData({
      ...formData,
      features: formData.features.filter((_, i) => i !== index)
    });
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = (product.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (product.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && product.isActive) ||
                         (statusFilter === 'inactive' && !product.isActive);
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getTotalStats = () => {
    const total = products.length;
    const active = products.filter(p => p.isActive).length;
    const totalValue = products.reduce((sum, p) => sum + ((p.price || 0) * (p.sales || 0)), 0);
    const totalSales = products.reduce((sum, p) => sum + (p.sales || 0), 0);
    
    return { total, active, totalValue, totalSales };
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString();
  };

  const formatPrice = (price: number) => {
    return `$${price.toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading products...</div>
      </div>
    );
  }

  const stats = getTotalStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div className="flex-1">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Digital Products
            </h1>
            <p className="text-gray-400 text-sm sm:text-base">Manage your digital product catalog</p>
            <div className="flex items-center gap-2 mt-3">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-400">Live updates</span>
            </div>
          </div>
          <Button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-gradient-to-br from-blue-600/20 to-blue-700/20 border-blue-500/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-300 text-sm font-medium">Total Products</p>
                  <p className="text-blue-100 text-2xl font-bold">{stats.total}</p>
                </div>
                <Package className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-600/20 to-green-700/20 border-green-500/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-300 text-sm font-medium">Active</p>
                  <p className="text-green-100 text-2xl font-bold">{stats.active}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-600/20 to-purple-700/20 border-purple-500/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-300 text-sm font-medium">Total Sales</p>
                  <p className="text-purple-100 text-2xl font-bold">{stats.totalSales}</p>
                </div>
                <ShoppingCart className="w-8 h-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-orange-600/20 to-orange-700/20 border-orange-500/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-300 text-sm font-medium">Total Value</p>
                  <p className="text-orange-100 text-2xl font-bold">{formatPrice(stats.totalValue)}</p>
                </div>
                <DollarSign className="w-8 h-8 text-orange-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6 bg-gradient-to-br from-gray-800/30 to-gray-900/30 border-gray-700/50">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-400"
                />
              </div>
              <Select value={categoryFilter} onValueChange={(value) => setCategoryFilter(value)}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="software">Software</SelectItem>
                  <SelectItem value="ebook">E-Book</SelectItem>
                  <SelectItem value="course">Course</SelectItem>
                  <SelectItem value="template">Template</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value)}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={loadProducts}
                variant="outline"
                className="bg-white/5 border-white/10 text-white hover:bg-white/10"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Products Table */}
        <Card className="bg-gradient-to-br from-gray-800/30 to-gray-900/30 border-gray-700/50">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Package className="w-5 h-5" />
              Products
              <Badge variant="outline" className="ml-2">
                {filteredProducts.length}
              </Badge>
            </CardTitle>
            <CardDescription className="text-gray-400">
              Manage your digital product catalog
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-700">
                    <TableHead className="text-gray-300">Product</TableHead>
                    <TableHead className="text-gray-300">Category</TableHead>
                    <TableHead className="text-gray-300">Price</TableHead>
                    <TableHead className="text-gray-300">Status</TableHead>
                    <TableHead className="text-gray-300">Sales</TableHead>
                    <TableHead className="text-gray-300">Created</TableHead>
                    <TableHead className="text-gray-300">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => (
                    <TableRow key={product.id} className="border-gray-700 hover:bg-gray-800/50">
                      <TableCell className="text-white">
                        <div>
                          <div className="font-medium">{product.name || 'Unnamed Product'}</div>
                          <div className="text-sm text-gray-400 truncate max-w-xs">
                            {product.description || 'No description'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-white">
                        <Badge variant="outline" className="capitalize">
                          {product.category || 'Uncategorized'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-white">
                        <div className="font-medium">{formatPrice(product.price || 0)}</div>
                      </TableCell>
                      <TableCell>
                        <Badge className={product.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                          {product.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-white">
                        <div className="flex items-center gap-1">
                          <ShoppingCart className="w-4 h-4 text-gray-400" />
                          <span>{product.sales || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-white">
                        <div className="text-sm">{formatDate(product.createdAt)}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditModal(product)}
                            className="bg-white/5 border-white/10 text-white hover:bg-white/10"
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openDeleteModal(product)}
                            className="bg-red-600/20 border-red-500/30 text-red-300 hover:bg-red-600/30"
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Add Product Modal */}
        <Modal
          open={isAddModalOpen}
          onClose={() => {
            setIsAddModalOpen(false);
            resetForm();
          }}
          title="Add New Product"
          maxWidth="max-w-2xl"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Product Name *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-400"
                  placeholder="Enter product name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Price *</label>
                <Input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-400"
                  placeholder="0.00"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Description *</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-400"
                rows={3}
                placeholder="Enter product description"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="software">Software</SelectItem>
                    <SelectItem value="ebook">E-Book</SelectItem>
                    <SelectItem value="course">Course</SelectItem>
                    <SelectItem value="template">Template</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Image URL</label>
                <Input
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-400"
                  placeholder="https://example.com/image.jpg"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Features</label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={newFeature}
                  onChange={(e) => setNewFeature(e.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-400"
                  placeholder="Add a feature"
                />
                <Button onClick={addFeature} size="sm" className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-1">
                {formData.features.map((feature, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-700/50 p-2 rounded">
                    <span className="text-sm text-white">{feature}</span>
                    <Button
                      onClick={() => removeFeature(index)}
                      size="sm"
                      variant="destructive"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="rounded"
              />
              <label htmlFor="isActive" className="text-sm text-gray-300">
                Active (visible to customers)
              </label>
            </div>
            
            <div className="flex gap-2 pt-4 border-t border-gray-700">
              <Button
                onClick={handleAddProduct}
                disabled={isSubmitting}
                className="bg-green-600 hover:bg-green-700 disabled:opacity-50"
              >
                <Save className="w-4 h-4 mr-1" />
                {isSubmitting ? 'Adding...' : 'Add Product'}
              </Button>
              <Button
                onClick={() => {
                  setIsAddModalOpen(false);
                  resetForm();
                }}
                variant="outline"
                className="bg-white/5 border-white/10 text-white hover:bg-white/10"
              >
                Cancel
              </Button>
            </div>
          </div>
        </Modal>

        {/* Edit Product Modal */}
        <Modal
          open={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedProduct(null);
            resetForm();
          }}
          title="Edit Product"
          maxWidth="max-w-2xl"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Product Name *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-400"
                  placeholder="Enter product name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Price *</label>
                <Input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-400"
                  placeholder="0.00"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Description *</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-400"
                rows={3}
                placeholder="Enter product description"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="software">Software</SelectItem>
                    <SelectItem value="ebook">E-Book</SelectItem>
                    <SelectItem value="course">Course</SelectItem>
                    <SelectItem value="template">Template</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Image URL</label>
                <Input
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-400"
                  placeholder="https://example.com/image.jpg"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Features</label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={newFeature}
                  onChange={(e) => setNewFeature(e.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-400"
                  placeholder="Add a feature"
                />
                <Button onClick={addFeature} size="sm" className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-1">
                {formData.features.map((feature, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-700/50 p-2 rounded">
                    <span className="text-sm text-white">{feature}</span>
                    <Button
                      onClick={() => removeFeature(index)}
                      size="sm"
                      variant="destructive"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActiveEdit"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="rounded"
              />
              <label htmlFor="isActiveEdit" className="text-sm text-gray-300">
                Active (visible to customers)
              </label>
            </div>
            
            <div className="flex gap-2 pt-4 border-t border-gray-700">
              <Button
                onClick={handleEditProduct}
                disabled={isSubmitting}
                className="bg-green-600 hover:bg-green-700 disabled:opacity-50"
              >
                <Save className="w-4 h-4 mr-1" />
                {isSubmitting ? 'Updating...' : 'Update Product'}
              </Button>
              <Button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setSelectedProduct(null);
                  resetForm();
                }}
                variant="outline"
                className="bg-white/5 border-white/10 text-white hover:bg-white/10"
              >
                Cancel
              </Button>
            </div>
          </div>
        </Modal>

        {/* Delete Product Modal */}
        <Modal
          open={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setSelectedProduct(null);
          }}
          title="Delete Product"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-red-600/20 border border-red-500/30 rounded-lg">
              <AlertCircle className="w-6 h-6 text-red-400" />
              <div>
                <p className="text-red-300 font-medium">Are you sure you want to delete this product?</p>
                <p className="text-red-400 text-sm">This action cannot be undone.</p>
              </div>
            </div>
            
            {selectedProduct && (
              <div className="bg-gray-700/50 p-4 rounded-lg">
                <h4 className="font-medium text-white mb-2">{selectedProduct.name}</h4>
                <p className="text-gray-400 text-sm">{selectedProduct.description}</p>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
                  <span>Price: {formatPrice(selectedProduct.price || 0)}</span>
                  <span>Sales: {selectedProduct.sales || 0}</span>
                </div>
              </div>
            )}
            
            <div className="flex gap-2">
              <Button
                onClick={handleDeleteProduct}
                disabled={isSubmitting}
                variant="destructive"
                className="disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                {isSubmitting ? 'Deleting...' : 'Delete Product'}
              </Button>
              <Button
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setSelectedProduct(null);
                }}
                variant="outline"
                className="bg-white/5 border-white/10 text-white hover:bg-white/10"
              >
                Cancel
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}
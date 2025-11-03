import React, { useEffect, useState } from 'react';
import { ServiceManager } from '../../utils/serviceManagement';
import type { Service, ServiceForm } from '../../utils/serviceManagement';
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
  AlertCircle,
  Settings,
  FileText,
  Image,
  Link,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';

export default function AdminServiceManage() {
  const [services, setServices] = useState<Service[]>([]);
  const [serviceForms, setServiceForms] = useState<ServiceForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newFeature, setNewFeature] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    price_usd: '' as unknown as number,
    price_inr: '' as unknown as number,
    commission: '' as unknown as number,
    rating: '' as unknown as number,
    category: '',
    isActive: true,
    trending: false,
    thumbnailUrl: '',
    formUrl: '',
    features: [] as string[]
  });

  const [formConfig, setFormConfig] = useState<{
    steps: Array<{
      title: string;
      fields: Array<{
        name: string;
        label: string;
        type: string;
        required?: boolean;
        placeholder?: string;
        options?: string[];
      }>;
    }>;
  }>({
    steps: [{
      title: 'Service Information',
      fields: [{
        name: 'serviceType',
        label: 'Service Type',
        type: 'text',
        required: true,
        placeholder: 'Enter service type'
      }]
    }]
  });

  const categories = [
    'Web Development',
    'Mobile Development', 
    'Blockchain',
    'AI & Automation',
    'Marketing',
    'Design',
    'Security',
    'Other'
  ];

  // Icons removed; use thumbnails only

  useEffect(() => {
    loadServices();
    loadServiceForms();
  }, []);

  const loadServices = async () => {
    try {
      setLoading(true);
      const unsubscribe = ServiceManager.subscribeToServices((servicesData) => {
        setServices(servicesData);
        setLoading(false);
      });
      
      return () => unsubscribe();
    } catch (error) {
      console.error('Error loading services:', error);
      setLoading(false);
    }
  };

  const loadServiceForms = async () => {
    try {
      // Service forms are now managed through the ServiceManager
      // This is kept for compatibility but forms are auto-created
      setServiceForms([]);
    } catch (error) {
      console.error('Error loading service forms:', error);
    }
  };

  const handleAddService = async () => {
    if (!formData.title || !formData.description || !formData.category) {
      alert('Please fill in title, description, and category');
      return;
    }

    try {
      setIsSubmitting(true);
      // Build price string if numeric prices provided
      let priceStr = formData.price;
      const usd = Number(formData.price_usd);
      const inr = Number(formData.price_inr);
      if (!priceStr && Number.isFinite(usd) && Number.isFinite(inr) && usd > 0 && inr > 0) {
        priceStr = `$${usd} / ₹${inr.toLocaleString('en-IN')}`;
      }

      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        commission: formData.commission ? Number(formData.commission) : 0,
        price: priceStr,
        price_usd: Number.isFinite(usd) && usd > 0 ? usd : undefined,
        price_inr: Number.isFinite(inr) && inr > 0 ? inr : undefined,
        rating: formData.rating ? Number(formData.rating) : undefined,
        thumbnailUrl: formData.thumbnailUrl?.trim() || '',
        features: formData.features,
        formUrl: formData.formUrl?.trim() || '',
        isActive: !!formData.isActive,
        trending: !!formData.trending,
      };

      await ServiceManager.addService(payload);
      
      setIsAddModalOpen(false);
      resetForm();
      alert('✅ Service added successfully and visible on dashboard.');
    } catch (error) {
      console.error('Error adding service:', error);
      alert('Failed to add service');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditService = async () => {
    if (!selectedService || !formData.title || !formData.description || !formData.price) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setIsSubmitting(true);
      await ServiceManager.updateService(selectedService.id, formData);
      
      setIsEditModalOpen(false);
      setSelectedService(null);
      resetForm();
      alert('Service updated successfully!');
    } catch (error) {
      console.error('Error updating service:', error);
      alert('Failed to update service');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteService = async () => {
    if (!selectedService) return;

    try {
      setIsSubmitting(true);
      await ServiceManager.deleteService(selectedService.id);
      
      setIsDeleteModalOpen(false);
      setSelectedService(null);
      alert('Service deleted successfully!');
    } catch (error) {
      console.error('Error deleting service:', error);
      alert('Failed to delete service');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveFormConfig = async () => {
    if (!selectedService) return;

    try {
      setIsSubmitting(true);
      // Use setDoc with merge to create if doesn't exist
      const { firestore } = await import('../../firebase');
      const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');
      await setDoc(doc(firestore, 'serviceForms', selectedService.id), {
        serviceId: selectedService.id,
        serviceTitle: selectedService.title,
        serviceCategory: selectedService.category,
        steps: formConfig.steps,
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp()
      }, { merge: true });
      
      setIsFormModalOpen(false);
      alert('Service form updated successfully!');
    } catch (error) {
      console.error('Error updating service form:', error);
      alert('Failed to update service form');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      price: '',
      price_usd: '' as unknown as number,
      price_inr: '' as unknown as number,
      commission: '' as unknown as number,
      rating: '' as unknown as number,
      category: '',
      isActive: true,
      trending: false,
      thumbnailUrl: '',
      formUrl: '',
      features: []
    });
    setNewFeature('');
  };

  const openEditModal = (service: Service) => {
    setSelectedService(service);
    setFormData({
      title: service.title,
      description: service.description,
      price: service.price,
      price_usd: (service as any).price_usd as number,
      price_inr: (service as any).price_inr as number,
      commission: (service as any).commission as number,
      rating: (service as any).rating as number,
      category: service.category,
      isActive: service.isActive,
      trending: (service as any).trending === true,
      thumbnailUrl: service.thumbnailUrl || '',
      formUrl: service.formUrl || '',
      features: service.features || []
    });
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (service: Service) => {
    setSelectedService(service);
    setIsDeleteModalOpen(true);
  };

  const openFormModal = async (service: Service) => {
    setSelectedService(service);
    setIsFormModalOpen(true);
    try {
      // Load form from Firestore using service ID
      const form = await ServiceManager.getServiceForm(service.id);
      if (form && form.steps && form.steps.length > 0) {
        setFormConfig({ 
          steps: form.steps.map(step => ({
            ...step,
            fields: step.fields.map(field => ({
              ...field,
              required: field.required ?? false,
              placeholder: field.placeholder ?? '',
              options: field.options || []
            }))
          }))
        });
      } else {
        // Load default form based on service
        const defaultForm = ServiceManager.getDefaultFormForService(service.title, service.category);
        setFormConfig({ 
          steps: defaultForm.map(step => ({
            ...step,
            fields: step.fields.map(field => ({
              ...field,
              required: field.required ?? false,
              placeholder: field.placeholder ?? '',
              options: field.options || []
            }))
          }))
        });
      }
    } catch (error) {
      console.error('Error loading service form:', error);
      // Set default form on error
      const defaultForm = ServiceManager.getDefaultFormForService(service.title, service.category);
      setFormConfig({ 
        steps: defaultForm.map(step => ({
          ...step,
          fields: step.fields.map(field => ({
            ...field,
            required: field.required ?? false,
            placeholder: field.placeholder ?? '',
            options: field.options || []
          }))
        }))
      });
    }
  };

  const addFeature = () => {
    if (newFeature.trim()) {
      setFormData(prev => ({
        ...prev,
        features: [...prev.features, newFeature.trim()]
      }));
      setNewFeature('');
    }
  };

  const removeFeature = (index: number) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  const addFormStep = () => {
    setFormConfig(prev => ({
      steps: [...prev.steps, {
        title: 'New Step',
        fields: [{
          name: 'field1',
          label: 'Field 1',
          type: 'text',
          required: true,
          placeholder: 'Enter value'
        }]
      }]
    }));
  };

  const addFormField = (stepIndex: number) => {
    setFormConfig(prev => ({
      steps: prev.steps.map((step, index) => 
        index === stepIndex 
          ? {
              ...step,
              fields: [...step.fields, {
                name: `field${step.fields.length + 1}`,
                label: 'New Field',
                type: 'text',
                required: false,
                placeholder: '',
                options: []
              }]
            }
          : step
      )
    }));
  };

  const removeFormField = (stepIndex: number, fieldIndex: number) => {
    setFormConfig(prev => ({
      steps: prev.steps.map((step, index) => 
        index === stepIndex 
          ? {
              ...step,
              fields: step.fields.filter((_, fIdx) => fIdx !== fieldIndex)
            }
          : step
      )
    }));
  };

  const removeFormStep = (stepIndex: number) => {
    if (formConfig.steps.length <= 1) {
      alert('Cannot remove the last step. At least one step is required.');
      return;
    }
    setFormConfig(prev => ({
      steps: prev.steps.filter((_, index) => index !== stepIndex)
    }));
  };

  const filteredServices = services.filter(service => {
    const matchesSearch = service.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || service.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && service.isActive) ||
                         (statusFilter === 'inactive' && !service.isActive);
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getTotalStats = () => {
    const total = services.length;
    const active = services.filter(s => s.isActive).length;
    const inactive = services.filter(s => !s.isActive).length;
    const categories = [...new Set(services.map(s => s.category))].length;
    
    return { total, active, inactive, categories };
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading services...</div>
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
              Service Management
            </h1>
            <p className="text-gray-400 text-sm sm:text-base">Manage services displayed on the website</p>
            <div className="flex items-center gap-2 mt-3">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-400">Live updates</span>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-gradient-to-br from-blue-600/20 to-blue-700/20 border-blue-500/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-300 text-sm font-medium">Total Services</p>
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
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-yellow-600/20 to-yellow-700/20 border-yellow-500/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-300 text-sm font-medium">Inactive</p>
                  <p className="text-yellow-100 text-2xl font-bold">{stats.inactive}</p>
                </div>
                <XCircle className="w-8 h-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-600/20 to-purple-700/20 border-purple-500/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-300 text-sm font-medium">Categories</p>
                  <p className="text-purple-100 text-2xl font-bold">{stats.categories}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Actions */}
        <Card className="mb-6 bg-gradient-to-br from-gray-800/30 to-gray-900/30 border-gray-700/50">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Search services..."
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
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
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
              <div className="flex gap-2">
                <Button
                  onClick={() => setIsAddModalOpen(true)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Service
                </Button>
                <Button
                  onClick={loadServices}
                  variant="outline"
                  className="bg-white/5 border-white/10 text-white hover:bg-white/10"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Services Table */}
        <Card className="bg-gradient-to-br from-gray-800/30 to-gray-900/30 border-gray-700/50">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Package className="w-5 h-5" />
              Services
              <Badge variant="outline" className="ml-2">
                {filteredServices.length}
              </Badge>
            </CardTitle>
            <CardDescription className="text-gray-400">
              Manage services displayed on the website
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-700">
                    <TableHead className="text-gray-300">Service</TableHead>
                    <TableHead className="text-gray-300">Category</TableHead>
                    <TableHead className="text-gray-300">Price</TableHead>
                    <TableHead className="text-gray-300">Status</TableHead>
                    <TableHead className="text-gray-300">Created</TableHead>
                    <TableHead className="text-gray-300">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredServices.map((service) => (
                    <TableRow key={service.id} className="border-gray-700 hover:bg-gray-800/50">
                      <TableCell className="text-white">
                        <div className="flex items-center gap-3">
                          {service.thumbnailUrl ? (
                            <img src={service.thumbnailUrl} alt={service.title} className="w-10 h-10 rounded object-cover" />
                          ) : (
                            <div className="w-10 h-10 rounded bg-gray-700 flex items-center justify-center text-gray-400 text-sm">IMG</div>
                          )}
                          <div>
                            <div className="font-medium">{service.title}</div>
                            <div className="text-sm text-gray-400 line-clamp-2">{service.description}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-white">
                        <Badge variant="outline" className="text-xs">
                          {service.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-white">
                        <div className="font-medium">{service.price}</div>
                      </TableCell>
                      <TableCell>
                        <Badge className={service.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                          {service.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-white">
                        <div className="text-sm">{formatDate(service.createdAt)}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditModal(service)}
                            className="bg-white/5 border-white/10 text-white hover:bg-white/10"
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openFormModal(service)}
                            className="bg-white/5 border-white/10 text-white hover:bg-white/10"
                          >
                            <Settings className="w-4 h-4 mr-1" />
                            Form
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => openDeleteModal(service)}
                            variant="destructive"
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

        {/* Add Service Modal */}
        <Modal
          open={isAddModalOpen}
          onClose={() => {
            setIsAddModalOpen(false);
            resetForm();
          }}
          title="Add New Service"
          maxWidth="max-w-4xl"
        >
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Service Name *</label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter service name"
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Category *</label>
                <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Description *</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter service description"
                rows={3}
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-400"
              />
            </div>

            {/* Pricing and meta */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Price (USD)</label>
                  <Input
                    type="number"
                    value={(formData as any).price_usd as unknown as string}
                    onChange={(e) => setFormData(prev => ({ ...prev, price_usd: Number(e.target.value) as any }))}
                    placeholder="e.g., 599"
                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Price (INR)</label>
                  <Input
                    type="number"
                    value={(formData as any).price_inr as unknown as string}
                    onChange={(e) => setFormData(prev => ({ ...prev, price_inr: Number(e.target.value) as any }))}
                    placeholder="e.g., 49900"
                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-400"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Auto Price String</label>
                  <Input
                    value={(() => {
                      const usd = Number((formData as any).price_usd);
                      const inr = Number((formData as any).price_inr);
                      if (Number.isFinite(usd) && Number.isFinite(inr) && usd > 0 && inr > 0) {
                        return `$${usd} / ₹${inr.toLocaleString('en-IN')}`;
                      }
                      return formData.price;
                    })()}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                    placeholder="$599 / ₹49,900"
                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-400"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Thumbnail Image URL</label>
                <Input
                  value={formData.thumbnailUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, thumbnailUrl: e.target.value }))}
                  placeholder="https://example.com/image.jpg"
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-400"
                />
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Commission (%)</label>
                    <Input
                      type="number"
                      value={(formData as any).commission as unknown as string}
                      onChange={(e) => setFormData(prev => ({ ...prev, commission: Number(e.target.value) as any }))}
                      placeholder="e.g., 20"
                      className="bg-white/5 border-white/10 text-white placeholder:text-gray-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Rating (0-5)</label>
                    <Input
                      type="number"
                      step="0.1"
                      value={(formData as any).rating as unknown as string}
                      onChange={(e) => setFormData(prev => ({ ...prev, rating: Number(e.target.value) as any }))}
                      placeholder="e.g., 4.8"
                      className="bg-white/5 border-white/10 text-white placeholder:text-gray-400"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Form URL</label>
                <Input
                  value={formData.formUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, formUrl: e.target.value }))}
                  placeholder="https://example.com/form"
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-400"
                />
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="trending"
                  checked={(formData as any).trending as unknown as boolean}
                  onChange={(e) => setFormData(prev => ({ ...prev, trending: e.target.checked as any }))}
                  className="w-4 h-4 accent-cyan-500"
                />
                <label htmlFor="trending" className="text-sm text-gray-300">
                  Mark as Trending (shows a tag on the card)
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Features</label>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    value={newFeature}
                    onChange={(e) => setNewFeature(e.target.value)}
                    placeholder="Enter feature"
                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-400"
                  />
                  <Button onClick={addFeature} type="button" size="sm">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.features.map((feature, index) => (
                    <Badge key={index} variant="outline" className="flex items-center gap-1">
                      {feature}
                      <X 
                        className="w-3 h-3 cursor-pointer" 
                        onClick={() => removeFeature(index)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                className="w-4 h-4 accent-green-500"
              />
              <label htmlFor="isActive" className="text-sm text-gray-300">
                Service is active (visible on website)
              </label>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleAddService}
                disabled={isSubmitting}
                className="bg-green-600 hover:bg-green-700 disabled:opacity-50"
              >
                <Save className="w-4 h-4 mr-1" />
                {isSubmitting ? 'Adding...' : 'Add Service'}
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

        {/* Edit Service Modal */}
        <Modal
          open={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedService(null);
            resetForm();
          }}
          title="Edit Service"
          maxWidth="max-w-4xl"
        >
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Service Name *</label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter service name"
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Price *</label>
                <Input
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                  placeholder="e.g., $299"
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Category *</label>
                <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {/* Icon selection removed; use thumbnails only */}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Description *</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter service description"
                rows={3}
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-400"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Thumbnail Image URL</label>
                <Input
                  value={formData.thumbnailUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, thumbnailUrl: e.target.value }))}
                  placeholder="https://example.com/image.jpg"
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Form URL</label>
                <Input
                  value={formData.formUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, formUrl: e.target.value }))}
                  placeholder="https://example.com/form"
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Features</label>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    value={newFeature}
                    onChange={(e) => setNewFeature(e.target.value)}
                    placeholder="Enter feature"
                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-400"
                  />
                  <Button onClick={addFeature} type="button" size="sm">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.features.map((feature, index) => (
                    <Badge key={index} variant="outline" className="flex items-center gap-1">
                      {feature}
                      <X 
                        className="w-3 h-3 cursor-pointer" 
                        onClick={() => removeFeature(index)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isActiveEdit"
                checked={formData.isActive}
                onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                className="w-4 h-4 accent-green-500"
              />
              <label htmlFor="isActiveEdit" className="text-sm text-gray-300">
                Service is active (visible on website)
              </label>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleEditService}
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                <Save className="w-4 h-4 mr-1" />
                {isSubmitting ? 'Updating...' : 'Update Service'}
              </Button>
              <Button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setSelectedService(null);
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

        {/* Delete Service Modal */}
        <Modal
          open={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setSelectedService(null);
          }}
          title="Delete Service"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-red-600/20 border border-red-500/30 rounded-lg">
              <AlertCircle className="w-6 h-6 text-red-400" />
              <div>
                <p className="text-red-300 font-medium">Delete this service?</p>
                <p className="text-red-400 text-sm">This action cannot be undone.</p>
              </div>
            </div>
            
            {selectedService && (
              <div className="bg-gray-700/50 p-4 rounded-lg">
                <h4 className="font-medium text-white mb-2">{selectedService.title}</h4>
                <p className="text-gray-400 text-sm">{selectedService.description}</p>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
                  <span>Category: {selectedService.category}</span>
                  <span>Price: {selectedService.price}</span>
                </div>
              </div>
            )}
            
            <div className="flex gap-2">
              <Button
                onClick={handleDeleteService}
                disabled={isSubmitting}
                variant="destructive"
                className="disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                {isSubmitting ? 'Deleting...' : 'Delete Service'}
              </Button>
              <Button
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setSelectedService(null);
                }}
                variant="outline"
                className="bg-white/5 border-white/10 text-white hover:bg-white/10"
              >
                Cancel
              </Button>
            </div>
          </div>
        </Modal>

        {/* Service Form Modal */}
        <Modal
          open={isFormModalOpen}
          onClose={() => {
            setIsFormModalOpen(false);
            setSelectedService(null);
          }}
          title="Manage Service Form"
          maxWidth="max-w-6xl"
        >
          <div className="space-y-6">
            {selectedService && (
              <div className="bg-gray-700/50 p-4 rounded-lg">
                <h4 className="font-medium text-white mb-2">{selectedService.title}</h4>
                <p className="text-gray-400 text-sm">Configure the form that users will fill when requesting this service</p>
              </div>
            )}

            <div className="space-y-4">
              {formConfig.steps.map((step, stepIndex) => (
                <div key={stepIndex} className="border border-gray-600 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3 flex-1">
                      <Input
                        value={step.title}
                        onChange={(e) => {
                          const newSteps = [...formConfig.steps];
                          newSteps[stepIndex].title = e.target.value;
                          setFormConfig({ steps: newSteps });
                        }}
                        placeholder="Step title"
                        className="bg-white/5 border-white/10 text-white placeholder:text-gray-400 max-w-xs"
                      />
                      <span className="text-sm text-gray-400">Step {stepIndex + 1}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => addFormField(stepIndex)}
                        className="bg-white/5 border-white/10 text-white hover:bg-white/10"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add Field
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => removeFormStep(stepIndex)}
                        className="bg-red-600/20 border-red-500/30 text-red-400 hover:bg-red-600/30"
                        disabled={formConfig.steps.length <= 1}
                      >
                        <X className="w-4 h-4 mr-1" />
                        Remove Step
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    {step.fields.map((field, fieldIndex) => (
                      <div key={fieldIndex} className="p-4 bg-gray-800/50 rounded-lg space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                          <Input
                            value={field.name}
                            onChange={(e) => {
                              const newSteps = [...formConfig.steps];
                              newSteps[stepIndex].fields[fieldIndex].name = e.target.value;
                              setFormConfig({ steps: newSteps });
                            }}
                            placeholder="Field name (e.g., projectType)"
                            className="bg-white/5 border-white/10 text-white placeholder:text-gray-400"
                          />
                          <Input
                            value={field.label}
                            onChange={(e) => {
                              const newSteps = [...formConfig.steps];
                              newSteps[stepIndex].fields[fieldIndex].label = e.target.value;
                              setFormConfig({ steps: newSteps });
                            }}
                            placeholder="Field label (e.g., Project Type)"
                            className="bg-white/5 border-white/10 text-white placeholder:text-gray-400"
                          />
                          <Select
                            value={field.type}
                            onValueChange={(value) => {
                              const newSteps = [...formConfig.steps];
                              newSteps[stepIndex].fields[fieldIndex].type = value;
                              // Clear options if type doesn't need them
                              if (!['select', 'checkbox', 'radio'].includes(value)) {
                                newSteps[stepIndex].fields[fieldIndex].options = [];
                              }
                              setFormConfig({ steps: newSteps });
                            }}
                          >
                            <SelectTrigger className="bg-white/5 border-white/10 text-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-800 border-gray-700">
                              <SelectItem value="text">Text</SelectItem>
                              <SelectItem value="textarea">Textarea</SelectItem>
                              <SelectItem value="select">Select</SelectItem>
                              <SelectItem value="checkbox">Checkbox</SelectItem>
                              <SelectItem value="radio">Radio</SelectItem>
                              <SelectItem value="number">Number</SelectItem>
                              <SelectItem value="email">Email</SelectItem>
                              <SelectItem value="tel">Phone</SelectItem>
                            </SelectContent>
                          </Select>
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={field.required || false}
                              onChange={(e) => {
                                const newSteps = [...formConfig.steps];
                                newSteps[stepIndex].fields[fieldIndex].required = e.target.checked;
                                setFormConfig({ steps: newSteps });
                              }}
                              className="w-4 h-4 accent-green-500"
                            />
                            <span className="text-sm text-gray-300">Required</span>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => removeFormField(stepIndex, fieldIndex)}
                            className="bg-red-600/20 border-red-500/30 text-red-400 hover:bg-red-600/30"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        
                        {(field.type === 'text' || field.type === 'textarea' || field.type === 'email' || field.type === 'tel') && (
                          <Input
                            value={field.placeholder || ''}
                            onChange={(e) => {
                              const newSteps = [...formConfig.steps];
                              newSteps[stepIndex].fields[fieldIndex].placeholder = e.target.value;
                              setFormConfig({ steps: newSteps });
                            }}
                            placeholder="Placeholder text (optional)"
                            className="bg-white/5 border-white/10 text-white placeholder:text-gray-400"
                          />
                        )}
                        
                        {(field.type === 'select' || field.type === 'checkbox' || field.type === 'radio') && (
                          <div className="space-y-2">
                            <label className="text-sm text-gray-300">Options (one per line):</label>
                            <Textarea
                              value={(field.options || []).join('\n')}
                              onChange={(e) => {
                                const newSteps = [...formConfig.steps];
                                const options = e.target.value.split('\n').filter(o => o.trim());
                                newSteps[stepIndex].fields[fieldIndex].options = options;
                                setFormConfig({ steps: newSteps });
                              }}
                              placeholder="Option 1&#10;Option 2&#10;Option 3"
                              rows={3}
                              className="bg-white/5 border-white/10 text-white placeholder:text-gray-400 font-mono text-sm"
                            />
                            <p className="text-xs text-gray-500">Enter each option on a new line</p>
                          </div>
                        )}
                      </div>
                    ))}
                    {step.fields.length === 0 && (
                      <div className="text-center py-4 text-gray-400 text-sm">
                        No fields in this step. Click "Add Field" to add one.
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <Button
                onClick={addFormStep}
                variant="outline"
                className="bg-white/5 border-white/10 text-white hover:bg-white/10"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Step
              </Button>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleSaveFormConfig}
                disabled={isSubmitting}
                className="bg-green-600 hover:bg-green-700 disabled:opacity-50"
              >
                <Save className="w-4 h-4 mr-1" />
                {isSubmitting ? 'Saving...' : 'Save Form Configuration'}
              </Button>
              <Button
                onClick={() => {
                  setIsFormModalOpen(false);
                  setSelectedService(null);
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

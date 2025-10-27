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
    category: '',
    icon: '📦',
    isActive: true,
    thumbnailUrl: '',
    formUrl: '',
    features: [] as string[]
  });

  const [formConfig, setFormConfig] = useState({
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
    'AI/ML',
    'Automation',
    'Marketing',
    'Design',
    'Security',
    'Other'
  ];

  const icons = [
    '📦', '🌐', '📱', '🤖', '⚙️', '🎨', '🔒', '💻', '📊', '🚀',
    '🛡️', '💡', '🔧', '📈', '🎯', '💎', '⭐', '🔥', '✨', '🎪'
  ];

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
    if (!formData.title || !formData.description || !formData.price) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setIsSubmitting(true);
      await ServiceManager.addService(formData);
      
      setIsAddModalOpen(false);
      resetForm();
      alert('Service added successfully!');
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
      await ServiceManager.updateServiceForm(selectedService.id, formConfig.steps);
      
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
      category: '',
      icon: '📦',
      isActive: true,
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
      category: service.category,
      icon: service.icon,
      isActive: service.isActive,
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

  const openFormModal = (service: Service) => {
    setSelectedService(service);
    const existingForm = serviceForms.find(f => f.serviceId === service.id);
    if (existingForm) {
      setFormConfig({ 
        steps: existingForm.steps.map(step => ({
          ...step,
          fields: step.fields.map(field => ({
            ...field,
            required: field.required ?? false,
            placeholder: field.placeholder ?? ''
          }))
        }))
      });
    }
    setIsFormModalOpen(true);
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
                placeholder: 'Enter value'
              }]
            }
          : step
      )
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
                          <span className="text-2xl">{service.icon}</span>
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
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Icon</label>
                <Select value={formData.icon} onValueChange={(value) => setFormData(prev => ({ ...prev, icon: value }))}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder="Select icon" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    {icons.map(icon => (
                      <SelectItem key={icon} value={icon}>{icon}</SelectItem>
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
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Icon</label>
                <Select value={formData.icon} onValueChange={(value) => setFormData(prev => ({ ...prev, icon: value }))}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder="Select icon" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    {icons.map(icon => (
                      <SelectItem key={icon} value={icon}>{icon}</SelectItem>
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
                    <h4 className="font-medium text-white">Step {stepIndex + 1}: {step.title}</h4>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => addFormField(stepIndex)}
                      className="bg-white/5 border-white/10 text-white hover:bg-white/10"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Field
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    {step.fields.map((field, fieldIndex) => (
                      <div key={fieldIndex} className="grid grid-cols-1 md:grid-cols-4 gap-3 p-3 bg-gray-800/50 rounded-lg">
                        <Input
                          value={field.name}
                          onChange={(e) => {
                            const newSteps = [...formConfig.steps];
                            newSteps[stepIndex].fields[fieldIndex].name = e.target.value;
                            setFormConfig({ steps: newSteps });
                          }}
                          placeholder="Field name"
                          className="bg-white/5 border-white/10 text-white placeholder:text-gray-400"
                        />
                        <Input
                          value={field.label}
                          onChange={(e) => {
                            const newSteps = [...formConfig.steps];
                            newSteps[stepIndex].fields[fieldIndex].label = e.target.value;
                            setFormConfig({ steps: newSteps });
                          }}
                          placeholder="Field label"
                          className="bg-white/5 border-white/10 text-white placeholder:text-gray-400"
                        />
                        <Select
                          value={field.type}
                          onValueChange={(value) => {
                            const newSteps = [...formConfig.steps];
                            newSteps[stepIndex].fields[fieldIndex].type = value;
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
                            <SelectItem value="number">Number</SelectItem>
                            <SelectItem value="email">Email</SelectItem>
                            <SelectItem value="tel">Phone</SelectItem>
                          </SelectContent>
                        </Select>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={field.required}
                            onChange={(e) => {
                              const newSteps = [...formConfig.steps];
                              newSteps[stepIndex].fields[fieldIndex].required = e.target.checked;
                              setFormConfig({ steps: newSteps });
                            }}
                            className="w-4 h-4 accent-green-500"
                          />
                          <span className="text-sm text-gray-300">Required</span>
                        </div>
                      </div>
                    ))}
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

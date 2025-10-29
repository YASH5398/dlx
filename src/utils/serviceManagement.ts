import { firestore } from '../firebase';
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  onSnapshot, 
  query, 
  orderBy, 
  serverTimestamp,
  setDoc
} from 'firebase/firestore';

export interface Service {
  id: string;
  title: string;
  description: string;
  price: string;
  price_usd?: number;
  price_inr?: number;
  commission?: number;
  rating?: number;
  category: string;
  isActive: boolean;
  createdAt: any;
  updatedAt?: any;
  thumbnailUrl?: string;
  formUrl?: string;
  features?: string[];
}

export interface ServiceForm {
  id: string;
  serviceId: string;
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
}

// Service Management Functions
export class ServiceManager {
  // Get all services
  static async getServices(): Promise<Service[]> {
    try {
      const servicesSnapshot = await getDocs(collection(firestore, 'services'));
      const services: Service[] = [];
      
      servicesSnapshot.forEach((doc) => {
        const data = doc.data();
        services.push({
          id: doc.id,
          title: data.title || '',
          description: data.description || '',
          price: data.price || '',
          price_usd: data.price_usd,
          price_inr: data.price_inr,
          commission: data.commission,
          rating: data.rating,
          category: data.category || '',
          isActive: data.isActive !== undefined ? data.isActive : true,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          thumbnailUrl: data.thumbnailUrl || '',
          formUrl: data.formUrl || '',
          features: data.features || []
        });
      });
      
      return services;
    } catch (error) {
      console.error('Error fetching services:', error);
      throw error;
    }
  }

  // Subscribe to services changes
  static subscribeToServices(callback: (services: Service[]) => void): () => void {
    const q = query(collection(firestore, 'services'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const services: Service[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        services.push({
          id: doc.id,
          title: data.title || '',
          description: data.description || '',
          price: data.price || '',
          price_usd: data.price_usd,
          price_inr: data.price_inr,
          commission: data.commission,
          rating: data.rating,
          category: data.category || '',
          isActive: data.isActive !== undefined ? data.isActive : true,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          thumbnailUrl: data.thumbnailUrl || '',
          formUrl: data.formUrl || '',
          features: data.features || []
        });
      });
      callback(services);
    }, (error) => {
      console.error('Error subscribing to services:', error);
    });

    return unsubscribe;
  }

  // Add new service
  static async addService(serviceData: Omit<Service, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(firestore, 'services'), {
        ...serviceData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Auto-create corresponding serviceForm document
      await this.createDefaultServiceForm(docRef.id, serviceData.title, serviceData.category);

      return docRef.id;
    } catch (error) {
      console.error('Error adding service:', error);
      throw error;
    }
  }

  // Create default service form for a service
  static async createDefaultServiceForm(serviceId: string, serviceTitle: string, serviceCategory: string): Promise<void> {
    try {
      const defaultForm = this.getDefaultFormForService(serviceTitle, serviceCategory);
      
      await setDoc(doc(firestore, 'serviceForms', serviceId), {
        serviceId,
        serviceTitle,
        serviceCategory,
        steps: defaultForm,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error creating default service form:', error);
      throw error;
    }
  }

  // Get default form template based on service
  static getDefaultFormForService(serviceTitle: string, serviceCategory: string): Array<{
    title: string;
    fields: Array<{
      name: string;
      label: string;
      type: string;
      required?: boolean;
      placeholder?: string;
      options?: string[];
    }>;
  }> {
    const category = serviceCategory?.toLowerCase() || '';
    const title = serviceTitle?.toLowerCase() || '';

    // Web Development services
    if (category.includes('web') || title.includes('website') || title.includes('landing')) {
      return [
        {
          title: 'Project Information',
          fields: [
            { name: 'projectType', label: 'Project Type', type: 'select', required: true, options: ['Corporate Website', 'E-commerce', 'Landing Page', 'Portfolio', 'Blog'] },
            { name: 'pages', label: 'Number of Pages', type: 'number', required: true },
            { name: 'designPreference', label: 'Design Preference', type: 'select', required: true, options: ['Modern', 'Minimal', 'Classic', 'Creative'] }
          ]
        },
        {
          title: 'Technical Requirements',
          fields: [
            { name: 'cms', label: 'CMS Required?', type: 'select', required: true, options: ['Yes', 'No'] },
            { name: 'paymentGateway', label: 'Payment Gateway Required?', type: 'select', required: true, options: ['Yes', 'No'] },
            { name: 'seoOptimization', label: 'SEO Optimization Required?', type: 'select', required: true, options: ['Yes', 'No'] }
          ]
        }
      ];
    }

    // Mobile Development services
    if (category.includes('mobile') || title.includes('app') || title.includes('mobile')) {
      return [
        {
          title: 'App Information',
          fields: [
            { name: 'platform', label: 'Platform', type: 'select', required: true, options: ['iOS', 'Android', 'Cross-platform'] },
            { name: 'appType', label: 'App Type', type: 'select', required: true, options: ['Native', 'Hybrid', 'PWA'] },
            { name: 'screens', label: 'Number of Screens', type: 'number', required: true }
          ]
        },
        {
          title: 'Features & Functionality',
          fields: [
            { name: 'pushNotifications', label: 'Push Notifications Required?', type: 'select', required: true, options: ['Yes', 'No'] },
            { name: 'inAppPurchases', label: 'In-app Purchases Required?', type: 'select', required: true, options: ['Yes', 'No'] }
          ]
        }
      ];
    }

    // Blockchain/Crypto services
    if (category.includes('blockchain') || category.includes('crypto') || title.includes('token') || title.includes('blockchain')) {
      return [
        {
          title: 'Token Information',
          fields: [
            { name: 'blockchain', label: 'Blockchain Network', type: 'select', required: true, options: ['Ethereum', 'BSC', 'Polygon', 'Solana', 'Other'] },
            { name: 'tokenName', label: 'Token Name', type: 'text', required: true },
            { name: 'tokenSymbol', label: 'Token Symbol', type: 'text', required: true }
          ]
        },
        {
          title: 'Token Features',
          fields: [
            { name: 'tokenFeatures', label: 'Token Features', type: 'checkbox', required: false, options: ['Burnable', 'Mintable', 'Staking', 'Governance'] },
            { name: 'icoIdo', label: 'ICO/IDO Required?', type: 'select', required: true, options: ['Yes', 'No'] }
          ]
        }
      ];
    }

    // AI/ML services
    if (category.includes('ai') || category.includes('ml') || title.includes('ai') || title.includes('chatbot') || title.includes('automation')) {
      return [
        {
          title: 'AI Service Information',
          fields: [
            { name: 'serviceType', label: 'Service Type', type: 'select', required: true, options: ['Chatbot', 'Automation', 'AI Integration', 'Custom AI Solution'] },
            { name: 'platform', label: 'Platform', type: 'select', required: true, options: ['Website', 'Mobile App', 'Telegram', 'WhatsApp', 'Multi-platform'] }
          ]
        },
        {
          title: 'Technical Requirements',
          fields: [
            { name: 'usersExpected', label: 'Expected Number of Users', type: 'number', required: true },
            { name: 'apiIntegration', label: 'API Integration Required?', type: 'select', required: true, options: ['Yes', 'No'] }
          ]
        }
      ];
    }

    // Default form for any other service
    return [
      {
        title: 'Service Information',
        fields: [
          { name: 'serviceType', label: 'Service Type', type: 'text', required: true, placeholder: 'Describe the specific service needed' },
          { name: 'timeline', label: 'Expected Timeline', type: 'select', required: true, options: ['1-2 weeks', '2-4 weeks', '1-2 months', '2+ months'] },
          { name: 'budget', label: 'Budget Range', type: 'select', required: true, options: ['$100-$500', '$500-$1000', '$1000-$2500', '$2500+'] }
        ]
      },
      {
        title: 'Requirements',
        fields: [
          { name: 'requirements', label: 'Detailed Requirements', type: 'textarea', required: true, placeholder: 'Please describe your requirements in detail...' }
        ]
      }
    ];
  }

  // Update service
  static async updateService(serviceId: string, updates: Partial<Service>): Promise<void> {
    try {
      await updateDoc(doc(firestore, 'services', serviceId), {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating service:', error);
      throw error;
    }
  }

  // Delete service
  static async deleteService(serviceId: string): Promise<void> {
    try {
      await deleteDoc(doc(firestore, 'services', serviceId));
    } catch (error) {
      console.error('Error deleting service:', error);
      throw error;
    }
  }

  // Toggle service active status
  static async toggleServiceStatus(serviceId: string, isActive: boolean): Promise<void> {
    try {
      await updateDoc(doc(firestore, 'services', serviceId), {
        isActive,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error toggling service status:', error);
      throw error;
    }
  }

  // Get service form configuration
  static async getServiceForm(serviceId: string): Promise<ServiceForm | null> {
    try {
      const formDoc = await getDocs(collection(firestore, 'serviceForms'));
      let formData: ServiceForm | null = null;
      
      formDoc.forEach((doc) => {
        if (doc.id === serviceId) {
          const data = doc.data();
          formData = {
            id: doc.id,
            serviceId: doc.id,
            steps: data.steps || []
          };
        }
      });
      
      return formData;
    } catch (error) {
      console.error('Error fetching service form:', error);
      throw error;
    }
  }

  // Update service form configuration
  static async updateServiceForm(serviceId: string, steps: ServiceForm['steps']): Promise<void> {
    try {
      await updateDoc(doc(firestore, 'serviceForms', serviceId), {
        steps,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating service form:', error);
      throw error;
    }
  }

  // Get active services only
  static async getActiveServices(): Promise<Service[]> {
    try {
      const services = await this.getServices();
      return services.filter(service => service.isActive);
    } catch (error) {
      console.error('Error fetching active services:', error);
      throw error;
    }
  }

  // Get services by category
  static async getServicesByCategory(category: string): Promise<Service[]> {
    try {
      const services = await this.getServices();
      return services.filter(service => service.category === category);
    } catch (error) {
      console.error('Error fetching services by category:', error);
      throw error;
    }
  }

  // Search services
  static async searchServices(searchTerm: string): Promise<Service[]> {
    try {
      const services = await this.getServices();
      const term = searchTerm.toLowerCase();
      
      return services.filter(service => 
        service.title.toLowerCase().includes(term) ||
        service.description.toLowerCase().includes(term) ||
        service.category.toLowerCase().includes(term)
      );
    } catch (error) {
      console.error('Error searching services:', error);
      throw error;
    }
  }

  // Validate service data
  static validateService(service: Partial<Service>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!service.title || service.title.trim().length === 0) {
      errors.push('Service title is required');
    }

    if (!service.description || service.description.trim().length === 0) {
      errors.push('Service description is required');
    }

    if (!service.price || service.price.trim().length === 0) {
      errors.push('Service price is required');
    }

    if (!service.category || service.category.trim().length === 0) {
      errors.push('Service category is required');
    }

    if (service.title && service.title.length > 100) {
      errors.push('Service title must be less than 100 characters');
    }

    if (service.description && service.description.length > 500) {
      errors.push('Service description must be less than 500 characters');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Get service statistics
  static async getServiceStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    categories: number;
  }> {
    try {
      const services = await this.getServices();
      const categories = new Set(services.map(s => s.category));
      
      return {
        total: services.length,
        active: services.filter(s => s.isActive).length,
        inactive: services.filter(s => !s.isActive).length,
        categories: categories.size
      };
    } catch (error) {
      console.error('Error fetching service stats:', error);
      throw error;
    }
  }
}

// Export individual functions for convenience
export const {
  getServices,
  subscribeToServices,
  addService,
  updateService,
  deleteService,
  toggleServiceStatus,
  getServiceForm,
  updateServiceForm,
  getActiveServices,
  getServicesByCategory,
  searchServices,
  validateService,
  getServiceStats
} = ServiceManager;

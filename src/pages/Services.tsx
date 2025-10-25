import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ServiceCard from '../components/ServiceCard';
import ServiceRequestModalEnhanced from '../components/ServiceRequestModalEnhanced';
import { collection, getDocs } from 'firebase/firestore';
import { firestore } from '../firebase';

interface Service {
  id: string;
  title: string;
  description: string;
  category: string;
  price: string;
  icon: string;
  isActive: boolean;
}

export default function Services() {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      setLoading(true);
      const servicesSnapshot = await getDocs(collection(firestore, 'services'));
      const servicesData = servicesSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Service))
        .filter(service => service.isActive);
      
      setServices(servicesData);
    } catch (error) {
      console.error('Failed to load services:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleServiceClick = (service: Service) => {
    setSelectedService(service);
    setModalOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="container-padded py-10">
          <div className="flex items-center justify-center h-64">
            <div className="text-lg">Loading services...</div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main className="container-padded py-10">
        <h1 className="section-title">Our Services</h1>
        <p className="text-sm text-gray-600 mt-2">Choose a service and get started.</p>
        <div className="mt-6 grid md:grid-cols-3 gap-4">
          {services.map((service) => (
            <ServiceCard 
              key={service.id} 
              title={service.title} 
              price={service.price} 
              onGetService={() => handleServiceClick(service)}
            />
          ))}
        </div>
      </main>
      <Footer />
      {selectedService && (
        <ServiceRequestModalEnhanced 
          open={modalOpen} 
          onClose={() => setModalOpen(false)} 
          service={selectedService}
        />
      )}
    </div>
  );
}
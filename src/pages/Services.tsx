import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ServiceCard from '../components/ServiceCard';
import ServiceRequestModalEnhanced from '../components/ServiceRequestModalEnhanced';
import { useActiveServices } from '../hooks/useServices';

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
  const { services, loading } = useActiveServices();

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
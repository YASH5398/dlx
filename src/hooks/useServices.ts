import { useState, useEffect } from 'react';
import { ServiceManager } from '../utils/serviceManagement';
import type { Service } from '../utils/serviceManagement';

export function useServices() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = ServiceManager.subscribeToServices((servicesData) => {
      setServices(servicesData);
      setLoading(false);
      setError(null);
    });

    return () => unsubscribe();
  }, []);

  const refreshServices = async () => {
    try {
      setLoading(true);
      const servicesData = await ServiceManager.getServices();
      setServices(servicesData);
      setError(null);
    } catch (err) {
      setError('Failed to refresh services');
      console.error('Error refreshing services:', err);
    } finally {
      setLoading(false);
    }
  };

  return {
    services,
    loading,
    error,
    refreshServices
  };
}

export function useActiveServices() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadActiveServices = async () => {
      try {
        setLoading(true);
        const activeServices = await ServiceManager.getActiveServices();
        setServices(activeServices);
        setError(null);
      } catch (err) {
        setError('Failed to load active services');
        console.error('Error loading active services:', err);
      } finally {
        setLoading(false);
      }
    };

    loadActiveServices();
  }, []);

  return {
    services,
    loading,
    error
  };
}

export function useServiceStats() {
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    categories: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        const serviceStats = await ServiceManager.getServiceStats();
        setStats(serviceStats);
        setError(null);
      } catch (err) {
        setError('Failed to load service statistics');
        console.error('Error loading service stats:', err);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  return {
    stats,
    loading,
    error
  };
}

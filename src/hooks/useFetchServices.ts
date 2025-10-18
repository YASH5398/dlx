import { useMemo } from 'react';
import { SERVICES } from '../utils/constants';

export function useFetchServices() {
  // Could fetch from API; currently static constants
  return useMemo(() => SERVICES, []);
}
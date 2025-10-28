import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { UserProvider } from './context/UserContext';
import { I18nProvider } from './context/I18nContext';
import { NotificationProvider } from './context/NotificationContext';
import './tailwind.css';
// import './App.css';

import App from './App';

// React Query + Toasts
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Apply persisted theme before render to avoid FOUC
const persistedTheme = localStorage.getItem('preferences.theme') || 'dark';
document.documentElement.dataset.theme = persistedTheme;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false, retry: 1 },
    mutations: { retry: 0 },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <HelmetProvider>
        <UserProvider>
          <NotificationProvider>
            <I18nProvider>
              <QueryClientProvider client={queryClient}>
                <App />
                <ToastContainer position="top-right" theme={persistedTheme === 'dark' ? 'dark' : 'light'} />
                <ReactQueryDevtools initialIsOpen={false} />
              </QueryClientProvider>
            </I18nProvider>
          </NotificationProvider>
        </UserProvider>
      </HelmetProvider>
    </BrowserRouter>
  </StrictMode>
);

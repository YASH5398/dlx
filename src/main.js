import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { UserProvider } from './context/UserContext';
import { I18nProvider } from './context/I18nContext';
import { NotificationProvider } from './context/NotificationContext';
import './tailwind.css';
import './utils/mediaSafeGuard';
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
createRoot(document.getElementById('root')).render(_jsx(StrictMode, { children: _jsx(BrowserRouter, { children: _jsx(UserProvider, { children: _jsx(NotificationProvider, { children: _jsx(I18nProvider, { children: _jsxs(QueryClientProvider, { client: queryClient, children: [_jsx(App, {}), _jsx(ToastContainer, { position: "top-right", theme: persistedTheme === 'dark' ? 'dark' : 'light' }), _jsx(ReactQueryDevtools, { initialIsOpen: false })] }) }) }) }) }) }));

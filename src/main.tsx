import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { UserProvider } from './context/UserContext';
import { I18nProvider } from './context/I18nContext';
import { NotificationProvider } from './context/NotificationContext';
import './tailwind.css';
// import './App.css';

import App from './App';

// Apply persisted theme before render to avoid FOUC
const persistedTheme = localStorage.getItem('preferences.theme') || 'dark';
document.documentElement.dataset.theme = persistedTheme;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <UserProvider>
        <NotificationProvider>
          <I18nProvider>
            <App />
          </I18nProvider>
        </NotificationProvider>
      </UserProvider>
    </BrowserRouter>
  </StrictMode>
);

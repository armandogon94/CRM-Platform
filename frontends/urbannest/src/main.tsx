import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from '@crm/shared/components/common/ToastProvider';
import { configureApi } from '@crm/shared/utils/api';
import { configureWebSocket } from '@crm/shared/hooks/useWebSocket';
import './styles/globals.css';

// Slice 20.5 B: align the shared @crm/shared/utils/api + useWebSocket
// hook with UrbanNest's slug-prefixed JWT key. Without these calls the
// shared modules read the default 'crm_access_token' and the BoardPage
// useBoard hook (REST + Socket.io) authenticates against the wrong key.
// Must run BEFORE <ToastProvider>'s subtree mounts useBoard.
configureApi({ tokenKey: 'urbannest_token' });
configureWebSocket({ tokenKey: 'urbannest_token' });

// <ToastProvider> mounts below <AuthProvider> so the app tree has access
// to useToast(). Required by the BoardPage CRUD wiring (Slice 20B C2)
// which emits toasts on error. Replaces the C0 sanity import of
// INDUSTRY_THEMES now that a real shared component is in use.
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <ToastProvider>
        <App />
      </ToastProvider>
    </AuthProvider>
  </React.StrictMode>
);

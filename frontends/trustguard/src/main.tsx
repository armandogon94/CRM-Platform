import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from '@crm/shared/components/common/ToastProvider';
import { configureApi } from '@crm/shared/utils/api';
import { configureWebSocket } from '@crm/shared/hooks/useWebSocket';
import './styles/globals.css';

// Slice 20.5 B — align the shared @crm/shared api + useWebSocket modules
// with TrustGuard's slug-prefixed JWT key. Without these calls the shared
// useBoard hook (now consumed by BoardPage) reads `crm_access_token` and
// the REST + Socket.io handshakes both 401. Last-wins, idempotent — safe
// to call once at boot before React renders.
configureApi({ tokenKey: 'trustguard_token' });
configureWebSocket({ tokenKey: 'trustguard_token' });

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

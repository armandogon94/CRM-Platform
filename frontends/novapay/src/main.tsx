import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from '@crm/shared/components/common/ToastProvider';
import { configureApi } from '@crm/shared/utils/api';
import { configureWebSocket } from '@crm/shared/hooks/useWebSocket';
import './styles/globals.css';

// Slice 20.5 — align shared utilities with NovaPay's existing token key
// so useBoard's WebSocket connection authenticates correctly. Mirrors
// the existing local api.ts which reads/writes 'novapay_token'.
configureApi({ tokenKey: 'novapay_token' });
configureWebSocket({ tokenKey: 'novapay_token' });

// <ToastProvider> mounts below <BrowserRouter> so every route has access
// to useToast(). Required by the shared useBoard mutations (Slice 20 A3)
// which emit toasts on error. Also used by the shared BoardListPage (B2)
// if NovaPay migrates to it in a future slice.
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);

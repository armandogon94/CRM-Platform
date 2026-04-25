import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from '@crm/shared/components/common/ToastProvider';
import { configureApi } from '@crm/shared/utils/api';
import { configureWebSocket } from '@crm/shared/hooks/useWebSocket';
import './styles/globals.css';

// Slice 20.5 — align shared utilities with JurisPath's existing token key
// so useBoard's WebSocket connection authenticates correctly.
configureApi({ tokenKey: 'jurispath_token' });
configureWebSocket({ tokenKey: 'jurispath_token' });

// <ToastProvider> mounts once at the root so every view (overview,
// automations, per-board) can call `useToast()` through the same
// surface. Required by the shared BoardView CRUD callbacks wired in
// C3 — every failure path emits a toast here.
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <ToastProvider>
        <App />
      </ToastProvider>
    </AuthProvider>
  </React.StrictMode>
);

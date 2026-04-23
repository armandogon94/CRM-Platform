import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from '@crm/shared/components/common/ToastProvider';
import './styles/globals.css';

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

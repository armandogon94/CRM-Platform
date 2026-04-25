import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from '@crm/shared/components/common/ToastProvider';
import './styles/globals.css';

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

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import './styles/globals.css';

// Slice 20B C0 sanity import — proves @crm/shared resolves via tsconfig
// path + vite alias. Replaced by real usage (ToastProvider mount) in C2.
import { INDUSTRY_THEMES } from '@crm/shared/theme';
void INDUSTRY_THEMES;

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);

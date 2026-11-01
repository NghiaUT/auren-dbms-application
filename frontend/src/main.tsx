// ============================================================================
// File: frontend/src/main.tsx
// Vai trò: Điểm khởi đầu (Entry point) của ứng dụng React SPA.
//          Gắn cây component gốc (App bọc trong BrowserRouter và AuthProvider) vào DOM.
// ============================================================================

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './auth/AuthContext';
import { ToastProvider } from './context/ToastContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  </React.StrictMode>,
);

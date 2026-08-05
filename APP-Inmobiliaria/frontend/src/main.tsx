import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App.tsx';
import { AuthProvider } from './auth/AuthProvider.tsx';
import { NotificacionProvider } from './components/ui/Toast.tsx';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      {/* Los avisos van por encima del router: sobreviven a un cambio de ruta,
          así que una acción puede navegar y confirmarse en el destino. */}
      <NotificacionProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </NotificacionProvider>
    </AuthProvider>
  </React.StrictMode>
);
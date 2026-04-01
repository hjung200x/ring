import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { AppRouter } from './pages/AppRouter.js';
import './styles.css';

const queryClient = new QueryClient();
const routerBase = (() => {
  const base = import.meta.env.BASE_URL || '/';
  if (base === '/') return undefined;
  return base.endsWith('/') ? base.slice(0, -1) : base;
})();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter basename={routerBase}>
        <AppRouter />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
);

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './query-client';
import './styles/styles.css';
import { initializeErrorReporting } from './error-reporting';
initializeErrorReporting();
ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode><QueryClientProvider client={queryClient}><App /></QueryClientProvider></React.StrictMode>,
);

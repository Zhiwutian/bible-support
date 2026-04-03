import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ErrorBoundary } from '@/components/app/ErrorBoundary';
import { ToastProvider } from '@/components/app/ToastProvider';
import { AppStateProvider, PreferredTranslationProvider } from '@/state';
import { BrowserRouter } from 'react-router-dom';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ToastProvider>
        <BrowserRouter>
          <AppStateProvider>
            <PreferredTranslationProvider>
              <App />
            </PreferredTranslationProvider>
          </AppStateProvider>
        </BrowserRouter>
      </ToastProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);

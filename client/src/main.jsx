import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { SessionProvider } from './context/SessionContext.jsx';
import { CartProvider } from './context/CartContext.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <SessionProvider>
      <CartProvider>
        <App />
      </CartProvider>
    </SessionProvider>
  </React.StrictMode>,
);

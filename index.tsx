import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Legacy redirect: older links (e.g. co-buyer payment links, order emails) used
// HashRouter URLs like https://halaliy.com/#/pay/TOKEN. Now that we use
// BrowserRouter, rewrite any incoming "#/path" to a real "/path" before React
// Router reads the location, so those existing links keep working.
if (window.location.hash.startsWith('#/')) {
  const target = window.location.hash.slice(1) + window.location.search;
  window.history.replaceState(null, '', target);
}

ReactDOM.createRoot(document.getElementById('root')!).render(<App />);

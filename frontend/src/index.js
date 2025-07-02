import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/responsive.css';

const root = ReactDOM.createRoot(document.getElementById('root'));

// Removido React.StrictMode temporariamente para evitar chamadas duplicadas de useEffect
// Em produção, o StrictMode não afeta o comportamento, apenas em desenvolvimento
root.render(<App />); 
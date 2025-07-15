import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { TeamProvider } from './context/TeamContext';
import axios from 'axios';
import './index.css';

// This sets the base URL for every single axios call in your app.
axios.defaults.baseURL = 'http://127.0.0.1:8000/api';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <TeamProvider>
        <App />
      </TeamProvider>
    </BrowserRouter>
  </React.StrictMode>
);
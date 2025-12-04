/**
 * Main Entry Point for Plantation Cafe Resto React Application
 *
 * Purpose: Initialize and mount the React application to the DOM
 *
 * Flow:
 * 1. Import React and ReactDOM
 * 2. Import root App component
 * 3. Import global styles (includes Tailwind CSS)
 * 4. Mount App to #root div in index.html
 *
 * For Future AI Agents:
 * - This file uses React 18's createRoot API for concurrent rendering
 * - StrictMode enabled for development warnings
 * - All Tailwind CSS loaded via index.css
 * - Do NOT modify unless changing React version or adding global providers
 */

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// Create root and render app
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

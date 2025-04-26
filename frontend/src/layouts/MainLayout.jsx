import React from 'react';
import NavBar from '../components/NavBar';
import './Layouts.css';

/**
 * Main Layout Component
 * This layout provides a common structure for most pages
 * including the NavBar and main content area
 */
const MainLayout = ({ children }) => {
  return (
    <>
      <NavBar />
      <div className="main-content">
        {children}
      </div>
    </>
  );
};

export default MainLayout; 
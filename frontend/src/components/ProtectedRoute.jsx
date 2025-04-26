import React from 'react';
import { Navigate } from 'react-router-dom';
import { useTeam } from '../context/TeamContext';

const ProtectedRoute = ({ children }) => {
  const { teamId, loading } = useTeam();
  
  // Show nothing while checking session storage
  if (loading) {
    return null;
  }
  
  // Redirect to start page if no team ID is found
  if (!teamId) {
    return <Navigate to="/start" replace />;
  }
  
  // Render the protected content
  return children;
};

export default ProtectedRoute; 
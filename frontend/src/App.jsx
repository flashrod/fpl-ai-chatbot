import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { TeamProvider } from './context/TeamContext';
import ProtectedRoute from './components/ProtectedRoute';
import TeamDashboard from './components/TeamDashboard';
import StartPage from './pages/StartPage';
import ChatBot from './components/ChatBot';
import ChipCalculator from './components/ChipCalculator';
import Background from './components/Background';
import NavBar from './components/NavBar';
import ApiTester from './components/ApiTester';
import DashboardCountdownWidget from './components/DashboardCountdownWidget.jsx';
import './App.css';

const App = () => {
  const [countdownError, setCountdownError] = useState(null);
  
  // Function to handle refreshing data when deadline passes
  const handleDeadlinePassed = () => {
    console.log("Global deadline passed - refreshing app data");
    // Could implement a global app refresh strategy here
    // For now, we'll rely on individual components to handle this
  };
  
  // Error boundary for the countdown widget
  const renderCountdownWidget = () => {
    try {
      return <DashboardCountdownWidget onDeadlinePassed={handleDeadlinePassed} />;
    } catch (error) {
      console.error('Error rendering countdown widget:', error);
      setCountdownError(error.message);
      return (
        <div className="countdown-error">
          Unable to display deadline countdown. Refresh to try again.
        </div>
      );
    }
  };

  return (
    <Router>
      <TeamProvider>
        <div className="app">
          <Background />
          <main className="content">
            <Routes>
              {/* Public routes */}
              <Route path="/start" element={<StartPage />} />
              <Route path="/api-test" element={<ApiTester />} />
              
              {/* Protected routes */}
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <NavBar />
                    <div className="main-content">
                      {renderCountdownWidget()}
                      <TeamDashboard />
                    </div>
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/chat" 
                element={
                  <ProtectedRoute>
                    <NavBar />
                    <div className="main-content">
                      {renderCountdownWidget()}
                      <ChatBot />
                    </div>
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/chips" 
                element={
                  <ProtectedRoute>
                    <NavBar />
                    <div className="main-content">
                      {renderCountdownWidget()}
                      <ChipCalculator />
                    </div>
                  </ProtectedRoute>
                } 
              />
              
              {/* Legacy route (kept for compatibility) */}
              <Route 
                path="/user/:teamId" 
                element={
                  <>
                    <NavBar />
                    <div className="main-content">
                      {renderCountdownWidget()}
                      <TeamDashboard />
                    </div>
                  </>
                } 
              />
              
              {/* Redirect to start or dashboard */}
              <Route path="/" element={<Navigate to="/start" replace />} />
              <Route path="*" element={<Navigate to="/start" replace />} />
            </Routes>
          </main>
        </div>
      </TeamProvider>
    </Router>
  );
};

export default App; 
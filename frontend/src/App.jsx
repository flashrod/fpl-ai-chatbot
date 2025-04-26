import React from 'react';
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
import './App.css';

const App = () => {
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
                      <ChipCalculator />
                    </div>
                  </ProtectedRoute>
                } 
              />
              
              {/* Legacy route (kept for compatibility) */}
              <Route path="/user/:teamId" element={<TeamDashboard />} />
              
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
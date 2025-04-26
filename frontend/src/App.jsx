import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { TeamProvider } from './context/TeamContext';
import ProtectedRoute from './components/ProtectedRoute';
import Background from './components/Background';
import MainLayout from './layouts/MainLayout';

// Import page components
import StartPage from './pages/StartPage';
import DashboardPage from './pages/DashboardPage';
import ChatPage from './pages/ChatPage';
import ChipsPage from './pages/ChipsPage';
import UserTeamPage from './pages/UserTeamPage';
import ApiTester from './pages/ApiTester';
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
              <Route 
                path="/api-test" 
                element={
                  <MainLayout>
                    <ApiTester />
                  </MainLayout>
                } 
              />
              
              {/* Protected routes */}
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <DashboardPage />
                    </MainLayout>
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/chat" 
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <ChatPage />
                    </MainLayout>
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/chips" 
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <ChipsPage />
                    </MainLayout>
                  </ProtectedRoute>
                } 
              />
              
              {/* Legacy route (kept for compatibility) */}
              <Route 
                path="/user/:teamId" 
                element={
                  <MainLayout>
                    <UserTeamPage />
                  </MainLayout>
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
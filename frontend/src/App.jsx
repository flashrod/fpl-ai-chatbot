import React, { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import LoadingAnimation from './components/LoadingAnimation';
import './App.css';

// Lazy load the page components for better performance
const StartPage = lazy(() => import('./pages/StartPage'));
const ChatPage = lazy(() => import('./pages/ChatPage'));
const UserTeamPage = lazy(() => import('./pages/UserTeamPage'));
const ChipsPage = lazy(() => import('./pages/ChipsPage'));
const ApiTester = lazy(() => import('./pages/ApiTester'));

function App() {
  return (
    // The old <BrowserRouter> has been removed from here.
    <MainLayout>
      <Suspense fallback={<LoadingAnimation />}>
        <Routes>
          <Route path="/" element={<StartPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/user/:teamId" element={<UserTeamPage />} />
          <Route path="/chips" element={<ChipsPage />} />
          <Route path="/api-tester" element={<ApiTester />} />
        </Routes>
      </Suspense>
    </MainLayout>
  );
}

export default App;
import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import ChatBot from './components/ChatBot'
import TeamRating from './components/TeamRating'
import ChipCalculator from './components/ChipCalculator'
import TeamDashboard from './components/TeamDashboard'
import Background from './components/Background'
import { FaComment, FaTrophy, FaMagic, FaUser } from 'react-icons/fa'
import './App.css'

// Wrapper component for the main app content
function MainContent() {
  const [activeTab, setActiveTab] = useState('chat')
  const [teamRatingResponse, setTeamRatingResponse] = useState(null)
  const [mounted, setMounted] = useState(false)
  const [isParticlesEnabled, setIsParticlesEnabled] = useState(true)
  const location = useLocation()

  // Mount animation trigger
  useEffect(() => {
    setMounted(true)

    // Check if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    setIsParticlesEnabled(!prefersReducedMotion)
  }, [])

  // Set active tab based on route
  useEffect(() => {
    const path = location.pathname;
    if (path === '/') {
      setActiveTab('chat');
    } else if (path === '/team-rating') {
      setActiveTab('team-rating');
    } else if (path === '/chip-calculator') {
      setActiveTab('chip-calculator');
    }
  }, [location]);

  const handleTeamRatingReceived = (response) => {
    setTeamRatingResponse(response)
    setActiveTab('chat')
  }

  // Animation variants for different elements
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        duration: 0.5,
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    }
  }

  const headerVariants = {
    hidden: { y: -50, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { type: "spring", stiffness: 100, damping: 20 }
    }
  }

  const tabsVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { type: "spring", stiffness: 200, damping: 20 }
    }
  }

  const contentVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        type: "spring", 
        stiffness: 100, 
        damping: 15,
        delay: 0.2 
      }
    },
    exit: { 
      opacity: 0, 
      y: -20, 
      transition: { duration: 0.2 }
    }
  }

  const footerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { delay: 0.5, duration: 0.5 }
    }
  }

  // If we're on a user page route, don't show the main layout
  if (location.pathname.startsWith('/user/')) {
    return (
      <Routes>
        <Route path="/user/:teamId" element={<TeamDashboard />} />
      </Routes>
    );
  }

  return (
    <motion.div 
      className="app-container"
      variants={containerVariants}
      initial="hidden"
      animate={mounted ? "visible" : "hidden"}
    >
      {isParticlesEnabled && <Background />}
      
      <motion.header 
        className="app-header"
        variants={headerVariants}
      >
        <h1>
          <motion.span 
            className="soccer-icon"
            animate={{ 
              rotate: [0, 360],
            }}
            transition={{ 
              repeat: Infinity, 
              duration: 8,
              ease: "linear" 
            }}
          >
            ⚽
          </motion.span> 
          <span>FPL AI</span> Assistant
        </h1>
      </motion.header>
      
      <motion.div 
        className="app-tabs"
        variants={tabsVariants}
      >
        <Link to="/">
          <motion.button 
            className={`tab-button ${activeTab === 'chat' ? 'active' : ''}`}
            whileHover={{ backgroundColor: 'rgba(5, 211, 177, 0.08)' }}
            whileTap={{ scale: 0.98 }}
          >
            <span className="tab-icon"><FaComment /></span> Chat
          </motion.button>
        </Link>
        <Link to="/team-rating">
          <motion.button 
            className={`tab-button ${activeTab === 'team-rating' ? 'active' : ''}`}
            whileHover={{ backgroundColor: 'rgba(5, 211, 177, 0.08)' }}
            whileTap={{ scale: 0.98 }}
          >
            <span className="tab-icon"><FaTrophy /></span> Team Rating
          </motion.button>
        </Link>
        <Link to="/chip-calculator">
          <motion.button 
            className={`tab-button ${activeTab === 'chip-calculator' ? 'active' : ''}`}
            whileHover={{ backgroundColor: 'rgba(5, 211, 177, 0.08)' }}
            whileTap={{ scale: 0.98 }}
          >
            <span className="tab-icon"><FaMagic /></span> Chip Planner
          </motion.button>
        </Link>
        <Link to="/user/1">
          <motion.button 
            className="tab-button"
            whileHover={{ backgroundColor: 'rgba(5, 211, 177, 0.08)' }}
            whileTap={{ scale: 0.98 }}
          >
            <span className="tab-icon"><FaUser /></span> Team Dashboard
          </motion.button>
        </Link>
      </motion.div>
      
      <motion.main variants={contentVariants}>
        <AnimatePresence mode="wait">
          <Routes>
            <Route path="/" element={
              <motion.div
                key="chat"
                className="tab-content"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <ChatBot initialMessage={teamRatingResponse} />
              </motion.div>
            } />
            <Route path="/team-rating" element={
              <motion.div
                key="team-rating"
                className="tab-content"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <TeamRating onRatingReceived={handleTeamRatingReceived} />
              </motion.div>
            } />
            <Route path="/chip-calculator" element={
              <motion.div
                key="chip-calculator"
                className="tab-content"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <ChipCalculator />
              </motion.div>
            } />
            <Route path="/user/:teamId" element={<TeamDashboard />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AnimatePresence>
      </motion.main>
      
      <motion.footer 
        className="app-footer"
        variants={footerVariants}
      >
        <p>Powered by <motion.span whileHover={{ scale: 1.05 }}>Fantasy Premier League API</motion.span> + <motion.span whileHover={{ scale: 1.05 }}>Gemini AI</motion.span></p>
      </motion.footer>
    </motion.div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <MainContent />
    </BrowserRouter>
  )
}

export default App 
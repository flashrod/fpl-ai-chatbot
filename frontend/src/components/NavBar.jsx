import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaComment, 
  FaTrophy, 
  FaMagic, 
  FaUser, 
  FaSignOutAlt, 
  FaBars, 
  FaTimes,
  FaChartLine,
  FaFootballBall 
} from 'react-icons/fa';
import { useTeam } from '../context/TeamContext';
import './NavBar.css';

const NavBar = () => {
  const location = useLocation();
  const { teamId, clearTeamId, teamData } = useTeam();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Handle scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  // Check if a route is active
  const isActive = (path) => {
    return location.pathname === path;
  };
  
  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  // Close mobile menu when navigating
  const handleNavigation = () => {
    if (mobileMenuOpen) {
      setMobileMenuOpen(false);
    }
  };
  
  return (
    <motion.nav 
      className={`navbar ${scrolled ? 'navbar-scrolled' : ''}`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ 
        type: "spring", 
        stiffness: 100, 
        damping: 20 
      }}
    >
      <div className="navbar-container">
        <div className="navbar-brand">
          <Link to="/" className="logo-link">
            <motion.div 
              className="logo"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <motion.div 
                className="logo-icon"
                animate={{ rotate: [0, 360] }}
                transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
              >
                <FaFootballBall />
              </motion.div>
              <span className="logo-text">
                <span className="logo-highlight">FPL</span> AI
              </span>
            </motion.div>
          </Link>
          
          {/* Mobile menu toggle */}
          <motion.button 
            className="mobile-menu-toggle"
            whileTap={{ scale: 0.9 }}
            onClick={toggleMobileMenu}
          >
            {mobileMenuOpen ? <FaTimes /> : <FaBars />}
          </motion.button>
        </div>
        
        {/* Team info display */}
        {teamId && teamData && (
          <motion.div 
            className="team-info"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="team-badge">
              <FaUser />
            </div>
            <div className="team-details">
              <h3 className="team-name">{teamData.name}</h3>
              <div className="team-meta">
                <span className="team-id">ID: {teamId}</span>
                <span className="rank">Rank: {teamData.overall_rank?.toLocaleString() || 'N/A'}</span>
              </div>
            </div>
          </motion.div>
        )}
        
        {/* Navigation links - Desktop */}
        <div className="navbar-links desktop-menu">
          <NavLink 
            to="/dashboard" 
            icon={<FaChartLine />} 
            text="Dashboard" 
            isActive={isActive('/dashboard')}
            onClick={handleNavigation}
          />
          <NavLink 
            to="/chat" 
            icon={<FaComment />} 
            text="Chat with AI" 
            isActive={isActive('/chat')}
            onClick={handleNavigation}
          />
          <NavLink 
            to="/chips" 
            icon={<FaMagic />} 
            text="Chips Strategy" 
            isActive={isActive('/chips')}
            onClick={handleNavigation}
          />
          <motion.button 
            className="change-team-btn"
            onClick={clearTeamId}
            whileHover={{ backgroundColor: "rgba(220, 53, 69, 0.12)" }}
            whileTap={{ scale: 0.95 }}
          >
            <FaSignOutAlt />
            <span>Change Team</span>
          </motion.button>
        </div>
        
        {/* Mobile Navigation Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div 
              className="mobile-menu"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <NavLink 
                to="/dashboard" 
                icon={<FaChartLine />} 
                text="Dashboard" 
                isActive={isActive('/dashboard')}
                onClick={handleNavigation}
                mobile
              />
              <NavLink 
                to="/chat" 
                icon={<FaComment />} 
                text="Chat with AI" 
                isActive={isActive('/chat')}
                onClick={handleNavigation}
                mobile
              />
              <NavLink 
                to="/chips" 
                icon={<FaMagic />} 
                text="Chips Strategy" 
                isActive={isActive('/chips')}
                onClick={handleNavigation}
                mobile
              />
              <motion.button 
                className="change-team-btn mobile"
                onClick={() => {
                  clearTeamId();
                  handleNavigation();
                }}
                whileTap={{ scale: 0.95 }}
              >
                <FaSignOutAlt />
                <span>Change Team</span>
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  );
};

// NavLink component for consistent styling of navigation links
const NavLink = ({ to, icon, text, isActive, onClick, mobile }) => {
  return (
    <Link to={to} onClick={onClick}>
      <motion.div 
        className={`nav-link ${isActive ? 'active' : ''} ${mobile ? 'mobile' : ''}`}
        whileHover={{ backgroundColor: isActive ? "" : "rgba(255, 255, 255, 0.1)" }}
        whileTap={{ scale: 0.95 }}
      >
        <div className="nav-icon">{icon}</div>
        <span className="nav-text">{text}</span>
        {isActive && (
          <motion.div 
            className="active-indicator"
            layoutId="activeIndicator"
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
        )}
      </motion.div>
    </Link>
  );
};

export default NavBar; 
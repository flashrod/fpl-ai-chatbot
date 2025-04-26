import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaComment, FaTrophy, FaMagic, FaUser, FaSignOutAlt } from 'react-icons/fa';
import { useTeam } from '../context/TeamContext';
import './NavBar.css';

const NavBar = () => {
  const location = useLocation();
  const { teamId, clearTeamId, teamData } = useTeam();
  
  // Get current active route
  const getActiveClass = (path) => {
    return location.pathname === path ? 'active' : '';
  };
  
  return (
    <motion.nav 
      className="navbar"
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3, type: 'spring', stiffness: 100 }}
    >
      <div className="navbar-brand">
        <h1>
          <motion.span 
            className="soccer-icon"
            animate={{ rotate: [0, 360] }}
            transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
          >
            ⚽
          </motion.span> 
          <span>FPL AI</span> Assistant
        </h1>
      </div>
      
      <div className="team-info-bar">
        <div className="team-id-display">
          <span className="label">Team ID:</span> 
          <span className="value">{teamId}</span>
          {teamData && (
            <span className="team-name">{teamData.name}</span>
          )}
        </div>
      </div>
      
      <div className="navbar-menu">
        <Link to="/dashboard">
          <motion.button 
            className={`nav-button ${getActiveClass('/dashboard')}`}
            whileHover={{ backgroundColor: 'rgba(5, 211, 177, 0.08)' }}
            whileTap={{ scale: 0.98 }}
          >
            <span className="nav-icon"><FaUser /></span> Dashboard
          </motion.button>
        </Link>
        <Link to="/chat">
          <motion.button 
            className={`nav-button ${getActiveClass('/chat')}`}
            whileHover={{ backgroundColor: 'rgba(5, 211, 177, 0.08)' }}
            whileTap={{ scale: 0.98 }}
          >
            <span className="nav-icon"><FaComment /></span> Chat
          </motion.button>
        </Link>
        <Link to="/chips">
          <motion.button 
            className={`nav-button ${getActiveClass('/chips')}`}
            whileHover={{ backgroundColor: 'rgba(5, 211, 177, 0.08)' }}
            whileTap={{ scale: 0.98 }}
          >
            <span className="nav-icon"><FaMagic /></span> Chips
          </motion.button>
        </Link>
        <motion.button 
          className="nav-button sign-out"
          whileHover={{ backgroundColor: 'rgba(220, 53, 69, 0.1)' }}
          whileTap={{ scale: 0.98 }}
          onClick={clearTeamId}
        >
          <span className="nav-icon"><FaSignOutAlt /></span> Change Team
        </motion.button>
      </div>
    </motion.nav>
  );
};

export default NavBar; 
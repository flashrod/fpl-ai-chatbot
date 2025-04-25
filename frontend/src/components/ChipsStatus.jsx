import React from 'react';
import { motion } from 'framer-motion';
import './ChipsStatus.css';

const ChipsStatus = ({ chips }) => {
  if (!chips || !chips.status || !Array.isArray(chips.status) || !chips.used || !Array.isArray(chips.used)) {
    return <div className="no-chips-data">No chips data available</div>;
  }

  const chipLabels = {
    'wildcard': 'Wildcard',
    'wildcard2': 'Wildcard 2',
    'freehit': 'Free Hit',
    'bboost': 'Bench Boost',
    '3xc': 'Triple Captain'
  };

  const { status, used } = chips;

  // Animation variants for staggered animation
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="chips-status">
      <motion.div 
        className="chips-grid"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {status.map((chip, index) => (
          <motion.div 
            key={`${chip.name}-${index}`}
            className={`chip-card ${chip.available ? 'available' : 'used'}`}
            variants={itemVariants}
          >
            <div className="chip-name">{chipLabels[chip.name] || chip.name}</div>
            <div className="chip-status">
              {chip.available ? (
                <span className="available-text">Available</span>
              ) : (
                <span className="used-text">
                  Used in GW{chip.used_in}
                </span>
              )}
            </div>
          </motion.div>
        ))}
      </motion.div>

      {used.length > 0 && (
        <motion.div 
          className="chips-history"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h3>Chips History</h3>
          <ul>
            {used.map((chip, index) => (
              <li key={index}>
                <span className="chip-name">{chipLabels[chip.name] || chip.name}</span> 
                <span className="chip-gw">GW{chip.event}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      )}
    </div>
  );
};

export default ChipsStatus; 
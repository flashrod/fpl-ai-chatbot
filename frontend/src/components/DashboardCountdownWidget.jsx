import React from 'react';
import { motion } from 'framer-motion';
import DeadlineCountdown from './DeadlineCountdown';
import './DashboardCountdownWidget.css';

/**
 * A reusable widget that displays the FPL gameweek deadline countdown
 * Can be placed on any dashboard or page
 */
const DashboardCountdownWidget = ({ onDeadlinePassed }) => {
  return (
    <motion.div
      className="countdown-widget"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <DeadlineCountdown onDeadlinePassed={onDeadlinePassed} />
    </motion.div>
  );
};

export default DashboardCountdownWidget; 
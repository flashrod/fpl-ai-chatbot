import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import './RankChart.css';

const RankChart = ({ history }) => {
  const canvasRef = useRef(null);
  
  useEffect(() => {
    if (!history || !Array.isArray(history) || history.length === 0 || !canvasRef.current) {
      return;
    }
    
    // Filter out any invalid entries
    const validHistory = history.filter(entry => 
      entry && typeof entry === 'object' && 
      entry.event && 
      typeof entry.overall_rank === 'number');
    
    if (validHistory.length === 0) {
      return;
    }
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Sort history by event (gameweek)
    const sortedHistory = [...validHistory].sort((a, b) => a.event - b.event);
    
    // Find min and max ranks (y-axis)
    const maxRank = Math.max(...sortedHistory.map(gw => gw.overall_rank));
    const minRank = Math.min(...sortedHistory.map(gw => gw.overall_rank));
    const padding = 20;
    
    // Logarithmic scale for ranks (as ranks can be very large numbers)
    const logMinRank = minRank === 0 ? 0 : Math.log(minRank);
    const logMaxRank = Math.log(maxRank);
    
    // Draw axes
    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = 1;
    
    // Draw horizontal grid lines
    const numHorizontalLines = 5;
    for (let i = 0; i <= numHorizontalLines; i++) {
      const y = padding + (height - 2 * padding) * (i / numHorizontalLines);
      
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
      
      // Add rank labels
      const logRank = logMinRank + (logMaxRank - logMinRank) * (i / numHorizontalLines);
      const rank = Math.round(Math.exp(logRank));
      ctx.fillStyle = '#888';
      ctx.font = '10px Arial';
      ctx.textAlign = 'right';
      ctx.fillText(formatRank(rank), padding - 5, y + 4);
    }
    
    // Draw vertical grid lines and gameweek labels
    const numGameweeks = sortedHistory.length;
    for (let i = 0; i < numGameweeks; i++) {
      const x = padding + (width - 2 * padding) * (i / (numGameweeks - 1));
      
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, height - padding);
      ctx.stroke();
      
      // Add gameweek labels
      const gameweek = sortedHistory[i].event;
      ctx.fillStyle = '#888';
      ctx.font = '10px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`GW${gameweek}`, x, height - padding + 15);
    }
    
    // Draw line chart
    ctx.beginPath();
    ctx.strokeStyle = '#05d3b1';
    ctx.lineWidth = 2;
    
    // Draw the line for overall rank
    for (let i = 0; i < sortedHistory.length; i++) {
      const x = padding + (width - 2 * padding) * (i / (numGameweeks - 1));
      
      // Convert rank to logarithmic scale for better visualization
      const logRank = Math.log(sortedHistory[i].overall_rank);
      // Map to canvas coordinates (y-axis is inverted in canvas)
      const y = padding + (height - 2 * padding) * ((logRank - logMinRank) / (logMaxRank - logMinRank));
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();
    
    // Add data points with ranks
    for (let i = 0; i < sortedHistory.length; i++) {
      const x = padding + (width - 2 * padding) * (i / (numGameweeks - 1));
      const logRank = Math.log(sortedHistory[i].overall_rank);
      const y = padding + (height - 2 * padding) * ((logRank - logMinRank) / (logMaxRank - logMinRank));
      
      // Draw point
      ctx.beginPath();
      ctx.fillStyle = '#05d3b1';
      ctx.arc(x, y, 4, 0, 2 * Math.PI);
      ctx.fill();
      
      // Add rank text
      const rank = sortedHistory[i].overall_rank;
      ctx.fillStyle = '#333';
      ctx.font = '10px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(formatRank(rank), x, y - 8);
    }
    
  }, [history]);
  
  if (!history || history.length === 0) {
    return (
      <div className="no-chart-data">
        <p>No rank history available</p>
      </div>
    );
  }
  
  // Create a summary of the rank trend
  const sortedHistory = [...history].sort((a, b) => a.event - b.event);
  const firstRank = sortedHistory[0]?.overall_rank;
  const lastRank = sortedHistory[sortedHistory.length - 1]?.overall_rank;
  
  const getRankTrend = () => {
    if (lastRank < firstRank) {
      const improvement = ((firstRank - lastRank) / firstRank * 100).toFixed(1);
      return (
        <div className="rank-trend positive">
          <span className="trend-arrow">↑</span> 
          <span>Improved {improvement}% in last {sortedHistory.length} GWs</span>
        </div>
      );
    } else if (lastRank > firstRank) {
      const decline = ((lastRank - firstRank) / firstRank * 100).toFixed(1);
      return (
        <div className="rank-trend negative">
          <span className="trend-arrow">↓</span> 
          <span>Dropped {decline}% in last {sortedHistory.length} GWs</span>
        </div>
      );
    } else {
      return (
        <div className="rank-trend neutral">
          <span className="trend-arrow">→</span> 
          <span>Rank unchanged in last {sortedHistory.length} GWs</span>
        </div>
      );
    }
  };
  
  return (
    <motion.div 
      className="rank-chart"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="chart-header">
        <div className="chart-title">Overall Rank Progression</div>
        {getRankTrend()}
      </div>
      <div className="chart-container">
        <canvas ref={canvasRef} width={400} height={200} />
      </div>
      <div className="chart-footer">
        <div className="rank-start">
          <span className="label">Start:</span> {formatRank(firstRank)}
        </div>
        <div className="rank-current">
          <span className="label">Current:</span> {formatRank(lastRank)}
        </div>
      </div>
    </motion.div>
  );
};

// Helper function to format rank with commas (e.g., 1,234,567)
const formatRank = (rank) => {
  if (!rank) return 'N/A';
  return rank.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

export default RankChart; 
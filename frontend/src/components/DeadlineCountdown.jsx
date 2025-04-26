import React from 'react';
import useDeadlineCountdown from '../hooks/useDeadlineCountdown';
import './DeadlineCountdown.css';

const DeadlineCountdown = ({ onDeadlinePassed }) => {
  const {
    deadline,
    gameweekInfo,
    timeRemaining,
    isLoading,
    error, 
    isPassed,
    usingFallback,
    formatTimeUnit
  } = useDeadlineCountdown(onDeadlinePassed);

  if (isLoading) {
    return <div className="deadline-loading">Loading deadline...</div>;
  }

  if (error && !deadline) {
    return <div className="deadline-error">Error: {error}</div>;
  }

  if (isPassed) {
    return (
      <div className="deadline-countdown passed">
        <div className="deadline-title">Gameweek deadline has passed</div>
        <div className="deadline-subtitle">Team data will refresh soon</div>
      </div>
    );
  }

  return (
    <div className={`deadline-countdown ${usingFallback ? 'fallback' : ''}`}>
      {usingFallback && (
        <div className="fallback-notice">
          <span className="fallback-icon">⚠️</span>
          <span>Using simulated data due to API connection issue: {error}</span>
        </div>
      )}
      <div className="deadline-header">
        <div className="deadline-icon">⏱️</div>
        <div className="deadline-title">
          {gameweekInfo ? `${gameweekInfo.name} Deadline` : 'Gameweek Deadline'}
        </div>
      </div>
      <div className="countdown-timer">
        <div className="countdown-unit">
          <div className="countdown-value">{formatTimeUnit(timeRemaining.days)}</div>
          <div className="countdown-label">Days</div>
        </div>
        <div className="countdown-separator">:</div>
        <div className="countdown-unit">
          <div className="countdown-value">{formatTimeUnit(timeRemaining.hours)}</div>
          <div className="countdown-label">Hours</div>
        </div>
        <div className="countdown-separator">:</div>
        <div className="countdown-unit">
          <div className="countdown-value">{formatTimeUnit(timeRemaining.minutes)}</div>
          <div className="countdown-label">Mins</div>
        </div>
        <div className="countdown-separator">:</div>
        <div className="countdown-unit">
          <div className="countdown-value">{formatTimeUnit(timeRemaining.seconds)}</div>
          <div className="countdown-label">Secs</div>
        </div>
      </div>
      <div className="deadline-exact">
        {deadline ? deadline.toUTCString() : ''}
      </div>
    </div>
  );
};

export default DeadlineCountdown; 
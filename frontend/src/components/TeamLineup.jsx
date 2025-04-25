import React from 'react';
import { motion } from 'framer-motion';
import './TeamLineup.css';

const TeamLineup = ({ lineup }) => {
  if (!lineup || !Array.isArray(lineup) || lineup.length === 0) {
    return <div className="no-lineup">No lineup data available</div>;
  }
  
  // Separate players into position categories
  const starters = lineup.filter(player => player && typeof player === 'object' && player.position_order <= 11);
  const bench = lineup.filter(player => player && typeof player === 'object' && player.position_order > 11);
  
  // Sort starters by position (GK, DEF, MID, FWD) and then by position_order
  const sortedStarters = starters.sort((a, b) => {
    const positionOrder = { 'GK': 1, 'DEF': 2, 'MID': 3, 'FWD': 4 };
    if (positionOrder[a.position] !== positionOrder[b.position]) {
      return positionOrder[a.position] - positionOrder[b.position];
    }
    return a.position_order - b.position_order;
  });
  
  // Group players by position
  const goalkeepers = sortedStarters.filter(player => player.position === 'GK');
  const defenders = sortedStarters.filter(player => player.position === 'DEF');
  const midfielders = sortedStarters.filter(player => player.position === 'MID');
  const forwards = sortedStarters.filter(player => player.position === 'FWD');
  
  return (
    <div className="team-lineup">
      <div className="pitch">
        <div className="row goalkeeper-row">
          {goalkeepers.map((player, index) => (
            <PlayerCard key={player.id} player={player} index={index} />
          ))}
        </div>
        <div className="row defenders-row">
          {defenders.map((player, index) => (
            <PlayerCard key={player.id} player={player} index={index} />
          ))}
        </div>
        <div className="row midfielders-row">
          {midfielders.map((player, index) => (
            <PlayerCard key={player.id} player={player} index={index} />
          ))}
        </div>
        <div className="row forwards-row">
          {forwards.map((player, index) => (
            <PlayerCard key={player.id} player={player} index={index} />
          ))}
        </div>
      </div>
      
      <div className="bench">
        <h3>Bench</h3>
        <div className="bench-players">
          {bench.map((player, index) => (
            <PlayerCard key={player.id} player={player} index={index} isBench={true} />
          ))}
        </div>
      </div>
    </div>
  );
};

const PlayerCard = ({ player, index, isBench = false }) => {
  // Multiplier is used for captain (2x) and triple captain (3x)
  const multiplierText = player.multiplier > 1 ? `${player.multiplier}×` : '';
  
  // Determine captain/vice-captain badge
  const getCaptainBadge = () => {
    if (player.is_captain) return 'C';
    if (player.is_vice_captain) return 'VC';
    return null;
  };
  
  const captainBadge = getCaptainBadge();
  
  // Animation delay based on index
  const delay = 0.05 + (index * 0.05);
  
  // Determine color class based on points
  const getPointsColorClass = (points) => {
    if (points < 0) return 'negative-points';
    if (points === 0) return 'zero-points';
    if (points <= 2) return 'low-points';
    if (points <= 5) return 'medium-points';
    if (points <= 10) return 'high-points';
    return 'exceptional-points';
  };
  
  return (
    <motion.div 
      className={`player-card ${isBench ? 'bench-player' : ''}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
    >
      {captainBadge && (
        <div className={`captain-badge ${player.is_captain ? 'captain' : 'vice-captain'}`}>
          {captainBadge}
        </div>
      )}
      
      <div className={`player-team-badge ${player.team?.toLowerCase()}`}>
        {player.team}
      </div>
      
      <div className="player-name">{player.name}</div>
      
      <div className={`player-points ${getPointsColorClass(player.points)}`}>
        {multiplierText && <span className="multiplier">{multiplierText}</span>}
        {player.points}
      </div>
      
      <div className="player-price">£{player.price}m</div>
    </motion.div>
  );
};

export default TeamLineup; 
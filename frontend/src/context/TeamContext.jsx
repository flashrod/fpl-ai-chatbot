import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

// Create the context
const TeamContext = createContext();

// Create the provider component
export const TeamProvider = ({ children }) => {
  const [teamId, setTeamId] = useState(null);
  const [teamData, setTeamData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // On mount, check sessionStorage for existing teamId
  useEffect(() => {
    const storedTeamId = sessionStorage.getItem('fplTeamId');
    if (storedTeamId) {
      console.log(`Retrieved stored team ID from session: ${storedTeamId}`);
      setTeamId(storedTeamId);
    }
    setLoading(false);
  }, []);

  // Save teamId to storage and state
  const saveTeamId = useCallback((id) => {
    if (id) {
      console.log(`Saving team ID to session: ${id}`);
      sessionStorage.setItem('fplTeamId', id);
      setTeamId(id);
      return true;
    }
    return false;
  }, []);

  // Clear team ID and redirect to start
  const clearTeamId = useCallback(() => {
    console.log('Clearing team ID from session');
    sessionStorage.removeItem('fplTeamId');
    setTeamId(null);
    setTeamData(null);
    navigate('/start');
  }, [navigate]);

  // Set team data - optimize to prevent unnecessary updates
  const updateTeamData = useCallback((data) => {
    if (!data) {
      console.warn('updateTeamData called with null or undefined data');
      return;
    }
    
    console.log('Updating team data:', data);
    
    // Simply set the team data - previous optimization was causing issues
    setTeamData(data);
    
    // If this call included a team_id, update that too
    if (data.team_id && !teamId) {
      console.log(`Setting team ID from data: ${data.team_id}`);
      saveTeamId(data.team_id.toString());
    }
  }, [teamId, saveTeamId]);

  const contextValue = {
    teamId,
    teamData,
    loading,
    saveTeamId,
    clearTeamId,
    updateTeamData
  };

  // Add debugging to see what's in context when it changes
  useEffect(() => {
    console.log('TeamContext updated:', { teamId, hasTeamData: !!teamData });
  }, [teamId, teamData]);

  return (
    <TeamContext.Provider value={contextValue}>
      {children}
    </TeamContext.Provider>
  );
};

// Custom hook for using the team context
export const useTeam = () => {
  const context = useContext(TeamContext);
  if (!context) {
    throw new Error('useTeam must be used within a TeamProvider');
  }
  return context;
}; 
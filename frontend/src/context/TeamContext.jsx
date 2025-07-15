import React, { createContext, useState, useContext } from 'react';
import axios from 'axios';

const TeamContext = createContext();

export const useTeam = () => useContext(TeamContext);

export const TeamProvider = ({ children }) => {
  const [teamId, setTeamIdState] = useState(null);
  const [teamData, setTeamData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const validateAndSetTeamId = async (id) => {
    setIsLoading(true);
    setError(null);
    setTeamData(null);
    try {
      // *** THIS IS THE FIX ***
      // We now call the correct endpoint for manager entries
      const response = await axios.get(`http://127.0.0.1:8000/api/entry/${id}`);
      
      if (response.data) {
        setTeamData(response.data);
        setTeamIdState(id);
        console.log("Successfully fetched team data:", response.data);
      } else {
         throw new Error("No data returned from API");
      }
    } catch (err) {
      console.error("Error validating team ID: ", err);
      const errorMessage = err.response?.data?.detail || 'Invalid Team ID or API error.';
      setError(errorMessage);
      setTeamData(null);
      setTeamIdState(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TeamContext.Provider value={{ teamId, teamData, setTeamData, isLoading, error, validateAndSetTeamId }}>
      {children}
    </TeamContext.Provider>
  );
};
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

// Fallback data that mimics the FPL API response structure
// This helps us bypass the network error for development
const FALLBACK_DATA = {
  events: [
    {
      id: 1, 
      name: "Gameweek 1",
      deadline_time: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
      is_current: true,
      is_next: false,
      finished: false,
      average_points: 52
    },
    {
      id: 2,
      name: "Gameweek 2",
      deadline_time: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days from now
      is_current: false, 
      is_next: true,
      finished: false,
      average_points: 0
    }
  ]
};

/**
 * Custom hook to manage FPL gameweek deadline countdown
 * @param {Function} onDeadlinePassed - Callback to execute 1 hour after deadline passes
 * @returns {Object} Countdown state and data
 */
const useDeadlineCountdown = (onDeadlinePassed) => {
  const [deadline, setDeadline] = useState(null);
  const [gameweekInfo, setGameweekInfo] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPassed, setIsPassed] = useState(false);
  const [usingFallback, setUsingFallback] = useState(false);

  // Fetch deadline from the FPL API
  const fetchDeadline = useCallback(async () => {
    try {
      setIsLoading(true);
      setUsingFallback(false);
      
      console.log('Fetching FPL deadline data...');
      
      // Use Axios with our backend proxy instead of direct fetch
      const response = await axios.get('/api/fpl/bootstrap-static', {
        timeout: 10000 // 10 second timeout
      });
      
      console.log('FPL data fetched successfully');
      
      // Process the data
      processGameweekData(response.data);
      
    } catch (err) {
      // Handle errors
      console.error('Error fetching FPL data:', err);
      
      if (err.code === 'ECONNABORTED') {
        setError('Request to Fantasy Premier League API timed out. Using fallback data.');
      } else if (err.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        setError(`Server error: ${err.response.status}. Using fallback data.`);
      } else if (err.request) {
        // The request was made but no response was received
        setError('No response from server. Using fallback data.');
      } else {
        // Something happened in setting up the request that triggered an Error
        setError(`${err.message}. Using fallback data.`);
      }
      
      // Use fallback data
      console.log('Using fallback gameweek data');
      setUsingFallback(true);
      processGameweekData(FALLBACK_DATA);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Process gameweek data from either API or fallback
  const processGameweekData = (data) => {
    // Find the current gameweek
    const currentGameweek = data.events.find(event => event.is_current);
    
    if (!currentGameweek) {
      // If no current gameweek, find the next one
      const nextGameweek = data.events.find(event => event.is_next);
      if (nextGameweek) {
        console.log(`Found next gameweek: ${nextGameweek.name}, deadline: ${nextGameweek.deadline_time}`);
        setDeadline(new Date(nextGameweek.deadline_time));
        setGameweekInfo(nextGameweek);
      } else {
        // If no next gameweek, use the first upcoming one
        const upcomingGameweeks = data.events
          .filter(event => new Date(event.deadline_time) > new Date())
          .sort((a, b) => new Date(a.deadline_time) - new Date(b.deadline_time));
          
        if (upcomingGameweeks.length > 0) {
          console.log(`Found upcoming gameweek: ${upcomingGameweeks[0].name}`);
          setDeadline(new Date(upcomingGameweeks[0].deadline_time));
          setGameweekInfo(upcomingGameweeks[0]);
        } else {
          // Fall back to a date in the future
          const fallbackDate = getNextFriday();
          console.log(`No upcoming gameweeks found. Using fallback date: ${fallbackDate.toUTCString()}`);
          setDeadline(fallbackDate);
        }
      }
    } else {
      console.log(`Found current gameweek: ${currentGameweek.name}, deadline: ${currentGameweek.deadline_time}`);
      setDeadline(new Date(currentGameweek.deadline_time));
      setGameweekInfo(currentGameweek);
    }
  };

  // Helper function to get next Friday at 18:00 UTC
  const getNextFriday = () => {
    const now = new Date();
    const dayOfWeek = now.getUTCDay(); // 0 = Sunday, 5 = Friday
    const daysUntilFriday = dayOfWeek <= 5 ? 5 - dayOfWeek : 7 - dayOfWeek + 5;
    const nextFriday = new Date(now);
    nextFriday.setUTCDate(nextFriday.getUTCDate() + daysUntilFriday);
    nextFriday.setUTCHours(18, 0, 0, 0); // 18:00 UTC
    return nextFriday;
  };

  // Calculate time remaining until deadline
  const calculateTimeRemaining = useCallback(() => {
    if (!deadline) return;

    const now = new Date();
    const difference = deadline - now;

    if (difference <= 0) {
      // Deadline has passed
      setTimeRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      
      if (!isPassed) {
        setIsPassed(true);
        
        // Schedule team data refresh 1 hour after deadline
        if (onDeadlinePassed) {
          console.log("Scheduling refresh 1 hour after deadline");
          setTimeout(() => {
            onDeadlinePassed();
          }, 60 * 60 * 1000); // 1 hour in milliseconds
        }
      }
      return;
    }

    // Calculate the time units
    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);

    setTimeRemaining({ days, hours, minutes, seconds });
  }, [deadline, isPassed, onDeadlinePassed]);

  // Fetch deadline when component mounts
  useEffect(() => {
    fetchDeadline();
  }, [fetchDeadline]);

  // Update countdown every second
  useEffect(() => {
    const timer = setInterval(() => {
      calculateTimeRemaining();
    }, 1000);

    return () => clearInterval(timer);
  }, [calculateTimeRemaining]);

  // Format the time unit with leading zero if needed
  const formatTimeUnit = (unit) => {
    return unit < 10 ? `0${unit}` : unit;
  };

  return {
    deadline,
    gameweekInfo,
    timeRemaining,
    isLoading,
    error,
    isPassed,
    usingFallback,
    formatTimeUnit,
    refetchDeadline: fetchDeadline
  };
};

export default useDeadlineCountdown; 
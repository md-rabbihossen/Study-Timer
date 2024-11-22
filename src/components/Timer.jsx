import { useState, useEffect, useRef } from 'react';
import alarmSound from '../assets/Digital Timer.mp3';
import CurrentTime from './CurrentTime';
import { syncData } from '../services/supabase';
function Timer({ fontColor, backgroundColor, showSeconds, soundEnabled, onSessionComplete, user, onUpdate }) {
  // State variables
  const [timeLeft, setTimeLeft] = useState(45);
  const [seconds, setSeconds] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [hours, setHours] = useState("0");
  const [minutes, setMinutes] = useState("45");
  const [selectedLabel, setSelectedLabel] = useState("Study");
  const [backgroundImage, setBackgroundImage] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Initialize refs
  const audioRef = useRef(new Audio(alarmSound));
  const initialTimeRef = useRef(0);
  const timerRef = useRef(null);
  const timerContainerRef = useRef(null);
  const isTimerCompletedRef = useRef(false); // Add ref to track if timer completed

  const labels = ["Study", "Programming", "IBA"]; // Available labels

  // Initialize activeLabel ref with the default value
  const activeLabel = useRef(selectedLabel);

  // Add useEffect to update activeLabel when selectedLabel changes
  useEffect(() => {
    activeLabel.current = selectedLabel;
  }, [selectedLabel]);

  // Add this function to update document title
  const updateDocumentTitle = (time) => {
    if (!isPaused && timerRef.current) {
      document.title = `${time} - ${selectedLabel} | Study Timer`;
    } else {
      document.title = 'Study Timer';
    }
  };

  const formatTime = () => {
    let formattedTime;
    if (showSeconds) {
      const displayHours = Math.floor(timeLeft / 60);
      const displayMinutes = timeLeft % 60;
      formattedTime = `${String(displayHours).padStart(2, '0')}:${String(displayMinutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    } else {
      const displayHours = Math.floor(timeLeft / 60);
      const displayMinutes = timeLeft % 60;
      formattedTime = `${String(displayHours).padStart(2, '0')}:${String(displayMinutes).padStart(2, '0')}`;
    }
    updateDocumentTitle(formattedTime);
    return formattedTime;
  };

  const handleTimeInput = (e, type) => {
    const value = e.target.value;
    if (value === "" || (parseInt(value) >= 0 && parseInt(value) <= (type === 'hours' ? 24 : 59))) {
      if (type === 'hours') {
        setHours(value);
      } else {
        setMinutes(value);
      }
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      const totalMinutes = (parseInt(hours) || 0) * 60 + (parseInt(minutes) || 0);
      if (totalMinutes > 0) {
        startTimer();
      }
    }
  };

  // Add new state for start time
  const startTimeRef = useRef(null);

  const startTimer = () => {
    if (!timerRef.current) {
      let totalMinutes;
      
      // If paused, use current timeLeft value, otherwise use input values
      if (isPaused) {
        totalMinutes = timeLeft + (seconds / 60);
        startTimeRef.current = Date.now() - ((initialTimeRef.current * 60 - totalMinutes * 60) * 1000);
      } else {
        totalMinutes = (parseInt(hours) || 0) * 60 + (parseInt(minutes) || 0);
        if (totalMinutes <= 0) return;
        
        activeLabel.current = selectedLabel;
        initialTimeRef.current = totalMinutes;
        setTimeLeft(totalMinutes);
        setSeconds(0);
        startTimeRef.current = Date.now();
        
        setHours(String(Math.floor(totalMinutes / 60)));
        setMinutes(String(totalMinutes % 60));
      }
      
      isTimerCompletedRef.current = false;

      if (showSeconds) {
        timerRef.current = setInterval(() => {
          const currentTime = Date.now();
          const elapsedSeconds = Math.floor((currentTime - startTimeRef.current) / 1000);
          const totalSeconds = initialTimeRef.current * 60;
          const remainingSeconds = totalSeconds - elapsedSeconds;

          if (remainingSeconds <= 0) {
            if (!isTimerCompletedRef.current) {
              handleTimerComplete();
              isTimerCompletedRef.current = true;
            }
            setTimeLeft(0);
            setSeconds(0);
          } else {
            setTimeLeft(Math.floor(remainingSeconds / 60));
            setSeconds(remainingSeconds % 60);
          }
        }, 1000);
      } else {
        timerRef.current = setInterval(() => {
          const currentTime = Date.now();
          const elapsedMinutes = Math.floor((currentTime - startTimeRef.current) / 60000);
          const remainingMinutes = initialTimeRef.current - elapsedMinutes;

          if (remainingMinutes <= 0) {
            if (!isTimerCompletedRef.current) {
              handleTimerComplete();
              isTimerCompletedRef.current = true;
            }
            setTimeLeft(0);
          } else {
            setTimeLeft(remainingMinutes);
          }
        }, 60000);
      }
    }
    setIsPaused(false);
  };

  const pauseTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
      // Store the remaining time when paused
      const currentTime = Date.now();
      const elapsedSeconds = Math.floor((currentTime - startTimeRef.current) / 1000);
      const totalSeconds = initialTimeRef.current * 60;
      const remainingSeconds = totalSeconds - elapsedSeconds;
      
      if (remainingSeconds > 0) {
        setTimeLeft(Math.floor(remainingSeconds / 60));
        if (showSeconds) {
          setSeconds(remainingSeconds % 60);
        }
      }
      setIsPaused(true);
    }
  };

  const resetTimer = async () => {
    const elapsedMinutes = initialTimeRef.current - timeLeft - (seconds / 60);
    
    if (timerRef.current && elapsedMinutes > 0 && !isTimerCompletedRef.current) {
      try {
        await saveSession(elapsedMinutes, activeLabel.current);
        console.log('Reset timer - saving session:', { 
          elapsedMinutes, 
          label: activeLabel.current 
        });
      } catch (error) {
        console.error('Error saving session on reset:', error);
      }
    }

    clearInterval(timerRef.current);
    timerRef.current = null;
    
    setTimeLeft(45);
    setSeconds(0);
    setIsPaused(false);
    setHours("0");
    setMinutes("45");
    stopAlarm();
    document.title = 'Study Timer';
    isTimerCompletedRef.current = false;
  };

  const handleTimerComplete = async () => {
    if (isTimerCompletedRef.current) return;
    
    clearInterval(timerRef.current);
    timerRef.current = null;
    
    const duration = initialTimeRef.current;
    await saveSession(duration, activeLabel.current);
    isTimerCompletedRef.current = true;

    setTimeLeft(0);
    setSeconds(0);
    setIsPaused(false);

    if (soundEnabled) {
      playAlarm();
    }

    document.title = 'Timer Complete!';
  };

  const playAlarm = () => {
    try {
      audioRef.current.currentTime = 0;
      audioRef.current.play()
        .then(() => {
          setTimeout(stopAlarm, 31000);
        })
        .catch(console.error);
    } catch (error) {
      console.error("Error playing alarm:", error);
    }
  };

  const stopAlarm = () => {
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
  };

  const saveSession = async (duration, label) => {
    try {
      if (duration <= 0) return; // Don't save if duration is 0 or negative
      
      const newSession = {
        date: new Date().toISOString(),
        duration: duration,
        label: label
      };

      // Track time
      await onTimeTracked(label, duration);
      
      if (onSessionComplete) {
        onSessionComplete();
      }

      console.log('Session saved:', { duration, label });
    } catch (error) {
      console.error('Error saving session:', error);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      timerContainerRef.current.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const changeBackground = async () => {
    if (isFullscreen) {
      try {
        const { imageUrl } = await syncData.getRandomBackground();
        const hdImageUrl = imageUrl.replace('&w=1080', '&w=1920').replace('&q=80', '&q=100');
        setBackgroundImage(hdImageUrl);
        
        document.body.style.backgroundImage = `url(${hdImageUrl})`;
        document.body.style.backgroundSize = 'cover';
        document.body.style.backgroundPosition = 'center';
        document.body.style.backgroundRepeat = 'no-repeat';
        document.body.style.backgroundAttachment = 'fixed';
      } catch (error) {
        console.error('Error changing background:', error);
      }
    }
  };

  const onTimeTracked = async (label, durationMinutes) => {
    try {
      console.log('Tracking time:', label, durationMinutes);
      
      const timeTrackerData = await syncData.getTimeTracker();
      const durationSeconds = Math.floor(parseFloat(durationMinutes) * 60);

      // Update week data
      const weekData = timeTrackerData?.week_data || {
        Study: 0,
        Programming: 0,
        total: 0,
        lastReset: new Date().toISOString()
      };
      weekData[label] = (weekData[label] || 0) + durationSeconds;
      weekData.total += durationSeconds;

      // Update month data
      const monthData = timeTrackerData?.month_data || {
        Study: 0,
        Programming: 0,
        total: 0,
        lastReset: new Date().toISOString()
      };
      monthData[label] = (monthData[label] || 0) + durationSeconds;
      monthData.total += durationSeconds;

      // Today's data
      let currentTimeData = {
        Study: parseInt(timeTrackerData?.time_data?.Study) || 0,
        Programming: parseInt(timeTrackerData?.time_data?.Programming) || 0,
      };
      let currentTotalTime = parseInt(timeTrackerData?.total_time) || 0;

      // Check if we need to reset for a new day
      const today = new Date().toDateString();
      const lastResetDate = timeTrackerData?.last_reset_date;
      
      if (lastResetDate !== today) {
        // Archive yesterday's data if exists
        if (currentTotalTime > 0) {
          const dailyHistory = timeTrackerData?.daily_history || [];
          dailyHistory.unshift({
            date: lastResetDate,
            timeData: { ...currentTimeData },
            totalTime: currentTotalTime
          });
          
          // Keep only last 7 days
          while (dailyHistory.length > 7) {
            dailyHistory.pop();
          }

          // Reset today's counters
          currentTimeData = {
            Study: 0,
            Programming: 0,
          };
          currentTotalTime = 0;
        }
      }
      
      // Update today's time with the new duration
      currentTimeData[label] = (currentTimeData[label] || 0) + durationSeconds;
      currentTotalTime += durationSeconds;
      
      // Update lifetime data
      let lifeTimeData = {
        Study: parseInt(timeTrackerData?.life_time_data?.Study) || 0,
        Programming: parseInt(timeTrackerData?.life_time_data?.Programming) || 0,
        total: parseInt(timeTrackerData?.life_time_data?.total) || 0
      };
      
      // Add new duration to lifetime totals
      lifeTimeData[label] = (lifeTimeData[label] || 0) + durationSeconds;
      lifeTimeData.total += durationSeconds;
      
      // Save all updates to Supabase
      await syncData.saveTimeTracker(
        currentTimeData,
        currentTotalTime,
        timeTrackerData?.daily_history || [],
        lifeTimeData,
        today,
        weekData,
        monthData
      );

      console.log('Saved time data:', {
        timeData: currentTimeData,
        totalTime: currentTotalTime,
        lifeTimeData: lifeTimeData,
        weekData: weekData,
        monthData: monthData
      });
      
    } catch (error) {
      console.error('Error updating time tracker:', error);
    }
  };

  useEffect(() => {
    audioRef.current.volume = 0.5;
    return () => {
      stopAlarm();
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.target.tagName === 'INPUT') {
        if (e.key === 'Enter') {
          e.preventDefault();
          startTimer();
        }
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        if (timerRef.current) {
          pauseTimer();
        } else if (isPaused) {
          startTimer();
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isPaused]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const isNowFullscreen = !!document.fullscreenElement;
      setIsFullscreen(isNowFullscreen);
      
      if (isNowFullscreen) {
        document.body.style.backgroundImage = `url(${backgroundImage})`;
        document.body.style.backgroundSize = 'cover';
        document.body.style.backgroundPosition = 'center';
        document.body.style.backgroundRepeat = 'no-repeat';
      } else {
        document.body.style.backgroundImage = 'none';
        document.body.style.backgroundColor = backgroundColor;
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.body.style.backgroundImage = 'none';
      document.body.style.backgroundColor = backgroundColor;
    };
  }, [backgroundColor, backgroundImage]);

  useEffect(() => {
    const loadBackgroundImage = async () => {
      if (isFullscreen) {
        try {
          const { imageUrl } = await syncData.getRandomBackground();
          setBackgroundImage(imageUrl);
          
          document.body.style.backgroundImage = `url(${imageUrl})`;
          document.body.style.backgroundSize = 'cover';
          document.body.style.backgroundPosition = 'center';
          document.body.style.backgroundRepeat = 'no-repeat';
        } catch (error) {
          console.error('Error loading background:', error);
        }
      }
    };

    loadBackgroundImage();
  }, [isFullscreen]);

  // Add cleanup effect for document title
  useEffect(() => {
    return () => {
      document.title = 'Study Timer'; // Reset title when component unmounts
    };
  }, []);

  return (
    <div 
      id="clock" 
      style={{ 
        color: fontColor,
        fontSize: 'clamp(50px, 10vw, 150px)',
        backgroundColor: isFullscreen ? 'rgba(0, 0, 0, 0.1)' : 'transparent',
        height: isFullscreen ? '100vh' : 'auto',
        width: isFullscreen ? '100vw' : 'auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        backgroundImage: isFullscreen ? `url(${backgroundImage})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }} 
      ref={timerContainerRef}
    >
      {/* Timer title */}
      <h2 id="timer-title"
        style={{ 
          fontSize: '1.5rem', 
          marginBottom: '1rem',
          fontWeight: 'bold',
          color: fontColor,
          position: isFullscreen ? 'absolute' : 'relative',
          top: isFullscreen ? '20px' : 'auto',
          left: isFullscreen ? '50%' : 'auto',
          transform: isFullscreen ? 'translateX(-50%)' : 'none',
        }}
      >
        Timer
      </h2>

      {/* Only show CurrentTime in fullscreen mode */}
      {isFullscreen && <CurrentTime fontColor={fontColor} />}
      
      <div id="timer" style={{ 
        color: isFullscreen ? 'rgba(255, 255, 255, 0.9)' : fontColor,
        fontWeight: '100',
        letterSpacing: isFullscreen ? '10px' : '2px',
        fontSize: isFullscreen ? 'clamp(80px, 15vw, 200px)' : 'clamp(50px, 10vw, 150px)',
        fontFamily: "'Roboto', sans-serif",
        textShadow: isFullscreen ? '0 0 20px rgba(255, 255, 255, 0.5)' : 'none',
        transition: 'all 0.3s ease',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '5px'
      }}>
        {formatTime()}
      </div>
      <div className="time-input-container">
        <div className="time-input-group">
          <input
            type="number"
            value={hours}
            onChange={(e) => handleTimeInput(e, 'hours')}
            onKeyDown={(e) => handleTimeInput(e, 'hours')}
            min="0"
            max="24"
            placeholder="Hours"
            style={{
              color: fontColor,
              borderColor: fontColor,
              backgroundColor: isFullscreen ? 'transparent' : 'transparent',
              caretColor: fontColor,
              width: '50px',
              fontSize: 'clamp(12px, 2vw, 16px)'
            }}
          />
          <label className="time-input-label" style={{ color: fontColor }}>h</label>
        </div>
        <div className="time-input-group">
          <input
            type="number"
            value={minutes}
            onChange={(e) => handleTimeInput(e, 'minutes')}
            onKeyDown={(e) => handleTimeInput(e, 'minutes')}
            min="0"
            max="59"
            placeholder="Minutes"
            style={{
              color: fontColor,
              borderColor: fontColor,
              backgroundColor: isFullscreen ? 'transparent' : 'transparent',
              caretColor: fontColor,
              width: '50px',
              fontSize: 'clamp(12px, 2vw, 16px)'
            }}
          />
          <label className="time-input-label" style={{ color: fontColor }}>m</label>
        </div>
      </div>
      <div className="buttons">
        {!timerRef.current && !isPaused && (
          // Show Start button only when timer is not running and not paused
          <button 
            id="start-btn" 
            onClick={startTimer}
            style={{ 
              color: fontColor,
              fontSize: 'clamp(12px, 2vw, 16px)',
              backgroundColor: isFullscreen ? 'transparent' : 'transparent',
            }}
          >
            <i className="fas fa-play"></i> Start
          </button>
        )}
        
        {isPaused ? (
          // Show Resume button when paused
          <button 
            id="resume-btn" 
            onClick={startTimer}
            style={{ 
              color: fontColor,
              fontSize: 'clamp(12px, 2vw, 16px)',
              backgroundColor: isFullscreen ? 'transparent' : 'transparent',
            }}
          >
            <i className="fas fa-play"></i> Resume
          </button>
        ) : timerRef.current && (
          // Show Pause button when timer is running
          <button 
            id="pause-btn" 
            onClick={pauseTimer}
            style={{ 
              color: fontColor,
              fontSize: 'clamp(12px, 2vw, 16px)',
              backgroundColor: isFullscreen ? 'transparent' : 'transparent',
            }}
          >
            <i className="fas fa-pause"></i> Pause
          </button>
        )}
        
        <button 
          id="reset-btn" 
          onClick={resetTimer}
          style={{ 
            color: fontColor,
            fontSize: 'clamp(12px, 2vw, 16px)',
            backgroundColor: isFullscreen ? 'transparent' : 'transparent',
          }}
        >
          <i className="fas fa-redo"></i> Reset
        </button>
        
        <button 
          id="fullscreen-btn" 
          onClick={toggleFullscreen}
          style={{ 
            color: fontColor,
            fontSize: 'clamp(12px, 2vw, 16px)',
            backgroundColor: isFullscreen ? 'transparent' : 'transparent',
          }}
        >
          <i className="fas fa-expand"></i>
        </button>
      </div>
      <select
        value={selectedLabel}
        onChange={(e) => setSelectedLabel(e.target.value)}
        style={{ 
          color: fontColor,
          borderColor: fontColor,
          backgroundColor: isFullscreen ? 'transparent' : 'transparent',
        }}
      >
        {labels.map((label) => (
          <option key={label} value={label}>{label}</option>
        ))}
      </select>

      {isFullscreen && (
        <button
          onClick={changeBackground}
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            background: 'rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(5px)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '50%',
            padding: '12px',
            cursor: 'pointer',
            color: 'white',
            fontSize: '14px',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '40px',
            height: '40px',
          }}
        >
          <i 
            className="fas fa-sync" 
            style={{
              animation: 'spin 4s linear infinite',
            }}
          />
        </button>
      )}
    </div>
  );
}

export default Timer;

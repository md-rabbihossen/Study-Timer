import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import alarmSound from '../assets/Digital Timer.mp3';
import CurrentTime from './CurrentTime';
import { syncData } from '../services/supabase';
function Timer({ fontColor, backgroundColor, showSeconds, soundEnabled, onSessionComplete, user, onUpdate }) {
  const [timeLeft, setTimeLeft] = useState(45);
  const [seconds, setSeconds] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [hours, setHours] = useState("0");
  const [minutes, setMinutes] = useState("45");
  const [selectedLabel, setSelectedLabel] = useState("Study"); // Default label
  const [backgroundImage, setBackgroundImage] = useState('');
  const [timerWorkerRef, setTimerWorkerRef] = useState(null);
  const audioRef = useRef(new Audio(alarmSound));
  const initialTimeRef = useRef(0);
  const timerContainerRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false); // State for fullscreen

  const labels = ["Study", "Programming"]; // Available labels

  const formatTime = () => {
    if (showSeconds) {
      const displayHours = Math.floor(timeLeft / 60);
      const displayMinutes = timeLeft % 60;
      return `${String(displayHours).padStart(2, '0')}:${String(displayMinutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    } else {
      const displayHours = Math.floor(timeLeft / 60);
      const displayMinutes = timeLeft % 60;
      return `${String(displayHours).padStart(2, '0')}:${String(displayMinutes).padStart(2, '0')}`;
    }
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
      startTimer();
    }
  };

  const startTimer = () => {
    if (!isPaused) {
      const totalMinutes = (parseInt(hours) || 0) * 60 + (parseInt(minutes) || 0);
      if (totalMinutes <= 0) {
        toast('Please enter a valid time', toastStyle);
        return;
      }
      initialTimeRef.current = totalMinutes;
      toast('Timer Started! ▶️', toastStyle);
      setTimeLeft(totalMinutes);
      setSeconds(0);
    } else {
      toast('Timer Resumed! ▶️', toastStyle);
    }

    timerWorkerRef.postMessage({ command: 'start' });
    setIsPaused(false);
  };

  const pauseTimer = () => {
    timerWorkerRef.postMessage({ command: 'stop' });
    setIsPaused(true);
    toast('Timer Paused! ⏸️', toastStyle);
  };

  const resetTimer = () => {
    if (!isPaused) {
      const elapsedMinutes = initialTimeRef.current - timeLeft - (seconds / 60);
      if (elapsedMinutes > 0) {
        saveSession(elapsedMinutes);
      }
    }

    timerWorkerRef.postMessage({ command: 'stop' });
    setTimeLeft(30);
    setSeconds(0);
    setIsPaused(false);
    setHours("0");
    setMinutes("30");
    stopAlarm();
    toast('Timer Reset! 🔄', toastStyle);
  };

  const handleTimerComplete = () => {
    timerWorkerRef.postMessage({ command: 'stop' });
    
    const duration = initialTimeRef.current;
    saveSession(duration);
    
    if (soundEnabled) {
      playAlarm();
    }
    
    toast('Time\'s Up! ⏰', {
      ...toastStyle,
      duration: 5000,
      icon: '✨',
    });
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

  const saveSession = (duration, label) => {
    const newSession = {
      date: new Date().toISOString(),
      duration: duration,
      label: label
    };
    
    const savedSessions = JSON.parse(localStorage.getItem('timerSessions') || '[]');
    const updatedSessions = [...savedSessions, newSession];
    localStorage.setItem('timerSessions', JSON.stringify(updatedSessions));
    
    if (user && onUpdate) {
      onUpdate('timerSessions', { sessions: updatedSessions });
    }
    
    if (onSessionComplete) {
      onSessionComplete(duration);
    }
  };

  const toastStyle = {
    style: {
      background: backgroundColor,
      color: fontColor,
      border: `1px solid ${fontColor}`,
    },
    duration: 2000,
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
        today // Update last_reset_date to today
      );

      console.log('Saved time data:', {
        timeData: currentTimeData,
        totalTime: currentTotalTime,
        lifeTimeData: lifeTimeData
      });
      
    } catch (error) {
      console.error('Error updating time tracker:', error);
    }
  };

  useEffect(() => {
    audioRef.current.volume = 0.5;
    return () => {
      stopAlarm();
      if (timerWorkerRef) {
        timerWorkerRef.terminate();
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
        if (timerWorkerRef) {
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

  useEffect(() => {
    const worker = new Worker(new URL('../timerWorker.js', import.meta.url));
    setTimerWorkerRef(worker);
    
    worker.onmessage = (e) => {
      if (e.data === 'tick') {
        if (showSeconds) {
          setSeconds(prev => {
            if (prev === 0) {
              setTimeLeft(prevTime => {
                if (prevTime <= 0) {
                  handleTimerComplete();
                  return 0;
                }
                return prevTime - 1;
              });
              return 59;
            }
            return prev - 1;
          });
        } else {
          setTimeLeft(prev => {
            if (prev <= 0) {
              handleTimerComplete();
              return 0;
            }
            return prev - 1;
          });
        }
      }
    };

    return () => worker.terminate();
  }, [showSeconds]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
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
      
      <div id="timer" style={{ color: fontColor }}>
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
        <button 
          id="start-btn" 
          onClick={startTimer}
          style={{ 
            color: fontColor,
            fontSize: 'clamp(12px, 2vw, 16px)',
            backgroundColor: isFullscreen ? 'transparent' : 'transparent',
          }}
        >
          {isPaused ? 
            <><i className="fas fa-play"></i> Resume</> : 
            <><i className="fas fa-play"></i> Start</>
          }
        </button>
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

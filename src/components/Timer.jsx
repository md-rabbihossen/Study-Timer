import PropTypes from "prop-types";
import { useEffect, useRef, useState } from "react";
import alarmSound from "../assets/Digital Timer.mp3";
import { syncData } from "../services/supabase";
function Timer({
  fontColor,
  backgroundColor,
  showSeconds,
  soundEnabled,
  onSessionComplete,
}) {
  // State variables
  const [timeLeft, setTimeLeft] = useState(30);
  const [seconds, setSeconds] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [hours, setHours] = useState("0");
  const [minutes, setMinutes] = useState("30");
  const [selectedLabel, setSelectedLabel] = useState("Study");
  const [backgroundImage, setBackgroundImage] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isBlackBg, setIsBlackBg] = useState(false);
  const [showFsButtons, setShowFsButtons] = useState(true);
  const fsButtonTimeout = useRef(null);

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
      document.title = "Study Timer";
    }
  };

  const formatTime = () => {
    let formattedTime;
    if (showSeconds) {
      const displayHours = Math.floor(timeLeft / 60);
      const displayMinutes = timeLeft % 60;
      formattedTime = `${String(displayHours).padStart(2, "0")}:${String(
        displayMinutes
      ).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    } else {
      const displayHours = Math.floor(timeLeft / 60);
      const displayMinutes = timeLeft % 60;
      formattedTime = `${String(displayHours).padStart(2, "0")}:${String(
        displayMinutes
      ).padStart(2, "0")}`;
    }
    updateDocumentTitle(formattedTime);
    return formattedTime;
  };

  const handleTimeInput = (e, type) => {
    const value = e.target.value;
    if (
      value === "" ||
      (parseInt(value) >= 0 && parseInt(value) <= (type === "hours" ? 24 : 59))
    ) {
      if (type === "hours") {
        setHours(value);
      } else {
        setMinutes(value);
      }
    }

    if (e.key === "Enter") {
      e.preventDefault();
      const totalMinutes =
        (parseInt(hours) || 0) * 60 + (parseInt(minutes) || 0);
      if (totalMinutes > 0) {
        startTimer();
      }
    }
  };

  // Add new state for start time
  const startTimeRef = useRef(null);

  const startTimer = () => {
    if (timerRef.current) return;

    let totalSeconds;
    if (isPaused) {
      totalSeconds =
        (parseInt(hours, 10) || 0) * 3600 +
        (parseInt(minutes, 10) || 0) * 60 +
        (parseInt(seconds, 10) || 0);
    } else {
      totalSeconds =
        (parseInt(hours, 10) || 0) * 3600 + (parseInt(minutes, 10) || 0) * 60;
      setSeconds(0);
    }

    if (totalSeconds <= 0) return;

    initialTimeRef.current = totalSeconds;
    startTimeRef.current = Date.now();
    isTimerCompletedRef.current = false;
    setIsPaused(false);

    const updateTimer = () => {
      const now = Date.now();
      const elapsed = Math.floor((now - startTimeRef.current) / 1000);
      const remaining = initialTimeRef.current - elapsed;

      if (remaining <= 0) {
        if (!isTimerCompletedRef.current) {
          handleTimerComplete();
          isTimerCompletedRef.current = true;
        }
        setHours("0");
        setMinutes("0");
        setSeconds(0);
        clearInterval(timerRef.current);
        timerRef.current = null;
        return;
      }

      const h = Math.floor(remaining / 3600);
      const m = Math.floor((remaining % 3600) / 60);
      const s = remaining % 60;

      setHours(String(h));
      setMinutes(String(m));
      setSeconds(s);
    };

    timerRef.current = setInterval(updateTimer, 1000);
    updateTimer(); // Initial call to avoid 1s delay
  };

  const pauseTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
      setIsPaused(true);
    }
  };

  const resetTimer = async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    const elapsedSeconds =
      initialTimeRef.current -
      ((parseInt(hours, 10) || 0) * 3600 +
        (parseInt(minutes, 10) || 0) * 60 +
        (parseInt(seconds, 10) || 0));

    if (elapsedSeconds > 0 && !isTimerCompletedRef.current) {
      try {
        await saveSession(elapsedSeconds / 60, activeLabel.current);
      } catch (error) {
        console.error("Error saving session on reset:", error);
      }
    }

    setHours("0");
    setMinutes("30");
    setSeconds(0);
    setIsPaused(false);
    stopAlarm();
    document.title = "Study Timer";
    isTimerCompletedRef.current = false;
  };

  const handleTimerComplete = async () => {
    if (soundEnabled) playAlarm();
    document.title = "Timer Complete!";

    const durationInMinutes = initialTimeRef.current / 60;
    await saveSession(durationInMinutes, activeLabel.current);

    // Reset timer to default after completion
    setTimeout(() => {
      setHours("0");
      setMinutes("30");
      setSeconds(0);
      document.title = "Study Timer";
    }, 5000); // 5-second delay before reset
  };

  const playAlarm = () => {
    try {
      audioRef.current.currentTime = 0;
      audioRef.current
        .play()
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
        label: label,
      };

      // Track time
      await onTimeTracked(label, duration);

      if (onSessionComplete) {
        onSessionComplete();
      }

      console.log("Session saved:", { duration, label });
    } catch (error) {
      console.error("Error saving session:", error);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      timerContainerRef.current.requestFullscreen().catch((err) => {
        console.error(
          `Error attempting to enable full-screen mode: ${err.message}`
        );
      });
    } else {
      document.exitFullscreen();
    }
  };

  const changeBackground = async () => {
    if (isFullscreen) {
      try {
        const { imageUrl } = await syncData.getRandomBackground();
        const hdImageUrl = imageUrl
          .replace("&w=1080", "&w=1920")
          .replace("&q=80", "&q=100");
        setBackgroundImage(hdImageUrl);

        document.body.style.backgroundImage = `url(${hdImageUrl})`;
        document.body.style.backgroundSize = "cover";
        document.body.style.backgroundPosition = "center";
        document.body.style.backgroundRepeat = "no-repeat";
        document.body.style.backgroundAttachment = "fixed";
      } catch (error) {
        console.error("Error changing background:", error);
      }
    }
  };

  // Add this useEffect hook to handle screen wake lock
  useEffect(() => {
    let wakeLock = null;

    const manageWakeLock = async () => {
      if (isFullscreen) {
        if ("wakeLock" in navigator) {
          try {
            wakeLock = await navigator.wakeLock.request("screen");
            console.log("Screen Wake Lock is active");
          } catch (err) {
            console.error(`${err.name}, ${err.message}`);
          }
        }
      } else {
        if (wakeLock !== null) {
          await wakeLock.release();
          wakeLock = null;
          console.log("Screen Wake Lock released");
        }
      }
    };

    manageWakeLock();

    return () => {
      if (wakeLock !== null) {
        wakeLock.release();
      }
    };
  }, [isFullscreen]);

  const onTimeTracked = async (label, durationMinutes) => {
    try {
      console.log("Tracking time:", label, durationMinutes);

      const timeTrackerData = await syncData.getTimeTracker();
      const durationSeconds = Math.floor(parseFloat(durationMinutes) * 60);

      // Update week data
      const weekData = timeTrackerData?.week_data || {
        Study: 0,
        Programming: 0,
        total: 0,
        lastReset: new Date().toISOString(),
      };
      weekData[label] = (weekData[label] || 0) + durationSeconds;
      weekData.total += durationSeconds;

      // Update month data
      const monthData = timeTrackerData?.month_data || {
        Study: 0,
        Programming: 0,
        total: 0,
        lastReset: new Date().toISOString(),
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
            totalTime: currentTotalTime,
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
        Programming:
          parseInt(timeTrackerData?.life_time_data?.Programming) || 0,
        total: parseInt(timeTrackerData?.life_time_data?.total) || 0,
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

      console.log("Saved time data:", {
        timeData: currentTimeData,
        totalTime: currentTotalTime,
        lifeTimeData: lifeTimeData,
        weekData: weekData,
        monthData: monthData,
      });
    } catch (error) {
      console.error("Error updating time tracker:", error);
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
      if (e.target.tagName === "INPUT") {
        if (e.key === "Enter") {
          e.preventDefault();
          startTimer();
        }
        return;
      }

      if (e.code === "Space") {
        e.preventDefault();
        if (timerRef.current) {
          pauseTimer();
        } else if (isPaused) {
          startTimer();
        }
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [isPaused]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  useEffect(() => {
    const loadBackgroundImage = async () => {
      if (isFullscreen) {
        try {
          const { imageUrl } = await syncData.getRandomBackground();
          setBackgroundImage(imageUrl);

          document.body.style.backgroundImage = `url(${imageUrl})`;
          document.body.style.backgroundSize = "cover";
          document.body.style.backgroundPosition = "center";
          document.body.style.backgroundRepeat = "no-repeat";
        } catch (error) {
          console.error("Error loading background:", error);
        }
      }
    };

    loadBackgroundImage();
  }, [isFullscreen]);

  // Hide fullscreen buttons after 3s, show on click/tap, for any fullscreen mode
  useEffect(() => {
    if (isFullscreen) {
      const handleShowButtons = () => {
        setShowFsButtons(true);
        if (fsButtonTimeout.current) clearTimeout(fsButtonTimeout.current);
        fsButtonTimeout.current = setTimeout(
          () => setShowFsButtons(false),
          3000
        );
      };
      document.addEventListener("click", handleShowButtons);
      handleShowButtons();
      return () => {
        document.removeEventListener("click", handleShowButtons);
        if (fsButtonTimeout.current) clearTimeout(fsButtonTimeout.current);
      };
    }
  }, [isFullscreen]);

  // Add cleanup effect for document title
  useEffect(() => {
    return () => {
      document.title = "Study Timer"; // Reset title when component unmounts
    };
  }, []);

  // 1. Always show only icons for timer control buttons (remove text everywhere)
  // 2. Format timer as MM:SS if < 60 min, else HH:MM:SS in fullscreen if hours set
  function formatTimeDisplay() {
    const h = parseInt(hours, 10) || 0;
    const m = parseInt(minutes, 10) || 0;
    const s = seconds || 0;

    if (h > 0) {
      return `${String(h).padStart(2, "0")}:${String(m).padStart(
        2,
        "0"
      )}:${String(s).padStart(2, "0")}`;
    }
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  return (
    <div
      id="clock"
      style={{
        color: isFullscreen ? "#fff" : fontColor,
        fontSize:
          isFullscreen && isBlackBg
            ? "clamp(120px, 24vw, 500px)"
            : isFullscreen
            ? "clamp(90px, 16vw, 210px)"
            : "clamp(50px, 10vw, 150px)",
        backgroundColor:
          isFullscreen && isBlackBg
            ? "#000"
            : isFullscreen
            ? "rgba(0, 0, 0, 0.1)"
            : "transparent",
        height: isFullscreen ? "100vh" : "auto",
        width: isFullscreen ? "100vw" : "auto",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: isFullscreen && isBlackBg ? "center" : "center",
        position: "relative",
        backgroundImage:
          isFullscreen && isBlackBg
            ? "none"
            : isFullscreen
            ? `url(${backgroundImage})`
            : "none",
        backgroundSize: "cover",
        backgroundPosition: "center",
        transition: "all 0.3s cubic-bezier(.4,2,.6,1)",
        overflow: isFullscreen ? "hidden" : undefined,
      }}
      ref={timerContainerRef}
    >
      {/* Timer title (hidden in fullscreen) */}
      <h2
        id="timer-title"
        style={{
          fontSize: "1.5rem",
          marginBottom: "1rem",
          fontWeight: "bold",
          color: isFullscreen ? "#fff" : fontColor,
          position: isFullscreen ? "absolute" : "relative",
          top: isFullscreen ? "20px" : "auto",
          left: isFullscreen ? "50%" : "auto",
          transform: isFullscreen ? "translateX(-50%)" : "none",
          display: isFullscreen ? "none" : undefined,
        }}
      >
        Timer
      </h2>
      <div
        id="timer"
        style={{
          color: isFullscreen ? "#fff" : fontColor,
          fontWeight: "100",
          letterSpacing: isFullscreen ? "10px" : "2px",
          fontSize:
            isFullscreen && isBlackBg
              ? "clamp(40px, 18vw, 120vw)" // MASSIVE: min 40px, scales up to 120vw
              : isFullscreen
              ? "clamp(90px, 16vw, 210px)"
              : "clamp(50px, 10vw, 150px)",
          fontFamily: "'Roboto', sans-serif",
          textShadow: isFullscreen ? "0 0 40px #000" : "none",
          transition: "all 0.3s cubic-bezier(.4,2,.6,1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "5px",
          width: isFullscreen && isBlackBg ? "100vw" : undefined,
          height: isFullscreen && isBlackBg ? "100vh" : undefined,
          position: isFullscreen && isBlackBg ? "fixed" : "static",
          top: isFullscreen && isBlackBg ? 0 : undefined,
          left: isFullscreen && isBlackBg ? 0 : undefined,
          zIndex: 2,
          margin: isFullscreen && isBlackBg ? 0 : undefined,
          padding: isFullscreen && isBlackBg ? 0 : undefined,
          ...(isFullscreen && isBlackBg
            ? {
                width: "100vw",
                height: "100vh",
                justifyContent: "center",
                alignItems: "center",
              }
            : {}),
        }}
      >
        {formatTimeDisplay()}
      </div>
      <div className="time-input-container">
        <div className="time-input-group">
          <input
            type="number"
            value={hours}
            onChange={(e) => handleTimeInput(e, "hours")}
            onKeyDown={(e) => handleTimeInput(e, "hours")}
            min="0"
            max="24"
            placeholder="Hours"
            style={{
              color: fontColor,
              borderColor: fontColor,
              backgroundColor: isFullscreen ? "transparent" : "transparent",
              caretColor: fontColor,
              width: "50px",
              fontSize: "clamp(12px, 2vw, 16px)",
            }}
          />
          <label className="time-input-label" style={{ color: fontColor }}>
            h
          </label>
        </div>
        <div className="time-input-group">
          <input
            type="number"
            value={minutes}
            onChange={(e) => handleTimeInput(e, "minutes")}
            onKeyDown={(e) => handleTimeInput(e, "minutes")}
            min="0"
            max="59"
            placeholder="Minutes"
            style={{
              color: fontColor,
              borderColor: fontColor,
              backgroundColor: isFullscreen ? "transparent" : "transparent",
              caretColor: fontColor,
              width: "50px",
              fontSize: "clamp(12px, 2vw, 16px)",
            }}
          />
          <label className="time-input-label" style={{ color: fontColor }}>
            m
          </label>
        </div>
      </div>
      {/* Fullscreen black background toggle button (same size/position in both modes) */}
      {isFullscreen && showFsButtons && (
        <button
          onClick={() => setIsBlackBg((prev) => !prev)}
          style={{
            position: "fixed",
            bottom: "75px",
            right: "20px",
            background: isBlackBg ? "#fff" : "#000",
            color: isBlackBg ? "#000" : "#fff",
            border: "1px solid rgba(255,255,255,0.3)",
            borderRadius: "50%",
            padding: "10px",
            cursor: "pointer",
            fontSize: "18px",
            zIndex: 1001,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "36px",
            height: "36px",
            marginBottom: "8px",
          }}
          title={
            isBlackBg ? "Show beautiful background" : "Show black background"
          }
          aria-label={
            isBlackBg ? "Show beautiful background" : "Show black background"
          }
        >
          <i className={isBlackBg ? "fas fa-image" : "fas fa-moon"}></i>
        </button>
      )}
      {/* Change background button (same size/position, hidden if black mode or buttons hidden) */}
      {isFullscreen && showFsButtons && !isBlackBg && (
        <button
          onClick={changeBackground}
          style={{
            position: "fixed",
            bottom: "20px",
            right: "20px",
            background: "rgba(255, 255, 255, 0.2)",
            backdropFilter: "blur(5px)",
            border: "1px solid rgba(255, 255, 255, 0.3)",
            borderRadius: "50%",
            padding: "10px",
            cursor: "pointer",
            color: "white",
            fontSize: "18px",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "36px",
            height: "36px",
          }}
        >
          <i
            className="fas fa-sync"
            style={{
              animation: "spin 4s linear infinite",
            }}
          />
        </button>
      )}
      {/* Timer control buttons (pause, start, reset, etc.) - highly visible but very small in fullscreen, hidden if showFsButtons is false */}
      <div
        className="buttons"
        style={{
          position: isFullscreen ? "fixed" : undefined,
          bottom: isFullscreen ? "10%" : undefined,
          left: isFullscreen ? "50%" : undefined,
          transform: isFullscreen ? "translateX(-50%)" : undefined,
          zIndex: 1002,
          display: isFullscreen && !showFsButtons ? "none" : "flex",
          flexDirection: "row",
          gap: isFullscreen ? "1.2rem" : "1rem",
        }}
      >
        {!timerRef.current && !isPaused && (
          <button
            id="start-btn"
            onClick={startTimer}
            style={{
              color: isFullscreen ? "#fff" : fontColor,
              fontSize: isFullscreen ? "1.1rem" : "clamp(12px, 2vw, 16px)",
              backgroundColor: isFullscreen ? "rgba(0,0,0,0.7)" : "transparent",
              border: isFullscreen ? "none" : "2px solid #fff",
              borderRadius: isFullscreen ? "8px" : "4px",
              boxShadow: isFullscreen ? "0 2px 16px rgba(0,0,0,0.25)" : "none",
              padding: isFullscreen ? "8px 18px" : undefined,
              opacity: isFullscreen ? 0.97 : 1,
              fontWeight: 700,
              letterSpacing: "2px",
              transition: "all 0.2s",
              outline: isFullscreen ? "none" : undefined,
            }}
          >
            <i className="fas fa-play"></i>
          </button>
        )}
        {isPaused ? (
          <button
            id="resume-btn"
            onClick={startTimer}
            style={{
              color: isFullscreen ? "#fff" : fontColor,
              fontSize: isFullscreen ? "1.1rem" : "clamp(12px, 2vw, 16px)",
              backgroundColor: isFullscreen ? "rgba(0,0,0,0.7)" : "transparent",
              border: isFullscreen ? "none" : "2px solid #fff",
              borderRadius: isFullscreen ? "8px" : "4px",
              boxShadow: isFullscreen ? "0 2px 16px rgba(0,0,0,0.25)" : "none",
              padding: isFullscreen ? "8px 18px" : undefined,
              opacity: isFullscreen ? 0.97 : 1,
              fontWeight: 700,
              letterSpacing: "2px",
              transition: "all 0.2s",
              outline: isFullscreen ? "none" : undefined,
            }}
          >
            <i className="fas fa-play"></i>
          </button>
        ) : (
          timerRef.current && (
            <button
              id="pause-btn"
              onClick={pauseTimer}
              style={{
                color: isFullscreen ? "#fff" : fontColor,
                fontSize: isFullscreen ? "1.1rem" : "clamp(12px, 2vw, 16px)",
                backgroundColor: isFullscreen
                  ? "rgba(0,0,0,0.7)"
                  : "transparent",
                border: isFullscreen ? "none" : "2px solid #fff",
                borderRadius: isFullscreen ? "8px" : "4px",
                boxShadow: isFullscreen
                  ? "0 2px 16px rgba(0,0,0,0.25)"
                  : "none",
                padding: isFullscreen ? "8px 18px" : undefined,
                opacity: isFullscreen ? 0.97 : 1,
                fontWeight: 700,
                letterSpacing: "2px",
                transition: "all 0.2s",
                outline: isFullscreen ? "none" : undefined,
              }}
            >
              <i className="fas fa-pause"></i>
            </button>
          )
        )}
        <button
          id="reset-btn"
          onClick={resetTimer}
          style={{
            color: isFullscreen ? "#fff" : fontColor,
            fontSize: isFullscreen ? "1.1rem" : "clamp(12px, 2vw, 16px)",
            backgroundColor: isFullscreen ? "rgba(0,0,0,0.7)" : "transparent",
            border: isFullscreen ? "none" : "2px solid #fff",
            borderRadius: isFullscreen ? "8px" : "4px",
            boxShadow: isFullscreen ? "0 2px 16px rgba(0,0,0,0.25)" : "none",
            padding: isFullscreen ? "8px 18px" : undefined,
            opacity: isFullscreen ? 0.97 : 1,
            fontWeight: 700,
            letterSpacing: "2px",
            transition: "all 0.2s",
            outline: isFullscreen ? "none" : undefined,
          }}
        >
          <i className="fas fa-redo"></i>
        </button>
        <button
          id="fullscreen-btn"
          onClick={toggleFullscreen}
          style={{
            color: isFullscreen ? "#fff" : fontColor,
            fontSize: isFullscreen ? "1.1rem" : "clamp(12px, 2vw, 16px)",
            backgroundColor: isFullscreen ? "rgba(0,0,0,0.7)" : "transparent",
            border: isFullscreen ? "none" : "2px solid #fff",
            borderRadius: isFullscreen ? "8px" : "4px",
            boxShadow: isFullscreen ? "0 2px 16px rgba(0,0,0,0.25)" : "none",
            padding: isFullscreen ? "8px 18px" : undefined,
            opacity: isFullscreen ? 0.97 : 1,
            fontWeight: 700,
            letterSpacing: "2px",
            transition: "all 0.2s",
            outline: isFullscreen ? "none" : undefined,
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
          backgroundColor: isFullscreen ? "transparent" : "transparent",
        }}
      >
        {labels.map((label) => (
          <option key={label} value={label}>
            {label}
          </option>
        ))}
      </select>
    </div>
  );
}

export default Timer;

Timer.propTypes = {
  fontColor: PropTypes.string.isRequired,
  backgroundColor: PropTypes.string.isRequired,
  showSeconds: PropTypes.bool.isRequired,
  soundEnabled: PropTypes.bool.isRequired,
  onSessionComplete: PropTypes.func,
};

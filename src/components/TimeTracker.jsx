import { useState, useEffect } from 'react';
import { syncData } from '../services/supabase';

function TimeTracker({ fontColor, updateTrigger }) {
  const [timeData, setTimeData] = useState({
    Study: 0,
    Programming: 0,
  });
  const [totalTime, setTotalTime] = useState(0);
  const [dailyHistory, setDailyHistory] = useState([]);
  const [lifeTimeData, setLifeTimeData] = useState({
    Study: 0,
    Programming: 0,
    total: 0
  });
  const [selectedView, setSelectedView] = useState("Lifetime");

  useEffect(() => {
    const loadTimeTrackerData = async () => {
      try {
        const data = await syncData.getTimeTracker();
        
        if (data) {
          // Check if we need to reset today's data
          const today = new Date().toDateString();
          if (data.last_reset_date !== today) {
            // If it's a new day, add yesterday's data to history
            const yesterday = new Date(data.last_reset_date);
            const newHistoryEntry = {
              date: yesterday.toISOString(),
              timeData: {
                Study: parseInt(data.time_data?.Study) || 0,
                Programming: parseInt(data.time_data?.Programming) || 0,
              },
              totalTime: parseInt(data.total_time) || 0
            };

            // Update daily history with the new entry
            const updatedHistory = [newHistoryEntry, ...(data.daily_history || [])];
            
            // Reset today's data
            const resetData = {
              time_data: {
                Study: 0,
                Programming: 0,
              },
              total_time: 0,
              daily_history: updatedHistory,
              life_time_data: data.life_time_data,
              last_reset_date: today
            };

            // Save the updated data
            await syncData.saveTimeTracker(
              resetData.time_data,
              resetData.total_time,
              resetData.daily_history,
              resetData.life_time_data,
              resetData.last_reset_date
            );

            // Update local state
            setTimeData(resetData.time_data);
            setTotalTime(resetData.total_time);
            setDailyHistory(updatedHistory);
          } else {
            // Show today's accumulated time
            setTimeData({
              Study: parseInt(data.time_data?.Study) || 0,
              Programming: parseInt(data.time_data?.Programming) || 0,
            });
            setTotalTime(parseInt(data.total_time) || 0);
            setDailyHistory(data.daily_history || []);
          }
          
          // Set lifetime data
          setLifeTimeData({
            Study: parseInt(data.life_time_data?.Study) || 0,
            Programming: parseInt(data.life_time_data?.Programming) || 0,
            total: parseInt(data.life_time_data?.total) || 0
          });
        }
      } catch (error) {
        console.error('Error loading time tracker data:', error);
      }
    };

    loadTimeTrackerData();

    // Add midnight check
    const checkMidnight = () => {
      const now = new Date();
      if (now.getHours() === 0 && now.getMinutes() === 0) {
        loadTimeTrackerData(); // Reload data at midnight
      }
    };

    // Check every minute for midnight
    const midnightInterval = setInterval(checkMidnight, 60000);

    const subscription = syncData.subscribeToTimeTracker((data) => {
      if (data) {
        // Same validation for real-time updates
        const validTimeData = {
          Study: parseInt(data.time_data?.Study) || 0,
          Programming: parseInt(data.time_data?.Programming) || 0,
        };
        
        setTimeData(validTimeData);
        setTotalTime(parseInt(data.total_time) || 0);
        
        // Update lifetime data
        const validLifeTimeData = {
          Study: parseInt(data.life_time_data?.Study) || 0,
          Programming: parseInt(data.life_time_data?.Programming) || 0,
          total: parseInt(data.life_time_data?.total) || 0
        };
        setLifeTimeData(validLifeTimeData);
        
        // Update daily history
        const validHistory = (data.daily_history || []).map(day => ({
          date: day.date,
          timeData: {
            Study: parseInt(day.timeData?.Study) || 0,
            Programming: parseInt(day.timeData?.Programming) || 0,
          },
          totalTime: parseInt(day.totalTime) || 0
        }));
        
        setDailyHistory(validHistory);
      }
    });

    return () => {
      subscription.unsubscribe();
      clearInterval(midnightInterval);
    };
  }, [updateTrigger]);

  const formatTime = (seconds) => {
    const validSeconds = parseInt(seconds) || 0;
    const hours = Math.floor(validSeconds / 3600);
    const minutes = Math.floor((validSeconds % 3600) / 60);
    const remainingSeconds = Math.floor(validSeconds % 60);
    return `${hours}h ${minutes}m ${remainingSeconds}s`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Previous Day';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="time-tracker" style={{ 
      color: fontColor,
      padding: '20px',
      margin: '20px'
    }}>
      <h3>Time Tracker</h3>
      
      <div className="current-day">
        <h4>Today</h4>
        <p>Total Time: {formatTime(totalTime)}</p>
        {Object.entries(timeData).map(([label, time]) => (
          <div key={label}>
            <span>{label}: {formatTime(time)}</span>
          </div>
        ))}
      </div>

      <select
        value={selectedView}
        onChange={(e) => setSelectedView(e.target.value)}
        style={{ 
          color: fontColor,
          borderColor: fontColor,
          backgroundColor: 'transparent',
          padding: '8px',
          marginTop: '20px',
          width: '100%',
          borderRadius: '6px'
        }}
      >
        <option value="Lifetime">Lifetime Stats</option>
        <option value="History">Previous Days</option>
      </select>

      {selectedView === "Lifetime" ? (
        <div className="lifetime-stats" style={{ marginTop: '20px' }}>
          <h4>Lifetime</h4>
          <p>Total Time: {formatTime(lifeTimeData.total)}</p>
          {Object.entries(lifeTimeData).map(([label, time]) => (
            label !== 'total' && (
              <div key={label}>
                <span>{label}: {formatTime(time)}</span>
              </div>
            )
          ))}
        </div>
      ) : (
        <div className="daily-history" style={{ marginTop: '20px' }}>
          <h4>Previous Days</h4>
          {dailyHistory.map((day, index) => (
            <div key={index} style={{ marginTop: '10px', fontSize: '0.9em' }}>
              <p style={{ marginBottom: '5px' }}>{formatDate(day.date)}</p>
              <p style={{ marginLeft: '10px' }}>Total: {formatTime(day.totalTime)}</p>
              {Object.entries(day.timeData).map(([label, time]) => (
                <p key={label} style={{ marginLeft: '10px' }}>
                  {label}: {formatTime(time)}
                </p>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default TimeTracker; 
import { useState, useEffect } from 'react';
import { syncData } from '../services/supabase';

function TimeTracker({ fontColor, updateTrigger }) {
  const [timeData, setTimeData] = useState({
    Study: 0,
    Programming: 0,
    IBA: 0,
  });
  const [totalTime, setTotalTime] = useState(0);
  const [dailyHistory, setDailyHistory] = useState([]);
  const [lifeTimeData, setLifeTimeData] = useState({
    Study: 0,
    Programming: 0,
    IBA: 0,
    total: 0
  });
  const [weekData, setWeekData] = useState({
    Study: 0,
    Programming: 0,
    IBA: 0,
    total: 0,
    lastReset: null
  });
  const [monthData, setMonthData] = useState({
    Study: 0,
    Programming: 0,
    IBA: 0,
    total: 0,
    lastReset: null
  });
  const [selectedView, setSelectedView] = useState("ThisWeek");

  useEffect(() => {
    const loadTimeTrackerData = async () => {
      try {
        const data = await syncData.getTimeTracker();
        
        if (data) {
          // Use default labels including IBA
          const defaultLabels = ["Study", "Programming", "IBA"];
          
          // Initialize timeData with default labels
          const initialTimeData = {};
          defaultLabels.forEach(label => {
            initialTimeData[label] = parseInt(data.time_data?.[label]) || 0;
          });
          setTimeData(initialTimeData);

          // Initialize lifeTimeData with default labels
          const initialLifeTimeData = {
            ...data.life_time_data,
            total: parseInt(data.life_time_data?.total) || 0
          };
          defaultLabels.forEach(label => {
            initialLifeTimeData[label] = parseInt(data.life_time_data?.[label]) || 0;
          });
          setLifeTimeData(initialLifeTimeData);

          // Initialize week data with all available labels
          const initialWeekData = {
            ...data.week_data,
            total: parseInt(data.week_data?.total) || 0,
            lastReset: data.week_data?.lastReset
          };
          defaultLabels.forEach(label => {
            initialWeekData[label] = parseInt(data.week_data?.[label]) || 0;
          });
          setWeekData(initialWeekData);

          // Initialize month data with all available labels
          const initialMonthData = {
            ...data.month_data,
            total: parseInt(data.month_data?.total) || 0,
            lastReset: data.month_data?.lastReset
          };
          defaultLabels.forEach(label => {
            initialMonthData[label] = parseInt(data.month_data?.[label]) || 0;
          });
          setMonthData(initialMonthData);

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
                IBA: parseInt(data.time_data?.IBA) || 0,
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
                IBA: 0,
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
              resetData.last_reset_date,
              data.week_data,
              data.month_data
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
              IBA: parseInt(data.time_data?.IBA) || 0,
            });
            setTotalTime(parseInt(data.total_time) || 0);
            setDailyHistory(data.daily_history || []);
          }
          
          // Set lifetime data
          setLifeTimeData({
            Study: parseInt(data.life_time_data?.Study) || 0,
            Programming: parseInt(data.life_time_data?.Programming) || 0,
            IBA: parseInt(data.life_time_data?.IBA) || 0,
            total: parseInt(data.life_time_data?.total) || 0
          });

          // Set week and month data
          setWeekData(data.week_data || {
            Study: 0,
            Programming: 0,
            IBA: 0,
            total: 0,
            lastReset: null
          });
          setMonthData(data.month_data || {
            Study: 0,
            Programming: 0,
            IBA: 0,
            total: 0,
            lastReset: null
          });

          // Check for week reset (Thursday midnight)
          const now = new Date();
          const lastWeekReset = data.week_data?.lastReset ? new Date(data.week_data.lastReset) : null;
          if (!lastWeekReset || now.getDay() === 5 && lastWeekReset.getDay() !== 5) {
            const newWeekData = {
              Study: 0,
              Programming: 0,
              IBA: 0,
              total: 0,
              lastReset: now.toISOString()
            };
            setWeekData(newWeekData);
            await syncData.saveTimeTracker(
              data.time_data,
              data.total_time,
              data.daily_history,
              data.life_time_data,
              data.last_reset_date,
              newWeekData,
              data.month_data
            );
          }

          // Check for month reset
          const currentMonth = now.getMonth();
          const lastMonthReset = data.month_data?.lastReset ? new Date(data.month_data.lastReset) : null;
          if (!lastMonthReset || currentMonth !== lastMonthReset.getMonth()) {
            const newMonthData = {
              Study: 0,
              Programming: 0,
              IBA: 0,
              total: 0,
              lastReset: now.toISOString()
            };
            setMonthData(newMonthData);
            await syncData.saveTimeTracker(
              data.time_data,
              data.total_time,
              data.daily_history,
              data.life_time_data,
              data.last_reset_date,
              data.week_data,
              newMonthData
            );
          }
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
          IBA: parseInt(data.time_data?.IBA) || 0,
        };
        
        setTimeData(validTimeData);
        setTotalTime(parseInt(data.total_time) || 0);
        
        // Update lifetime data
        const validLifeTimeData = {
          Study: parseInt(data.life_time_data?.Study) || 0,
          Programming: parseInt(data.life_time_data?.Programming) || 0,
          IBA: parseInt(data.life_time_data?.IBA) || 0,
          total: parseInt(data.life_time_data?.total) || 0
        };
        setLifeTimeData(validLifeTimeData);
        
        // Update daily history
        const validHistory = (data.daily_history || []).map(day => ({
          date: day.date,
          timeData: {
            Study: parseInt(day.timeData?.Study) || 0,
            Programming: parseInt(day.timeData?.Programming) || 0,
            IBA: parseInt(day.timeData?.IBA) || 0,
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
        <option value="ThisWeek">This Week</option>
        <option value="ThisMonth">This Month</option>
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
      ) : selectedView === "ThisWeek" ? (
        <div className="week-stats" style={{ marginTop: '20px' }}>
          <h4>This Week</h4>
          <p>Total Time: {formatTime(weekData.total)}</p>
          {Object.entries(weekData).map(([label, time]) => (
            label !== 'total' && label !== 'lastReset' && (
              <div key={label}>
                <span>{label}: {formatTime(time)}</span>
              </div>
            )
          ))}
        </div>
      ) : selectedView === "ThisMonth" ? (
        <div className="month-stats" style={{ marginTop: '20px' }}>
          <h4>This Month</h4>
          <p>Total Time: {formatTime(monthData.total)}</p>
          {Object.entries(monthData).map(([label, time]) => (
            label !== 'total' && label !== 'lastReset' && (
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
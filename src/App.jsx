import { useState, useEffect } from 'react';
import Timer from './components/Timer';
import TodoList from './components/TodoList';
import TimeTracker from './components/TimeTracker';
import SettingsModal from './components/SettingsModal';
import CurrentTime from './components/CurrentTime';
import LoginPage from './components/LoginPage';
import Navbar from './components/Navbar';

function App() {
  const [userId, setUserId] = useState(() => localStorage.getItem('userId'));
  const [showSettings, setShowSettings] = useState(false);
  const [backgroundColor, setBackgroundColor] = useState(() => 
    localStorage.getItem('backgroundColor') || '#FFFFFF'
  );
  const [fontColor, setFontColor] = useState(() => 
    localStorage.getItem('fontColor') || '#37352F'
  );
  const [showSeconds, setShowSeconds] = useState(() => 
    localStorage.getItem('showSeconds') !== 'false'
  );
  const [soundEnabled, setSoundEnabled] = useState(() => 
    localStorage.getItem('soundEnabled') !== 'false'
  );
  const [updateTrigger, setUpdateTrigger] = useState(0);

  const handleLogin = (newUserId) => {
    setUserId(newUserId);
    setUpdateTrigger(prev => prev + 1);
  };

  const handleLogout = () => {
    localStorage.removeItem('userId');
    setUserId(null);
  };

  const handleDataUpdate = (dataType, data) => {
    localStorage.setItem(dataType, JSON.stringify(data));
    setUpdateTrigger(prev => prev + 1);
  };

  const handleSettingsSave = (newBgColor, newFontColor, newShowSeconds, newSoundEnabled) => {
    setBackgroundColor(newBgColor);
    setFontColor(newFontColor);
    setShowSeconds(newShowSeconds);
    setSoundEnabled(newSoundEnabled);
    localStorage.setItem('backgroundColor', newBgColor);
    localStorage.setItem('fontColor', newFontColor);
    localStorage.setItem('showSeconds', newShowSeconds);
    localStorage.setItem('soundEnabled', newSoundEnabled);
  };

  useEffect(() => {
    document.body.style.backgroundColor = backgroundColor;
  }, [backgroundColor]);

  if (!userId) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="app">
      <Navbar 
        userId={userId}
        onLogout={handleLogout}
        fontColor={fontColor}
        backgroundColor={backgroundColor}
        onSettingsClick={() => setShowSettings(true)}
        showSettings={showSettings}
      />
      <div style={{ paddingTop: '3rem' }}>
        <div className="timer-container">
          <Timer 
            fontColor={fontColor}
            backgroundColor={backgroundColor}
            showSeconds={showSeconds}
            soundEnabled={soundEnabled}
            onSettingsClick={() => setShowSettings(true)}
            onSessionComplete={() => setUpdateTrigger(prev => prev + 1)}
            onUpdate={handleDataUpdate}
          />
        </div>
        <TodoList 
          fontColor={fontColor}
          backgroundColor={backgroundColor}
          onUpdate={handleDataUpdate}
        />
        <TimeTracker 
          fontColor={fontColor}
          updateTrigger={updateTrigger}
          onUpdate={handleDataUpdate}
        />
      </div>
      {showSettings && (
        <SettingsModal
          onClose={() => setShowSettings(false)}
          backgroundColor={backgroundColor}
          fontColor={fontColor}
          showSeconds={showSeconds}
          soundEnabled={soundEnabled}
          onSave={handleSettingsSave}
        />
      )}
    </div>
  );
}

export default App;

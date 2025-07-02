function SettingsModal({ onClose, backgroundColor, fontColor, onSave, showSeconds = true, soundEnabled }) {
  const handleSave = () => {
    const newBgColor = document.getElementById("background-color").value;
    const newFontColor = document.getElementById("font-color").value;
    const newShowSeconds = document.getElementById("show-seconds").checked;
    const newSoundEnabled = document.getElementById("sound-enabled").checked;
    onSave(newBgColor, newFontColor, newShowSeconds, newSoundEnabled);
    onClose();
  };

  return (
    <div id="settings-modal" style={{ display: 'flex' }}>
      <div className="modal-content">
        <span className="close-btn" onClick={onClose}>
          <i className="fas fa-times"></i>
        </span>
        <div className="setting-option">
          <h3>Settings</h3>
          <label htmlFor="background-color">Background Color:</label>
          <select id="background-color" defaultValue={backgroundColor || "#FFFFFF"}>
            <option value="#FFFFFF">LM Default White</option>
            <option value="#F7F6F3">LM Off White</option>
            <option value="#F1F1EF">LM Notion Grey</option>
            <option value="#F4EEEE">LM Notion Brown</option>
            <option value="#FAEBDD">LM Notion Orange</option>
            <option value="#FBF3DB">LM Notion Yellow</option>
            <option value="#EDF3EC">LM Notion Green</option>
            <option value="#E7F3F8">LM Notion Blue</option>
            <option value="#F6F3F9">LM Notion Purple</option>
            <option value="#FAF1F5">LM Notion Pink</option>
            <option value="#FDEBEC">LM Notion Red</option>
            <option value="#191919">DM Default</option>
            <option value="#262626">DM Hover</option>
            <option value="#202020">DM Sidebar</option>
            <option value="#434040">DM Notion Brown</option>
            <option value="#594A3A">DM Notion Orange</option>
            <option value="#59563B">DM Notion Yellow</option>
            <option value="#354C4B">DM Notion Green</option>
            <option value="#364954">DM Notion Blue</option>
            <option value="#443F57">DM Notion Purple</option>
            <option value="#533B4C">DM Notion Pink</option>
            <option value="#594141">DM Notion Red</option>
          </select>
          
          <label htmlFor="font-color">Font Color:</label>
          <select id="font-color" defaultValue={fontColor}>
            <option value="#37352F">LM Notion Default</option>
            <option value="#787774">LM Notion Grey</option>
            <option value="#9F6B53">LM Notion Brown</option>
            <option value="#D9730D">LM Notion Orange</option>
            <option value="#CB912F">LM Notion Yellow</option>
            <option value="#448361">LM Notion Green</option>
            <option value="#337EA9">LM Notion Blue</option>
            <option value="#9065B0">LM Notion Purple</option>
            <option value="#C14C8A">LM Notion Pink</option>
            <option value="#D44C47">LM Notion Red</option>
            <option value="#979A9B">DM Notion Grey</option>
            <option value="#D4D4D4">DM White</option>
            <option value="#937264">DM Notion Brown</option>
            <option value="#FFA344">DM Notion Orange</option>
            <option value="#FFDC49">DM Notion Yellow</option>
            <option value="#4DAB9A">DM Notion Green</option>
            <option value="#529CCA">DM Notion Blue</option>
            <option value="#9A6DD7">DM Notion Purple</option>
            <option value="#E255A1">DM Notion Pink</option>
            <option value="#FF7369">DM Notion Red</option>
          </select>
          
          <div className="toggle-option">
            <label htmlFor="show-seconds">Show Seconds:</label>
            <input
              type="checkbox"
              id="show-seconds"
              defaultChecked={showSeconds}
            />
          </div>

          <div className="toggle-option">
            <label htmlFor="sound-enabled">Enable Sound:</label>
            <input
              type="checkbox"
              id="sound-enabled"
              defaultChecked={soundEnabled}
            />
          </div>
          
          <button id="save-btn" onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  );
}

export default SettingsModal;

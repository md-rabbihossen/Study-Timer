import { useState } from 'react';
import { generateUserId } from '../services/supabase';

function LoginPage({ onLogin }) {
  const [userId, setUserId] = useState('');
  const [name, setName] = useState('');

  const handleGenerateNew = () => {
    if (!name.trim()) {
      alert('Please enter your name first');
      return;
    }
    const newId = generateUserId();
    localStorage.setItem('userId', newId);
    localStorage.setItem('userName', name);
    onLogin(newId);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Please enter your name');
      return;
    }
    if (userId.trim()) {
      localStorage.setItem('userId', userId);
      localStorage.setItem('userName', name);
      onLogin(userId);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <h1>Study Timer</h1>
        <div className="login-options">
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="user-id-input"
              style={{ marginBottom: '10px' }}
            />
            <button onClick={handleGenerateNew} className="generate-btn">
              Generate New ID
            </button>
            <div className="or-divider">OR</div>
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="Enter existing User ID"
              className="user-id-input"
            />
            <button type="submit" className="login-btn">
              Continue
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default LoginPage; 
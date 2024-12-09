import React, { useState } from 'react';

function LoginPage({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = () => {
    if (!username.trim()) {
      setError('Username is required');
      return;
    }
    if (!password.trim()) {
      setError('Password is required');
      return;
    }
    const encode_password = btoa(password);
    setError('');

    const ws = new WebSocket(
      `ws://127.0.0.1:3030/ws?name=${username}&password=${encode_password}`
    );

    ws.onopen = async () => {
      const response = await fetch(`/friends?from_username=${username}`);
      console.log('response received');
      if (response.status !== 200) {
        setError('Failed to fetch friends');
        return;
      }
      const friends = await response.json();
      console.log(friends.to_usernames);
      // If connection is successful, call the success callback
      onLoginSuccess(
        username,
        friends.user_picture,
        ws,
        friends.to_usernames,
        friends.to_user_pictures
      );
    };

    ws.onerror = () => {
      setError('Unable to connect. Check your credentials or server');
    };

    ws.onclose = (event) => {
      if (event.code === 401) {
        setError('Unauthorized. Please check your username and password.');
      }
    };
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h1>Welcome to chat</h1>
      <input
        type="text"
        placeholder="Enter your username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        style={{ padding: '10px', fontSize: '16px', marginBottom: '10px' }}
      />
      <br />
      <input
        type="text"
        placeholder="Enter your password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{ padding: '10px', fontSize: '16px', marginBottom: '10px' }}
      />
      <br />
      <button
        onClick={handleLogin}
        style={{ padding: '10px 20px', fontSize: '16px' }}
      >
        Login
      </button>
      {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
    </div>
  );
}

export default LoginPage;

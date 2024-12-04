import React, { useState } from "react";

function LoginPage({ onLoginSuccess }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = () => {
    if (!username.trim()) {
      setError("Username is required");
      return;
    }
    if (!password.trim()) {
      setError("Password is required");
      return;
    }
    setError("");

    const ws = new WebSocket(`ws://127.0.0.1:3030/ws?auth=${username}`);

    ws.onopen = async () => {
      const authPayload = {
        username: username,
        password: password,
      };
      console.log("Send request {}", JSON.stringify(authPayload));

      let isAuthenticated = true;
      //ws.send(JSON.stringify(authPayload)); // Send auth payload
      const response1 = await new Promise((resolve) => {
        ws.send(JSON.stringify(authPayload)); // Send auth payload

        // Handle the WebSocket response
        ws.onmessage = (event) => {
          if (event.data === "Unauthorized: Invalid credentials") {
            isAuthenticated = false;
            setError("Unauthorized. Please check username and password.");
            resolve(false); // Resolve with false if unauthorized
          } else{
            resolve(true);
          }
        };
        // Add a timeout to avoid indefinite waiting if no message is received
          setTimeout(() => {
            if (isAuthenticated) {
              resolve(true); // Resolve with true if no issue after timeout
            } else {
              resolve(false); // Resolve with false if no valid response
            }
          }, 3000); // Timeout after 3 seconds
        
      });

      
      if (isAuthenticated==true ) {   
        const response = await fetch(`/friends?from_username=${username}`);
        console.log("response received");
        if (response.status !== 200) {
          setError("Failed to fetch friends");
          return;
        }
        const friends = await response.json();
        console.log(friends.to_usernames);
        // If connection is successful, call the success callback
        onLoginSuccess(username, ws, friends.to_usernames);

      }  
    };

    ws.onerror = () => {
      setError("Unable to connect. Check your credentials or server");
    };

    ws.onclose = (event) => {
      if (event.code === 401) {
        setError("Unauthorized. Please check your username and password.");
      }
    };
  };

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>Welcome to chat</h1>
      <input
        type="text"
        placeholder="Enter your username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        style={{ padding: "10px", fontSize: "16px", marginBottom: "10px" }}
      />
      <br />
      <input
        type="text"
        placeholder="Enter your password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{ padding: "10px", fontSize: "16px", marginBottom: "10px" }}
      />
      <br />
      <button
        onClick={handleLogin}
        style={{ padding: "10px 20px", fontSize: "16px" }}
      >
        Login
      </button>
      {error && <p style={{ color: "red", marginTop: "10px" }}>{error}</p>}
    </div>
  );
}

export default LoginPage;

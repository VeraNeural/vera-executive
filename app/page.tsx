"use client";
import React, { useState } from "react";

export default function Home() {
  const [message, setMessage] = useState("");
  const [responses, setResponses] = useState([]);

  const handleSubmit = async () => {
    if (!message.trim()) return;
    
    const res = await fetch("/api/vera", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });
    
    const data = await res.json();
    setResponses([...responses, { user: message, vera: data.response }]);
    setMessage("");
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", color: "white", padding: "40px" }}>
      <h1 style={{ fontSize: "24px", letterSpacing: "8px", marginBottom: "40px" }}>VERA</h1>
      
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        {responses.map((r, i) => (
          <div key={i} style={{ marginBottom: "20px" }}>
            <div style={{ background: "rgba(138, 43, 226, 0.1)", padding: "15px", borderRadius: "10px", marginBottom: "10px" }}>
              You: {r.user}
            </div>
            <div style={{ background: "rgba(255, 255, 255, 0.05)", padding: "15px", borderRadius: "10px" }}>
              VERA: {r.vera}
            </div>
          </div>
        ))}
        
        <div style={{ display: "flex", gap: "10px", marginTop: "40px" }}>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder="Message VERA..."
            style={{
              flex: 1,
              padding: "15px",
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "10px",
              color: "white",
              fontSize: "16px",
            }}
          />
          <button
            onClick={handleSubmit}
            style={{
              padding: "15px 30px",
              background: "rgba(138, 43, 226, 0.3)",
              border: "1px solid rgba(138, 43, 226, 0.5)",
              borderRadius: "10px",
              color: "white",
              cursor: "pointer",
            }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

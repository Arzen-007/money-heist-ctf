import React from 'react';
import './App.css';

const App = () => {
  return (
    <div style={{backgroundColor: '#000000', color: '#ffffff', minHeight: '100vh', padding: '20px'}}>
      <h1 style={{color: '#dc2626', fontSize: '3rem', textAlign: 'center'}}>
        Money Heist CTF
      </h1>
      <p style={{textAlign: 'center', fontSize: '1.5rem', marginTop: '2rem'}}>
        Welcome to the Royal Mint Heist!
      </p>
      <div style={{textAlign: 'center', marginTop: '2rem'}}>
        <button style={{
          backgroundColor: '#dc2626',
          color: 'white',
          padding: '12px 24px',
          border: 'none',
          borderRadius: '8px',
          fontSize: '1.2rem',
          cursor: 'pointer'
        }}>
          Join the Heist
        </button>
      </div>
    </div>
  );
};

export default App;


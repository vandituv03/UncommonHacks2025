import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Landing from './pages/landing';
// import AppHome from './pages/AppHome'; // future use

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      {/* <Route path="/app" element={<AppHome />} /> */}
    </Routes>
  );
}

export default App;

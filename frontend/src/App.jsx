import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Landing from './pages/landing';
import Home from './pages/home';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/home" element={<Home />} />
    </Routes>
  );
}

export default App;

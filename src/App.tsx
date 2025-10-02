import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import InventoryPage from './pages/InventoryPage';
import LocationFilterPage from './pages/LocationFilterPage';
import RemainingItemsPage from './pages/RemainingItemsPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/inventory/:filterType" element={<InventoryPage />} />
        <Route path="/location-filter" element={<LocationFilterPage />} />
        <Route path="/remaining-items" element={<RemainingItemsPage />} />
      </Routes>
    </Router>
  );
}

export default App;
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { LayoutGrid, Search } from 'lucide-react';
import { Dashboard } from './pages/Dashboard';
import { TrackPackage } from './pages/TrackPackage';
import { SupplierDetail } from './pages/SupplierDetail';
import { WarehouseDetail } from './pages/WarehouseDetail';
import { DeliveryAgentDetail } from './pages/DeliveryAgentDetail';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <header className="app__header">
          <h1>LogiTrack — Systèmes Distribués</h1>
          <p>Visualisation des nœuds distribués de la chaîne logistique</p>
          <nav className="app__nav">
            <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>
              <LayoutGrid size={16} />
              Tableau de bord
            </NavLink>
            <NavLink to="/suivi" className={({ isActive }) => (isActive ? 'active' : '')}>
              <Search size={16} />
              Suivi colis
            </NavLink>
          </nav>
        </header>

        <main>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/suivi" element={<TrackPackage />} />
            <Route path="/suppliers/:id" element={<SupplierDetail />} />
            <Route path="/warehouses/:id" element={<WarehouseDetail />} />
            <Route path="/agents/:id" element={<DeliveryAgentDetail />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;

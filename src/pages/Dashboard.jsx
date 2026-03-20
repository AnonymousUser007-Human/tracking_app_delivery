import { useState } from 'react';
import {
  Factory,
  Warehouse,
  Truck,
  LayoutGrid,
  Box,
  Activity,
} from 'lucide-react';
import { NodeCard } from '../components/NodeCard';
import { NodeScene3D } from '../components/NodeScene3D';
import { ActionsPanel } from '../components/ActionsPanel';
import { useDashboardRealtimeData } from '../hooks/useDashboardRealtimeData';

const VIEWS = { overview: 'overview', scene: 'scene' };

export function Dashboard() {
  const { suppliers, warehouses, agents, packages, trackingPoints, loading, error } =
    useDashboardRealtimeData();
  const [activeView, setActiveView] = useState(VIEWS.overview);

  const totalNodes = suppliers.length + warehouses.length + agents.length;

  if (loading) {
    return (
      <div className="loading">
        <Activity size={24} className="animate-pulse" style={{ margin: '0 auto 0.5rem' }} />
        Chargement des nœuds...
      </div>
    );
  }
  if (error) {
    return <div className="error">Erreur : {error}</div>;
  }

  return (
    <div className="dashboard">
      <header className="dashboard__header">
        <h1>LogiTrack — Système Distribué</h1>
        <p className="dashboard__subtitle">
          Visualisation des nœuds (fournisseurs, entrepôts, livreurs) et de leurs actions
        </p>
      </header>

      <div className="stats-bar">
        <div className="stat-card stat-card--suppliers">
          <span className="stat-card__value">{suppliers.length}</span>
          <span className="stat-card__label">Fournisseurs</span>
        </div>
        <div className="stat-card stat-card--warehouses">
          <span className="stat-card__value">{warehouses.length}</span>
          <span className="stat-card__label">Entrepôts</span>
        </div>
        <div className="stat-card stat-card--agents">
          <span className="stat-card__value">{agents.length}</span>
          <span className="stat-card__label">Livreurs</span>
        </div>
        <div className="stat-card stat-card--packages">
          <span className="stat-card__value">{packages.length}</span>
          <span className="stat-card__label">Colis</span>
        </div>
        <div className="stat-card">
          <span className="stat-card__value">{totalNodes}</span>
          <span className="stat-card__label">Nœuds connectés</span>
        </div>
      </div>

      <div className="view-tabs">
        <button
          type="button"
          className={activeView === VIEWS.overview ? 'active' : ''}
          onClick={() => setActiveView(VIEWS.overview)}
        >
          <LayoutGrid size={16} />
          Vue d&apos;ensemble
        </button>
        <button
          type="button"
          className={activeView === VIEWS.scene ? 'active' : ''}
          onClick={() => setActiveView(VIEWS.scene)}
        >
          <Box size={16} />
          Chaîne logistique 3D
        </button>
      </div>

      {activeView === VIEWS.scene && (
        <NodeScene3D
          suppliers={suppliers}
          warehouses={warehouses}
          agents={agents}
          packages={packages}
        />
      )}

      <ActionsPanel trackingPoints={trackingPoints} />

      <section className="dashboard__section">
        <h2>
          <Factory size={18} />
          Fournisseurs
        </h2>
        <p className="section-desc">Nœuds fournisseurs dans la chaîne d&apos;approvisionnement</p>
        <div className="node-grid">
          {suppliers.length === 0 ? (
            <p className="empty">Aucun fournisseur</p>
          ) : (
            suppliers.map((s) => (
              <NodeCard
                key={s.id}
                node={s}
                type="supplier"
                to={`/suppliers/${s.id}`}
              />
            ))
          )}
        </div>
      </section>

      <section className="dashboard__section">
        <h2>
          <Warehouse size={18} />
          Entrepôts
        </h2>
        <p className="section-desc">Nœuds de stockage et de distribution</p>
        <div className="node-grid">
          {warehouses.length === 0 ? (
            <p className="empty">Aucun entrepôt</p>
          ) : (
            warehouses.map((w) => (
              <NodeCard
                key={w.id}
                node={w}
                type="warehouse"
                to={`/warehouses/${w.id}`}
              />
            ))
          )}
        </div>
      </section>

      <section className="dashboard__section">
        <h2>
          <Truck size={18} />
          Livreurs
        </h2>
        <p className="section-desc">Nœuds mobiles (terminaux de livraison)</p>
        <div className="node-grid">
          {agents.length === 0 ? (
            <p className="empty">Aucun livreur</p>
          ) : (
            agents.map((a) => (
              <NodeCard
                key={a.id}
                node={a}
                type="delivery_agent"
                to={`/agents/${a.id}`}
              />
            ))
          )}
        </div>
      </section>
    </div>
  );
}

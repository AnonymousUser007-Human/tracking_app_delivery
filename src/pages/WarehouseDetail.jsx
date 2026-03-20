import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Warehouse } from 'lucide-react';
import { fetchWarehouseById, fetchPackagesCountForNode } from '../api/nodesApi';

export function WarehouseDetail() {
  const { id } = useParams();
  const [warehouse, setWarehouse] = useState(null);
  const [packagesCount, setPackagesCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const [w, count] = await Promise.all([
          fetchWarehouseById(id),
          fetchPackagesCountForNode('warehouse', id),
        ]);
        setWarehouse(w);
        setPackagesCount(count);
      } catch (err) {
        setError(err.message || 'Erreur de chargement');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) return <div className="loading">Chargement...</div>;
  if (error) return <div className="error">Erreur : {error}</div>;
  if (!warehouse) return null;

  const occupancy = warehouse.total_capacity > 0
    ? ((warehouse.used_capacity / warehouse.total_capacity) * 100).toFixed(1)
    : 0;

  return (
    <div className="detail-page">
      <Link to="/" className="back-link">
        <ArrowLeft size={16} />
        Retour au tableau de bord
      </Link>
      <div className="detail-card detail-card--warehouse">
        <span className="detail-card__icon">
          <Warehouse size={28} />
        </span>
        <h1>{warehouse.name}</h1>
        <span className="detail-card__type">Entrepôt</span>
        <div className="detail-card__stats">
          <div className="stat">
            <span className="stat__value">{packagesCount}</span>
            <span className="stat__label">Colis</span>
          </div>
          <div className="stat">
            <span className="stat__value">{occupancy}%</span>
            <span className="stat__label">Occupation</span>
          </div>
          <div className="stat">
            <span className="stat__value">{warehouse.total_capacity ?? '-'}</span>
            <span className="stat__label">Capacité (m³)</span>
          </div>
        </div>
        <dl className="detail-list">
          <dt>Adresse</dt>
          <dd>{warehouse.address}, {warehouse.city}</dd>
          <dt>Région</dt>
          <dd>{warehouse.region || '-'}</dd>
          <dt>Téléphone</dt>
          <dd>{warehouse.phone}</dd>
          <dt>Responsable</dt>
          <dd>{warehouse.manager_name}</dd>
          {warehouse.zones?.length > 0 && (
            <>
              <dt>Zones</dt>
              <dd>{warehouse.zones.join(', ')}</dd>
            </>
          )}
        </dl>
      </div>
    </div>
  );
}

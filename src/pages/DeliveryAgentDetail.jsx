import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Truck } from 'lucide-react';
import { fetchDeliveryAgentById, fetchPackagesCountForNode } from '../api/nodesApi';

export function DeliveryAgentDetail() {
  const { id } = useParams();
  const [agent, setAgent] = useState(null);
  const [packagesCount, setPackagesCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const [a, count] = await Promise.all([
          fetchDeliveryAgentById(id),
          fetchPackagesCountForNode('delivery_agent', id),
        ]);
        setAgent(a);
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
  if (!agent) return null;

  const fullName = `${agent.first_name || ''} ${agent.last_name || ''}`.trim() || agent.email;

  return (
    <div className="detail-page">
      <Link to="/" className="back-link">
        <ArrowLeft size={16} />
        Retour au tableau de bord
      </Link>
      <div className="detail-card detail-card--agent">
        <span className="detail-card__icon">
          <Truck size={28} />
        </span>
        <h1>{fullName}</h1>
        <span className="detail-card__type">Livreur</span>
        <div className="detail-card__stats">
          <div className="stat">
            <span className="stat__value">{packagesCount}</span>
            <span className="stat__label">Colis</span>
          </div>
          <div className="stat">
            <span className="stat__value">{agent.total_deliveries ?? 0}</span>
            <span className="stat__label">Total livraisons</span>
          </div>
          <div className="stat">
            <span className="stat__value">{agent.rating ?? '-'}</span>
            <span className="stat__label">Note</span>
          </div>
        </div>
        <dl className="detail-list">
          <dt>Statut</dt>
          <dd>
            <span className={`badge badge--${agent.status}`}>{agent.status}</span>
          </dd>
          <dt>Téléphone</dt>
          <dd>{agent.phone}</dd>
          <dt>Email</dt>
          <dd>{agent.email}</dd>
          <dt>Véhicule</dt>
          <dd>{agent.vehicle_type || 'Moto'} {agent.vehicle_plate ? ` (${agent.vehicle_plate})` : ''}</dd>
          {agent.current_zone && (
            <>
              <dt>Zone actuelle</dt>
              <dd>{agent.current_zone}</dd>
            </>
          )}
        </dl>
      </div>
    </div>
  );
}

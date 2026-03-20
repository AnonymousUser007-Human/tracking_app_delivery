import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, Package, MapPin, Clock, ArrowLeft, Truck } from 'lucide-react';
import {
  fetchPackageByTrackingNumber,
  fetchTrackingPointsForPackage,
} from '../api/nodesApi';

const STATUS_LABELS = {
  created: 'Créé',
  atSupplier: 'Chez fournisseur',
  inTransitToWarehouse: 'En transit vers entrepôt',
  atWarehouse: "À l'entrepôt",
  inTransitToClient: 'En livraison',
  delivered: 'Livré',
  returned: 'Retourné',
};

function formatStatus(s) {
  return STATUS_LABELS[s] || s;
}

export function TrackPackage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [query, setQuery] = useState(() => searchParams.get('q') || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pkg, setPkg] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const q = searchParams.get('q')?.trim();
    if (!q) {
      setPkg(null);
      setHistory([]);
      setError(null);
      return;
    }
    setQuery(q);
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        setPkg(null);
        setHistory([]);
        const found = await fetchPackageByTrackingNumber(q);
        if (cancelled) return;
        if (!found) {
          setError('Aucun colis trouvé pour ce numéro.');
          return;
        }
        const points = await fetchTrackingPointsForPackage(found.id);
        if (cancelled) return;
        setPkg(found);
        setHistory(points);
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setError(err.message || 'Erreur lors de la recherche.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  function handleSubmit(e) {
    e.preventDefault();
    const q = query.trim();
    if (!q) {
      setError('Saisissez un numéro de suivi.');
      return;
    }
    setError(null);
    setSearchParams({ q });
  }

  return (
    <div className="track-page">
      <Link to="/" className="back-link">
        <ArrowLeft size={16} />
        Retour au tableau de bord
      </Link>

      <header className="track-page__header">
        <div className="track-page__icon">
          <Truck size={28} />
        </div>
        <h1>Suivi de colis</h1>
        <p className="track-page__intro">
          Entrez votre numéro de suivi pour voir l&apos;historique de votre colis.
        </p>
      </header>

      <form className="track-form" onSubmit={handleSubmit}>
        <label htmlFor="tracking-input" className="track-form__label">
          Numéro de suivi
        </label>
        <div className="track-form__row">
          <input
            id="tracking-input"
            type="search"
            className="track-form__input"
            placeholder="Ex. LT-6654A15B"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
          />
          <button type="submit" className="track-form__submit" disabled={loading}>
            <Search size={18} />
            {loading ? 'Recherche…' : 'Rechercher'}
          </button>
        </div>
      </form>

      {error && <div className="track-page__error">{error}</div>}

      {pkg && (
        <div className="track-result">
          <div className="track-result__card">
            <h2>
              <Package size={20} />
              {pkg.tracking_number}
            </h2>
            <p className="track-result__status">
              <span className="track-result__status-badge">{formatStatus(pkg.status)}</span>
            </p>
            <dl className="track-result__meta">
              <div>
                <dt>Destinataire</dt>
                <dd>{pkg.recipient_name}</dd>
              </div>
              <div>
                <dt>Adresse de livraison</dt>
                <dd>{pkg.destination_address}</dd>
              </div>
              {pkg.description && (
                <div>
                  <dt>Description</dt>
                  <dd>{pkg.description}</dd>
                </div>
              )}
            </dl>
          </div>

          <section className="track-timeline">
            <h3>Historique du parcours</h3>
            {history.length === 0 ? (
              <p className="track-timeline__empty">
                Aucun point de suivi enregistré pour le moment.
              </p>
            ) : (
              <ul className="track-timeline__list">
                {history.map((tp, i) => (
                  <li key={tp.id || i} className="track-timeline__item">
                    <span className="track-timeline__dot" />
                    <div className="track-timeline__body">
                      <div className="track-timeline__title">{formatStatus(tp.status)}</div>
                      <div className="track-timeline__node">
                        <MapPin size={14} />
                        {tp.location}
                        {tp.node_type && (
                          <span className="track-timeline__type"> · {tp.node_type}</span>
                        )}
                      </div>
                      {tp.notes && (
                        <div className="track-timeline__notes">{tp.notes}</div>
                      )}
                      <div className="track-timeline__time">
                        <Clock size={14} />
                        {tp.timestamp
                          ? new Date(tp.timestamp).toLocaleString('fr-FR', {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            })
                          : ''}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Factory } from 'lucide-react';
import { fetchSupplierById, fetchPackagesCountForNode } from '../api/nodesApi';

export function SupplierDetail() {
  const { id } = useParams();
  const [supplier, setSupplier] = useState(null);
  const [packagesCount, setPackagesCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const [s, count] = await Promise.all([
          fetchSupplierById(id),
          fetchPackagesCountForNode('supplier', id),
        ]);
        setSupplier(s);
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
  if (!supplier) return null;

  return (
    <div className="detail-page">
      <Link to="/" className="back-link">
        <ArrowLeft size={16} />
        Retour au tableau de bord
      </Link>
      <div className="detail-card detail-card--supplier">
        <span className="detail-card__icon">
          <Factory size={28} />
        </span>
        <h1>{supplier.name}</h1>
        <span className="detail-card__type">Fournisseur</span>
        <div className="detail-card__stats">
          <div className="stat">
            <span className="stat__value">{packagesCount}</span>
            <span className="stat__label">Colis</span>
          </div>
          <div className="stat">
            <span className="stat__value">{supplier.rating ?? '-'}</span>
            <span className="stat__label">Note</span>
          </div>
          <div className="stat">
            <span className="stat__value">{supplier.average_processing_days ?? '-'} j</span>
            <span className="stat__label">Traitement</span>
          </div>
        </div>
        <dl className="detail-list">
          <dt>Adresse</dt>
          <dd>{supplier.address}, {supplier.city}</dd>
          <dt>Téléphone</dt>
          <dd>{supplier.phone}</dd>
          <dt>Email</dt>
          <dd>{supplier.email}</dd>
          {supplier.categories?.length > 0 && (
            <>
              <dt>Catégories</dt>
              <dd>{supplier.categories.join(', ')}</dd>
            </>
          )}
        </dl>
      </div>
    </div>
  );
}

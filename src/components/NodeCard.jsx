import { Link } from 'react-router-dom';
import { Factory, Warehouse, Truck, ChevronRight } from 'lucide-react';

const CONFIG = {
  supplier: {
    label: 'Fournisseur',
    Icon: Factory,
    colorClass: 'node-card__icon--supplier',
  },
  warehouse: {
    label: 'Entrepôt',
    Icon: Warehouse,
    colorClass: 'node-card__icon--warehouse',
  },
  delivery_agent: {
    label: 'Livreur',
    Icon: Truck,
    colorClass: 'node-card__icon--agent',
  },
};

export function NodeCard({ node, type, to }) {
  const { label, Icon, colorClass } = CONFIG[type] || {};

  const name = type === 'delivery_agent'
    ? `${node.first_name || ''} ${node.last_name || ''}`.trim() || node.email
    : node.name;

  const statusClass = node.status ? `node-card__badge--${String(node.status).replace(/\s+/g, '_').toLowerCase()}` : '';

  return (
    <Link to={to} className="node-card">
      <span className={`node-card__icon ${colorClass}`}>
        <Icon size={22} strokeWidth={2} />
      </span>
      <div className="node-card__body">
        <span className="node-card__type">{label}</span>
        <h3 className="node-card__name">{name}</h3>
        {node.city && <p className="node-card__meta">{node.city}</p>}
        {node.status && type === 'delivery_agent' && (
          <span className={`node-card__badge ${statusClass}`}>
            {node.status}
          </span>
        )}
      </div>
      <span className="node-card__arrow">
        <ChevronRight size={20} />
      </span>
    </Link>
  );
}

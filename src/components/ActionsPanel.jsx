import { Package, Factory, Truck, Warehouse } from 'lucide-react';

const ACTION_ICONS = {
  created: Package,
  atSupplier: Factory,
  inTransitToWarehouse: Truck,
  atWarehouse: Warehouse,
  inTransitToClient: Truck,
  delivered: Package,
  returned: Package,
};

function getIconForStatus(status) {
  return ACTION_ICONS[status] || Package;
}

function formatAction(tp) {
  const statusLabels = {
    created: 'Créé',
    atSupplier: 'Chez fournisseur',
    inTransitToWarehouse: 'En transit vers entrepôt',
    atWarehouse: 'À l\'entrepôt',
    inTransitToClient: 'En livraison',
    delivered: 'Livré',
    returned: 'Retourné',
  };
  const label = statusLabels[tp.status] || tp.status;
  const date = tp.timestamp ? new Date(tp.timestamp).toLocaleString('fr-FR') : '';
  return { label, date };
}

export function ActionsPanel({ trackingPoints = [] }) {
  if (trackingPoints.length === 0) {
    return (
      <div className="actions-panel">
        <h3>
          <Package size={18} />
          Actions récentes
        </h3>
        <p className="empty">Aucune action enregistrée</p>
      </div>
    );
  }

  return (
    <div className="actions-panel">
      <h3>
        <Package size={18} />
        Actions récentes ({trackingPoints.length})
      </h3>
      <div className="actions-list">
        {trackingPoints.map((tp, i) => {
          const Icon = getIconForStatus(tp.status);
          const { label, date } = formatAction(tp);
          return (
            <div key={tp.id || i} className="action-item">
              <span className="action-item__icon">
                <Icon size={16} />
              </span>
              <div className="action-item__body">
                <div className="action-item__text">
                  {tp.node_type || 'Node'} — {label}
                </div>
                <div className="action-item__meta">
                  {tp.location && `${tp.location} • `}
                  {date}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

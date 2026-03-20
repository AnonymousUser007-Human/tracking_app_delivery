import { useState, useEffect } from 'react';
import {
  fetchSuppliers,
  fetchWarehouses,
  fetchDeliveryAgents,
  fetchPackagesWithTrackingHistory,
  fetchRecentTrackingPoints,
} from '../api/nodesApi';
import { subscribePostgresChanges } from '../lib/realtime';
import {
  mergeRowsById,
  sortByName,
  sortAgentsByFirstName,
  mergePackagesWithHistory,
  applyTrackingPointToPackages,
  mergeRecentTrackingPoints,
} from '../lib/realtimeMerge';

const TRACKING_FEED_LIMIT = 15;

/**
 * Initial fetch + Supabase Realtime for public tables used on the dashboard.
 * Any CRUD done with the Supabase client (or SQL editor / another app) updates UI live
 * once replication is enabled for those tables.
 */
export function useDashboardRealtimeData() {
  const [suppliers, setSuppliers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [agents, setAgents] = useState([]);
  const [packages, setPackages] = useState([]);
  const [trackingPoints, setTrackingPoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const [s, w, a, p, tp] = await Promise.all([
          fetchSuppliers(),
          fetchWarehouses(),
          fetchDeliveryAgents(),
          fetchPackagesWithTrackingHistory(),
          fetchRecentTrackingPoints(TRACKING_FEED_LIMIT),
        ]);
        if (cancelled) return;
        setSuppliers(s);
        setWarehouses(w);
        setAgents(a);
        setPackages(p);
        setTrackingPoints(tp);
      } catch (err) {
        console.error(err);
        if (!cancelled) setError(err.message || 'Erreur de chargement');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    const unsubscribe = subscribePostgresChanges(
      'dashboard-nodes',
      [
        { table: 'suppliers' },
        { table: 'warehouses' },
        { table: 'delivery_agents' },
        { table: 'packages' },
        { table: 'tracking_points' },
      ],
      (table, payload) => {
        if (cancelled) return;
        switch (table) {
          case 'suppliers':
            setSuppliers((prev) => mergeRowsById(prev, payload, sortByName));
            break;
          case 'warehouses':
            setWarehouses((prev) => mergeRowsById(prev, payload, sortByName));
            break;
          case 'delivery_agents':
            setAgents((prev) => mergeRowsById(prev, payload, sortAgentsByFirstName));
            break;
          case 'packages':
            setPackages((prev) => mergePackagesWithHistory(prev, payload));
            break;
          case 'tracking_points':
            setPackages((prev) => applyTrackingPointToPackages(prev, payload));
            setTrackingPoints((prev) =>
              mergeRecentTrackingPoints(prev, payload, TRACKING_FEED_LIMIT),
            );
            break;
          default:
            break;
        }
      },
    );

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  return {
    suppliers,
    warehouses,
    agents,
    packages,
    trackingPoints,
    loading,
    error,
  };
}

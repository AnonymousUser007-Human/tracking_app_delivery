import { supabase } from '../lib/supabase';

/** @typedef {'supplier' | 'warehouse' | 'delivery_agent'} NodeType */

/**
 * Fetch all suppliers (fournisseurs) - nodes in the supply chain
 */
export async function fetchSuppliers() {
  const { data, error } = await supabase
    .from('suppliers')
    .select('*')
    .order('name');
  if (error) throw error;
  return data || [];
}

/**
 * Fetch a single supplier by ID
 */
export async function fetchSupplierById(id) {
  const { data, error } = await supabase
    .from('suppliers')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

/**
 * Fetch all warehouses (entrepôts) - storage nodes
 */
export async function fetchWarehouses() {
  const { data, error } = await supabase
    .from('warehouses')
    .select('*')
    .order('name');
  if (error) throw error;
  return data || [];
}

/**
 * Fetch a single warehouse by ID
 */
export async function fetchWarehouseById(id) {
  const { data, error } = await supabase
    .from('warehouses')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

/**
 * Fetch all delivery agents (livreurs) - mobile terminals
 */
export async function fetchDeliveryAgents() {
  const { data, error } = await supabase
    .from('delivery_agents')
    .select('*')
    .order('first_name');
  if (error) throw error;
  return data || [];
}

/**
 * Fetch a single delivery agent by ID
 */
export async function fetchDeliveryAgentById(id) {
  const { data, error } = await supabase
    .from('delivery_agents')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

/**
 * Fetch packages count for a node (supplier, warehouse, or delivery_agent)
 */
export async function fetchPackagesCountForNode(nodeType, nodeId) {
  const column = nodeType === 'supplier' ? 'supplier_id' : nodeType === 'warehouse' ? 'warehouse_id' : 'delivery_agent_id';
  const { count, error } = await supabase
    .from('packages')
    .select('*', { count: 'exact', head: true })
    .eq(column, nodeId);
  if (error) throw error;
  return count ?? 0;
}

/**
 * Fetch all packages (for stats and actions)
 */
export async function fetchPackages() {
  const { data, error } = await supabase
    .from('packages')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

/**
 * Fetch recent tracking points (node actions)
 */
export async function fetchRecentTrackingPoints(limit = 20) {
  const { data, error } = await supabase
    .from('tracking_points')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

/**
 * Fetch a package by tracking number (client suivi)
 */
export async function fetchPackageByTrackingNumber(trackingNumber) {
  const q = (trackingNumber || '').trim();
  if (!q) return null;
  const { data, error } = await supabase
    .from('packages')
    .select('*')
    .ilike('tracking_number', q)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/**
 * Fetch tracking points for a package (ordered by timestamp)
 */
export async function fetchTrackingPointsForPackage(packageId) {
  const { data, error } = await supabase
    .from('tracking_points')
    .select('*')
    .eq('package_id', packageId)
    .order('timestamp', { ascending: true });
  if (error) throw error;
  return data || [];
}

/**
 * Fetch all packages with their tracking history (for 3D visualization)
 */
export async function fetchPackagesWithTrackingHistory() {
  const { data: packages, error: pkgError } = await supabase
    .from('packages')
    .select('*')
    .order('created_at', { ascending: false });
  if (pkgError) throw pkgError;

  const withHistory = await Promise.all(
    (packages || []).map(async (pkg) => {
      const points = await fetchTrackingPointsForPackage(pkg.id);
      return { ...pkg, tracking_history: points };
    })
  );
  return withHistory;
}

// --- CRUD (same client as reads; changes replicate live if Realtime is enabled on the table) ---

/** @param {Record<string, unknown>} row must match your `suppliers` columns + RLS */
export async function insertSupplier(row) {
  const { data, error } = await supabase.from('suppliers').insert(row).select().single();
  if (error) throw error;
  return data;
}

export async function updateSupplier(id, patch) {
  const { data, error } = await supabase
    .from('suppliers')
    .update(patch)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteSupplier(id) {
  const { error } = await supabase.from('suppliers').delete().eq('id', id);
  if (error) throw error;
}

/** Example: new tracking row — all subscribed dashboards update via `postgres_changes`. */
export async function insertTrackingPoint(row) {
  const { data, error } = await supabase.from('tracking_points').insert(row).select().single();
  if (error) throw error;
  return data;
}

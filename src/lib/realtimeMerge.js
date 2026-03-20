/** @param {import('@supabase/supabase-js').RealtimePostgresChangesPayload<Record<string, unknown>>} payload */

export function mergeRowsById(prev, payload, sortFn) {
  const { eventType, new: rowNew, old: rowOld } = payload;
  let next = prev;
  switch (eventType) {
    case 'INSERT':
      if (!rowNew?.id) return prev;
      next = [...prev.filter((r) => r.id !== rowNew.id), rowNew];
      break;
    case 'UPDATE':
      if (!rowNew?.id) return prev;
      next = prev.map((r) => (r.id === rowNew.id ? { ...r, ...rowNew } : r));
      break;
    case 'DELETE':
      if (!rowOld?.id) return prev;
      next = prev.filter((r) => r.id !== rowOld.id);
      break;
    default:
      return prev;
  }
  return sortFn ? sortFn(next) : next;
}

export const sortByName = (rows) =>
  [...rows].sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'fr'));

export const sortAgentsByFirstName = (rows) =>
  [...rows].sort((a, b) =>
    String(a.first_name || '').localeCompare(String(b.first_name || ''), 'fr'),
  );

export const sortPackagesByCreated = (rows) =>
  [...rows].sort((a, b) => {
    const ta = new Date(a.created_at || 0).getTime();
    const tb = new Date(b.created_at || 0).getTime();
    return tb - ta;
  });

/**
 * Packages as loaded by fetchPackagesWithTrackingHistory: { ...row, tracking_history: [] }
 */
export function mergePackagesWithHistory(prev, payload) {
  const { eventType, new: rowNew, old: rowOld } = payload;
  switch (eventType) {
    case 'INSERT': {
      if (!rowNew?.id) return prev;
      const exists = prev.some((p) => p.id === rowNew.id);
      if (exists) return prev;
      const row = { ...rowNew, tracking_history: [] };
      return sortPackagesByCreated([row, ...prev]);
    }
    case 'UPDATE': {
      if (!rowNew?.id) return prev;
      return prev.map((p) =>
        p.id === rowNew.id ? { ...rowNew, tracking_history: p.tracking_history || [] } : p,
      );
    }
    case 'DELETE': {
      if (!rowOld?.id) return prev;
      return prev.filter((p) => p.id !== rowOld.id);
    }
    default:
      return prev;
  }
}

export function applyTrackingPointToPackages(packages, payload) {
  const { eventType, new: rowNew, old: rowOld } = payload;
  const row = rowNew || rowOld;
  const packageId = row?.package_id;
  if (!packageId) return packages;

  return packages.map((pkg) => {
    if (pkg.id !== packageId) return pkg;
    const hist = [...(pkg.tracking_history || [])];
    if (eventType === 'INSERT' && rowNew) {
      const without = hist.filter((t) => t.id !== rowNew.id);
      const merged = [...without, rowNew];
      merged.sort(
        (a, b) => new Date(a.timestamp || 0) - new Date(b.timestamp || 0),
      );
      return { ...pkg, tracking_history: merged };
    }
    if (eventType === 'UPDATE' && rowNew) {
      const idx = hist.findIndex((t) => t.id === rowNew.id);
      const nextHist =
        idx >= 0
          ? hist.map((t) => (t.id === rowNew.id ? { ...t, ...rowNew } : t))
          : [...hist, rowNew];
      nextHist.sort(
        (a, b) => new Date(a.timestamp || 0) - new Date(b.timestamp || 0),
      );
      return { ...pkg, tracking_history: nextHist };
    }
    if (eventType === 'DELETE' && rowOld?.id) {
      return {
        ...pkg,
        tracking_history: hist.filter((t) => t.id !== rowOld.id),
      };
    }
    return pkg;
  });
}

export function mergeRecentTrackingPoints(prev, payload, limit = 15) {
  const { eventType, new: rowNew, old: rowOld } = payload;
  let next = prev;
  if (eventType === 'INSERT' && rowNew) {
    next = [rowNew, ...prev.filter((p) => p.id !== rowNew.id)];
  } else if (eventType === 'UPDATE' && rowNew) {
    next = prev.map((p) => (p.id === rowNew.id ? rowNew : p));
  } else if (eventType === 'DELETE' && rowOld) {
    next = prev.filter((p) => p.id !== rowOld.id);
  } else {
    return prev;
  }
  next.sort(
    (a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0),
  );
  return next.slice(0, limit);
}

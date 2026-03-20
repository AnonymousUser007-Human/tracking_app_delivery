import { supabase } from './supabase';

/**
 * Subscribe to INSERT / UPDATE / DELETE on one or more public tables.
 * Use this for “live CRUD”: writes via supabase.from(...).insert|update|delete
 * are pushed to all subscribed clients.
 *
 * Supabase Dashboard → Database → Replication: enable the tables you need.
 *
 * @param {string} channelName - unique channel id (e.g. 'dashboard')
 * @param {Array<{ table: string, filter?: string }>} tables - table names; optional filter e.g. `id=eq.${uuid}`
 * @param {(table: string, payload: import('@supabase/supabase-js').RealtimePostgresChangesPayload<Record<string, unknown>>) => void} onEvent
 * @returns {() => void} unsubscribe
 */
export function subscribePostgresChanges(channelName, tables, onEvent) {
  let channel = supabase.channel(channelName);
  for (const { table, filter } of tables) {
    channel = channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table,
        ...(filter ? { filter } : {}),
      },
      (payload) => onEvent(table, payload),
    );
  }

  channel.subscribe((status, err) => {
    if (status === 'CHANNEL_ERROR') {
      console.error('[realtime] channel error', channelName, err?.message || err);
    }
  });

  return () => {
    supabase.removeChannel(channel);
  };
}

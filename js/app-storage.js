// ============================================================
// WIDEN AppStorage - shared state cache with Supabase-ready sync
// ============================================================

(function () {
  const SHARED_KEYS = [
    'widen-action-states',
    'widen-upload-checks',
    'widen-favorites',
    'widen-visit-logs',
    'widen-candidates',
  ];

  const DEFAULTS = {
    'widen-action-states': {},
    'widen-upload-checks': {},
    'widen-favorites': [],
    'widen-visit-logs': [],
    'widen-candidates': [],
  };

  const cache = {};
  let remoteAdapter = null;
  let status = 'LOCAL_FALLBACK';
  let lastError = null;

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function defaultValue(key) {
    return clone(DEFAULTS[key] ?? null);
  }

  function safeParse(raw, fallback) {
    if (!raw) return fallback;
    try {
      return JSON.parse(raw);
    } catch {
      return fallback;
    }
  }

  function readLocal(key) {
    return safeParse(localStorage.getItem(key), defaultValue(key));
  }

  function writeLocal(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function createSupabaseAdapter(config) {
    const auth = window.WidenAuth;
    const clientFactory = window.supabase && window.supabase.createClient;
    const ownerId = auth?.getUserId?.();
    if (!config?.supabaseUrl || !config?.supabaseAnonKey || !clientFactory || !ownerId) {
      return null;
    }

    const tableName = config.tableName || 'app_state';
    const client = auth?.getClient?.() || clientFactory(config.supabaseUrl, config.supabaseAnonKey);

    return {
      async readMany(keys) {
        const { data, error } = await client
          .from(tableName)
          .select('id,value')
          .eq('owner_id', ownerId)
          .in('id', keys);

        if (error) throw error;

        return (data || []).reduce((acc, row) => {
          acc[row.id] = row.value;
          return acc;
        }, {});
      },
      async write(key, value) {
        const { error } = await client
          .from(tableName)
          .upsert({
            owner_id: ownerId,
            id: key,
            value,
            updated_at: new Date().toISOString(),
          });

        if (error) throw error;
      },
    };
  }

  async function load(options = {}) {
    if (!options.remote && window.WidenAuth?.init) {
      try {
        await window.WidenAuth.init();
      } catch (error) {
        lastError = error;
      }
    }

    const config = window.WIDEN_STORAGE_CONFIG || {};
    const hasRemoteConfig = Boolean(config.supabaseUrl && config.supabaseAnonKey);
    remoteAdapter = options.remote || createSupabaseAdapter(window.WIDEN_STORAGE_CONFIG);
    const remoteValues = {};

    if (remoteAdapter) {
      try {
        Object.assign(remoteValues, await remoteAdapter.readMany(SHARED_KEYS));
        status = 'SYNCED';
        lastError = null;
      } catch (error) {
        status = 'LOCAL_FALLBACK';
        lastError = error;
        console.warn('Shared storage remote load failed; using local fallback.', error);
      }
    } else {
      status = hasRemoteConfig && !window.WidenAuth?.getUserId?.()
        ? 'AUTH_REQUIRED'
        : 'LOCAL_FALLBACK';
    }

    SHARED_KEYS.forEach((key) => {
      const value = remoteValues[key] ?? readLocal(key);
      cache[key] = value ?? defaultValue(key);
      writeLocal(key, cache[key]);
    });
  }

  function get(key, fallback) {
    if (!(key in cache)) {
      cache[key] = readLocal(key);
    }
    return clone(cache[key] ?? fallback ?? defaultValue(key));
  }

  function set(key, value) {
    cache[key] = clone(value);
    writeLocal(key, cache[key]);

    if (remoteAdapter) {
      remoteAdapter.write(key, cache[key]).catch((error) => {
        status = 'LOCAL_FALLBACK';
        lastError = error;
        console.warn(`Shared storage remote write failed for ${key}; kept local fallback.`, error);
      });
    }
  }

  window.AppStorage = {
    keys: SHARED_KEYS,
    load,
    get,
    set,
  };

  Object.defineProperties(window.AppStorage, {
    status: { enumerable: true, get: () => status },
    lastError: { enumerable: true, get: () => lastError },
  });
})();

// ============================================================
// WIDEN AppStorage - shared state cache with Supabase-ready sync
// ============================================================

(function () {
  const SHARED_KEYS = [
    'widen-action-states',
    'widen-upload-checks',
    'widen-favorites',
    'widen-visit-logs',
  ];

  const DEFAULTS = {
    'widen-action-states': {},
    'widen-upload-checks': {},
    'widen-favorites': [],
    'widen-visit-logs': [],
  };

  const cache = {};
  let remoteAdapter = null;

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
    const clientFactory = window.supabase && window.supabase.createClient;
    if (!config?.supabaseUrl || !config?.supabaseAnonKey || !clientFactory) {
      return null;
    }

    const tableName = config.tableName || 'app_state';
    const client = clientFactory(config.supabaseUrl, config.supabaseAnonKey);

    return {
      async readMany(keys) {
        const { data, error } = await client
          .from(tableName)
          .select('id,value')
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
            id: key,
            value,
            updated_at: new Date().toISOString(),
          });

        if (error) throw error;
      },
    };
  }

  async function load(options = {}) {
    remoteAdapter = options.remote || createSupabaseAdapter(window.WIDEN_STORAGE_CONFIG);
    const remoteValues = {};

    if (remoteAdapter) {
      try {
        Object.assign(remoteValues, await remoteAdapter.readMany(SHARED_KEYS));
      } catch (error) {
        console.warn('Shared storage remote load failed; using local fallback.', error);
      }
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
})();

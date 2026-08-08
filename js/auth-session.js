// ============================================================
// WIDEN Auth - Supabase passwordless session facade
// ============================================================

(function () {
  let client = null;
  let session = null;
  let authSubscription = null;
  let status = 'CONFIG_REQUIRED';
  const listeners = new Set();

  function getConfig() {
    return window.WIDEN_STORAGE_CONFIG || {};
  }

  function getClient() {
    const config = getConfig();
    const factory = window.supabase && window.supabase.createClient;

    if (!config.supabaseUrl || !config.supabaseAnonKey || !factory) {
      status = 'CONFIG_REQUIRED';
      return null;
    }

    if (!client) client = factory(config.supabaseUrl, config.supabaseAnonKey);
    return client;
  }

  function notify(event) {
    listeners.forEach((listener) => listener(event, session));
  }

  async function init() {
    const service = getClient();
    if (!service) {
      session = null;
      return null;
    }

    const { data, error } = await service.auth.getSession();
    if (error) {
      status = 'REMOTE_ERROR';
      throw error;
    }

    session = data?.session || null;
    status = session ? 'AUTHENTICATED' : 'AUTH_REQUIRED';

    if (!authSubscription) {
      const result = service.auth.onAuthStateChange((event, nextSession) => {
        session = nextSession || null;
        status = session ? 'AUTHENTICATED' : 'AUTH_REQUIRED';
        notify(event);
      });
      authSubscription = result?.data?.subscription || result?.subscription || null;
    }

    return session;
  }

  async function signInWithOtp(email) {
    const service = getClient();
    if (!service) throw new Error('Supabase storage is not configured.');
    if (!email || !email.trim()) throw new Error('Email is required.');

    return service.auth.signInWithOtp({
      email: email.trim(),
      options: {
        shouldCreateUser: true,
        emailRedirectTo: window.location?.href,
      },
    });
  }

  async function signOut() {
    const service = getClient();
    if (!service) {
      session = null;
      status = 'CONFIG_REQUIRED';
      return { error: null };
    }

    const result = await service.auth.signOut();
    if (!result.error) {
      session = null;
      status = 'AUTH_REQUIRED';
    }
    return result;
  }

  window.WidenAuth = {
    init,
    signInWithOtp,
    signOut,
    getClient,
    getSession: () => session,
    getUserId: () => session?.user?.id || null,
    isConfigured: () => Boolean(getConfig().supabaseUrl && getConfig().supabaseAnonKey && getClient()),
    getStatus: () => status,
    onAuthStateChange(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
})();

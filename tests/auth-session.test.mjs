import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import vm from 'node:vm';

function createContext() {
  const listeners = [];
  let currentSession = null;
  const client = {
    auth: {
      async getSession() {
        return { data: { session: currentSession }, error: null };
      },
      onAuthStateChange(callback) {
        listeners.push(callback);
        return { data: { subscription: { unsubscribe() {} } } };
      },
      async signInWithOtp({ email, options }) {
        assert.equal(email, 'owner@example.com');
        assert.equal(options.shouldCreateUser, true);
        return { data: {}, error: null };
      },
      async signOut() {
        currentSession = null;
        listeners.forEach((callback) => callback('SIGNED_OUT', null));
        return { error: null };
      },
    },
  };

  const context = {
    console,
    location: { href: 'https://widen.example.com/' },
    WIDEN_STORAGE_CONFIG: {
      supabaseUrl: 'https://example.supabase.co',
      supabaseAnonKey: 'sb_publishable_test',
    },
    supabase: {
      createClient() {
        return client;
      },
    },
  };
  context.window = context;
  vm.createContext(context);
  return { context, setSession: (session) => { currentSession = session; } };
}

const { context, setSession } = createContext();
const source = existsSync('js/auth-session.js') ? readFileSync('js/auth-session.js', 'utf8') : '';
vm.runInContext(source, context, { filename: 'js/auth-session.js' });

assert.ok(context.WidenAuth, 'WidenAuth is exposed globally');
assert.equal(typeof context.WidenAuth.init, 'function', 'WidenAuth can initialize a session');
assert.equal(typeof context.WidenAuth.signInWithOtp, 'function', 'WidenAuth supports passwordless login');

const unauthenticated = await context.WidenAuth.init();
assert.equal(unauthenticated, null, 'initial session is empty');
assert.equal(context.WidenAuth.getUserId(), null, 'missing session has no user id');

await context.WidenAuth.signInWithOtp('owner@example.com');
setSession({ user: { id: 'user-1', email: 'owner@example.com' } });
await context.WidenAuth.init();
assert.equal(context.WidenAuth.getUserId(), 'user-1', 'authenticated session exposes owner id');

await context.WidenAuth.signOut();
assert.equal(context.WidenAuth.getUserId(), null, 'sign out clears owner id');

console.log('auth session checks passed');

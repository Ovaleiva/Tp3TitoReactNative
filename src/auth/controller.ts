import type { Session, SupabaseClient } from '@supabase/supabase-js';
import { authError, CONFIRM_SENT, EMAIL_SENT, normalizeEmail, remainingSeconds, validEmail, validPassword } from './rules.ts';
import { INVALID_LINK, parseAuthLink } from './links.ts';

interface Storage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}
export interface AuthState {
  ready: boolean;
  busy: boolean;
  processingLink: boolean;
  session: Session | null;
  recovery: boolean;
  linkError: string;
  fatalError: string;
  notice: string;
  pendingEmail: string;
  deadlines: Record<string, number>;
}
const RECOVERY_KEY = 'ibank-recovery-active';
export class AuthController {
  state: AuthState = { ready: false, busy: false, processingLink: false, session: null, recovery: false, linkError: '', fatalError: '', notice: '', pendingEmail: '', deadlines: {} };
  private listeners = new Set<() => void>();
  private unsubscribe?: () => void;
  private handlingLink = false;
  private recoveryEvent = false;
  private disposed = false;
  private client: SupabaseClient;
  private storage: Storage;
  readonly callbacks: { confirm: string; recovery: string };
  private queuedLink: string | null = null;
  constructor(client: SupabaseClient, storage: Storage, callbacks: { confirm: string; recovery: string }) {
    this.client = client; this.storage = storage; this.callbacks = callbacks;
  }
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };
  getSnapshot = () => this.state;
  private patch(values: Partial<AuthState>) {
    if (this.disposed) return;
    this.state = { ...this.state, ...values };
    this.listeners.forEach(listener => listener());
  }
  async start(initialURL: string | null) {
    const { data } = this.client.auth.onAuthStateChange((event, session) => {
      // Never await Supabase methods inside this callback (SDK auth lock).
      if (event === 'PASSWORD_RECOVERY' && this.handlingLink) {
        this.recoveryEvent = true;
        this.patch({ recovery: true });
      }
      if (event === 'SIGNED_OUT') this.patch({ session: null, recovery: false });
      else if (!(event === 'SIGNED_IN' && this.state.busy && !this.handlingLink)) this.patch({ session });
    });
    this.unsubscribe = () => data.subscription.unsubscribe();
    try {
      if (await this.storage.getItem(RECOVERY_KEY)) {
        const { error } = await this.client.auth.signOut({ scope: 'local' });
        if (error) throw error;
        await this.storage.removeItem(RECOVERY_KEY);
        this.patch({ linkError: 'La recuperación se interrumpió. Pedí un enlace nuevo para continuar.' });
      }
      const { data: current, error } = await this.client.auth.getSession();
      if (error) throw error;
      this.patch({ session: current.session });
      if (initialURL) await this.handleLink(initialURL);
    } catch {
      this.patch({ fatalError: 'No pudimos recuperar la sesión de forma segura. Cerrá y volvé a abrir la app.' });
    } finally { this.patch({ ready: true }); }
  }
  dispose() { this.disposed = true; this.unsubscribe?.(); this.listeners.clear(); }
  setNotice(notice: string) { this.patch({ notice }); }
  private cooldownKey(action: string, email: string) { return action + ':' + normalizeEmail(email); }
  seconds(action: string, email: string) { return remainingSeconds(this.state.deadlines[this.cooldownKey(action, email)]); }
  private cooldown(action: string, email: string) {
    const deadlines = Object.fromEntries(Object.entries(this.state.deadlines).filter(([, until]) => until > Date.now()));
    deadlines[this.cooldownKey(action, email)] = Date.now() + 60_000;
    this.patch({ deadlines });
  }
  private async run<T>(action: string, email: string, task: () => Promise<T>): Promise<T | undefined> {
    if (this.state.busy || this.seconds(action, email)) return;
    this.patch({ busy: true, notice: '' });
    try { return await task(); }
    catch (error) {
      const mapped = authError(error);
      if (mapped.kind === 'rate') this.cooldown(action, email);
      throw new Error(mapped.message);
    } finally {
      this.patch({ busy: false });
      if (this.queuedLink) {
        const url = this.queuedLink; this.queuedLink = null;
        void this.handleLink(url);
      }
    }
  }
  async login(email: string, password: string) {
    if (!validEmail(email) || !password) throw new Error('Ingresá un email válido y tu contraseña.');
    return this.run('login', email, async () => {
      const { data, error } = await this.client.auth.signInWithPassword({ email: normalizeEmail(email), password });
      if (error && authError(error).kind === 'unconfirmed') {
        this.patch({ pendingEmail: normalizeEmail(email) }); return 'confirm' as const;
      }
      if (error) throw error;
      this.patch({ pendingEmail: '', session: data.session });
      return 'home' as const;
    });
  }
  async signup(name: string, email: string, password: string) {
    if (!name.trim() || !validEmail(email) || !validPassword(password)) throw new Error('Revisá los datos y los requisitos de contraseña.');
    return this.run('email', email, async () => {
      const { data, error } = await this.client.auth.signUp({
        email: normalizeEmail(email), password,
        options: { data: { full_name: name.trim() }, emailRedirectTo: this.callbacks.confirm },
      });
      if (error && authError(error).kind !== 'exists') throw error;
      // The assignment requires confirmation; do not silently accept an auto-login
      // from a dashboard with Confirm email disabled.
      if (data.session) {
        const { error: logoutError } = await this.client.auth.signOut({ scope: 'local' });
        if (logoutError) throw logoutError;
      }
      this.cooldown('email', email);
      this.patch({ pendingEmail: normalizeEmail(email), notice: CONFIRM_SENT });
      return true;
    });
  }
  async resend() {
    const email = this.state.pendingEmail;
    return this.run('email', email, async () => {
      const { error } = await this.client.auth.resend({ type: 'signup', email, options: { emailRedirectTo: this.callbacks.confirm } });
      if (error && authError(error).kind !== 'exists') throw error;
      this.cooldown('email', email);
      this.patch({ notice: CONFIRM_SENT });
    });
  }
  async recover(email: string) {
    if (!validEmail(email)) throw new Error('Ingresá un email válido.');
    return this.run('email', email, async () => {
      const { error } = await this.client.auth.resetPasswordForEmail(normalizeEmail(email), { redirectTo: this.callbacks.recovery });
      if (error && !['exists', 'credentials'].includes(authError(error).kind) && error.code !== 'user_not_found') throw error;
      this.cooldown('email', email);
      this.patch({ notice: EMAIL_SENT });
      return true;
    });
  }
  async handleLink(raw: string) {
    if (this.handlingLink) return;
    if (this.state.busy) { this.queuedLink = raw; return; }
    let link;
    try { link = parseAuthLink(raw, this.callbacks); }
    catch { this.patch({ linkError: INVALID_LINK }); return; }
    if (!link) return;
    this.handlingLink = true;
    this.recoveryEvent = false;
    this.patch({ busy: true, processingLink: true, linkError: '', notice: '', recovery: false });
    try {
      // Persist before exchanging, so a process death cannot restore a recovery
      // session as a regular Home session.
      await this.storage.setItem(RECOVERY_KEY, '1');
      const { data, error } = await this.client.auth.exchangeCodeForSession(link.code, link.flowId ? { flowId: link.flowId } : undefined);
      if (error || !data.session) throw error ?? new Error(INVALID_LINK);
      if (link.route === 'reset-password' && !this.recoveryEvent) throw new Error(INVALID_LINK);
      this.patch({ session: data.session, recovery: this.recoveryEvent });
      if (!this.recoveryEvent) await this.storage.removeItem(RECOVERY_KEY);
    } catch (error) {
      console.error('CONFIRM LINK ERROR:', error);
      let cleanupFailed = false;
      try {
        const { error } = await this.client.auth.signOut({ scope: 'local' });
        if (error) throw error;
        await this.storage.removeItem(RECOVERY_KEY);
      } catch { cleanupFailed = true; }
      const networkFailure = authError(error).kind === 'network';
      const linkError = networkFailure
        ? 'No pudimos conectarnos para completar el enlace. Si ya confirmaste el email, volvé a Login e iniciá sesión. Para recuperar la contraseña, solicitá un enlace nuevo cuando vuelva la conexión.'
        : INVALID_LINK;
      this.patch({ session: null, recovery: false, linkError, fatalError: cleanupFailed ? 'No se pudo cerrar la sesión temporal. Reiniciá la app para reintentar.' : '' });
    } finally {
      this.handlingLink = false;
      this.patch({ busy: false, processingLink: false });
    }
  }
  async updatePassword(password: string) {
    if (!validPassword(password)) throw new Error('Revisá los requisitos de contraseña.');
    return this.run('update', '', async () => {
      if (!this.state.recovery || !this.state.session || !this.recoveryEvent) throw new Error(INVALID_LINK);
      const { error } = await this.client.auth.updateUser({ password });
      if (error) throw error;
      const { error: signOutError } = await this.client.auth.signOut();
      if (signOutError) {
        this.patch({ fatalError: 'La contraseña cambió, pero no pudimos cerrar la sesión temporal. Reiniciá la app para completar el cierre.' });
        throw signOutError;
      }
      await this.storage.removeItem(RECOVERY_KEY);
      this.recoveryEvent = false;
      this.patch({ session: null, recovery: false, pendingEmail: '', notice: 'Contraseña actualizada. Iniciá sesión con tu nueva contraseña.' });
      return true;
    });
  }
  async logout() {
    return this.run('logout', '', async () => {
      const { error } = await this.client.auth.signOut();
      if (error) throw error;
      await this.storage.removeItem(RECOVERY_KEY);
      this.recoveryEvent = false;
      this.patch({ session: null, recovery: false, pendingEmail: '', notice: '' });
    });
  }
  async dismissLinkError() {
    if (this.state.recovery) await this.logout();
    this.patch({ linkError: '' });
  }
}

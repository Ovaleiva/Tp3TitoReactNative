import React, { createContext, useContext, useEffect, useState, useSyncExternalStore } from 'react';
import { AppState, BackHandler, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';
import { supabase } from '../lib/supabase';
import { AuthController, type AuthState } from './controller';

const emptyState: AuthState = { ready: true, busy: false, processingLink: false, session: null, recovery: false, linkError: '', fatalError: '', notice: '', pendingEmail: '', deadlines: {} };
const AuthContext = createContext<{ controller: AuthController | null; state: AuthState; configured: boolean }>({ controller: null, state: emptyState, configured: false });
const noopSubscribe = () => () => {};
const getEmpty = () => emptyState;
export function AuthProvider({ children }: React.PropsWithChildren) {
  const [controller] = useState(() => supabase ? new AuthController(supabase, AsyncStorage, {
    confirm: Linking.createURL('confirm'), recovery: Linking.createURL('reset-password'),
  }) : null);
  const state = useSyncExternalStore(controller?.subscribe ?? noopSubscribe, controller?.getSnapshot ?? getEmpty, getEmpty);
  useEffect(() => {
    if (!controller || !supabase) return;
    let active = true;
    let initialized = false;
    let queuedURL: string | null = null;
    const clearWebCallback = (raw: string | null) => {
      if (!raw || Platform.OS !== 'web' || typeof window === 'undefined') return;
      try {
        const url = new URL(raw);
        const known = [controller.callbacks.confirm, controller.callbacks.recovery].some(value => {
          const callback = new URL(value);
          return url.origin === callback.origin && url.pathname === callback.pathname;
        });
        if (known) window.history.replaceState(window.history.state, '', '/');
      } catch { /* Malformed URLs are rejected by the auth parser. */ }
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => controller.state.busy);
    const subscription = Linking.addEventListener('url', ({ url }) => {
      if (!initialized) queuedURL = url;
      else { clearWebCallback(url); void controller.handleLink(url); }
    });
    void (async () => {
      try {
        const initialURL = await Linking.getInitialURL();
        if (!active) return;
        const bootURL = queuedURL ?? initialURL;
        queuedURL = null;
        clearWebCallback(bootURL);
        await controller.start(bootURL);
        initialized = true;
        if (queuedURL && queuedURL !== bootURL) { clearWebCallback(queuedURL); await controller.handleLink(queuedURL); }
        queuedURL = null;
      } catch { await controller.start(null); }
    })();
    const updateRefresh = (state: string) => {
      if (state === 'active') supabase!.auth.startAutoRefresh();
      else supabase!.auth.stopAutoRefresh();
    };
    updateRefresh(AppState.currentState);
    const appState = AppState.addEventListener('change', updateRefresh);
    return () => {
      active = false;
      subscription.remove();
      backHandler.remove();
      appState.remove();
      supabase!.auth.stopAutoRefresh();
      controller.dispose();
    };
  }, [controller]);
  return <AuthContext.Provider value={{ controller, state, configured: Boolean(controller) }}>{children}</AuthContext.Provider>;
}
export const useAuth = () => useContext(AuthContext);
export function useCooldown(action: string, email: string) {
  const { controller, state } = useAuth();
  const [, tick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => tick(value => value + 1), 1000);
    return () => clearInterval(interval);
  }, []);
  void state.deadlines;
  return controller?.seconds(action, email) ?? 0;
}


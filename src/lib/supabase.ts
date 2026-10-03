import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, processLock } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';
import { createPkceFetch } from '../auth/pkceFetch.ts';

const waitForForeground = async () => {
  if (Platform.OS === 'web' || AppState.currentState === 'active') return;
  await new Promise<void>(resolve => {
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') { subscription.remove(); resolve(); }
    });
    if (AppState.currentState === 'active') { subscription.remove(); resolve(); }
  });
};

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
export const configured = Boolean(url && /^https:\/\//.test(url) && key && !key.includes('YOUR_') && !url.includes('YOUR_PROJECT'));
export const supabase = configured ? createClient(url!, key!, {
  global: { fetch: createPkceFetch((input, init) => fetch(input, init), waitForForeground) },
  auth: {
    storage: AsyncStorage,
    storageKey: 'ibank-auth',
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: 'pkce',
    lock: processLock,
  },
}) : null;

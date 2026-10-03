import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, processLock } from '@supabase/supabase-js';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
export const configured = Boolean(url && /^https:\/\//.test(url) && key && !key.includes('YOUR_') && !url.includes('YOUR_PROJECT'));
export const supabase = configured ? createClient(url!, key!, {
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


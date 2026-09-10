export const PASSWORD_MIN_LENGTH = 8;
export const EMAIL_SENT = 'Si el email existe en nuestro sistema, vas a recibir instrucciones';
export const CONFIRM_SENT = 'Revisá tu email para continuar';
export const normalizeEmail = (email: string) => email.trim().toLowerCase();
export const validEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(email));
export function passwordRules(password: string) {
  return [
    { label: 'Al menos 8 caracteres', met: password.length >= PASSWORD_MIN_LENGTH },
    { label: 'Una letra mayúscula', met: /[A-Z]/.test(password) },
    { label: 'Una letra minúscula', met: /[a-z]/.test(password) },
    { label: 'Un número', met: /[0-9]/.test(password) },
    { label: 'Un símbolo (!@#$...)', met: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?`~]/.test(password) },
  ];
}
export const validPassword = (password: string) => passwordRules(password).every(rule => rule.met);
export const matchingPassword = (password: string, confirmation: string) => validPassword(password) && password === confirmation;
export function remainingSeconds(deadline = 0, now = Date.now()) {
  return Math.max(0, Math.ceil((deadline - now) / 1000));
}
export type ErrorKind = 'unconfirmed' | 'rate' | 'exists' | 'credentials' | 'weak' | 'expired' | 'network' | 'other';
export function authError(error: unknown): { kind: ErrorKind; message: string } {
  const e = error as { code?: string; status?: number; name?: string; message?: string } | null;
  const code = e?.code;
  if (e?.status === 429 || code === 'over_request_rate_limit' || code === 'over_email_send_rate_limit')
    return { kind: 'rate', message: 'Demasiados intentos. Esperá 60 segundos para volver a intentar.' };
  if (code === 'email_not_confirmed') return { kind: 'unconfirmed', message: CONFIRM_SENT };
  if (code === 'user_already_exists' || code === 'email_exists') return { kind: 'exists', message: CONFIRM_SENT };
  if (code === 'invalid_credentials' || e?.message === 'Invalid login credentials')
    return { kind: 'credentials', message: 'Email o contraseña incorrectos' };
  if (code === 'weak_password') return { kind: 'weak', message: 'La contraseña no cumple la política de seguridad. Revisá los requisitos y elegí otra.' };
  if (code === 'same_password') return { kind: 'weak', message: 'Elegí una contraseña distinta de la anterior.' };
  if (['otp_expired', 'flow_state_expired', 'flow_state_not_found', 'bad_code_verifier', 'validation_failed'].includes(code ?? ''))
    return { kind: 'expired', message: 'El enlace venció o no es válido. Solicitá uno nuevo desde este dispositivo.' };
  if (e?.name === 'AuthRetryableFetchError' || e?.name === 'TypeError')
    return { kind: 'network', message: 'No pudimos conectarnos. Revisá tu conexión y volvé a intentar.' };
  return { kind: 'other', message: 'No pudimos completar la operación. Volvé a intentar en unos minutos.' };
}


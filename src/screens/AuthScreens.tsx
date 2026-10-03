import React, { useCallback, useState } from 'react';
import { Modal, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth, useCooldown } from '../auth/AuthProvider';
import { matchingPassword, validEmail } from '../auth/rules';
import { Button, Checklist, Field, Link, Message, Page, Terms, s } from '../components/ui';

export type Routes = { Login: undefined; Register: undefined; Pending: undefined; Recover: undefined; NewPassword: undefined; Home: undefined };
type Props = { navigation: NativeStackNavigationProp<Routes> };
function useForm() {
  const { state, configured, controller } = useAuth();
  const [error, setError] = useState('');
  const run = async (task: () => Promise<unknown>) => {
    if (state.busy || !configured) return;
    setError('');
    try { await task(); } catch (error) { setError(error instanceof Error ? error.message : 'No pudimos completar la operación.'); }
  };
  return { state, configured, controller, error, setError, run };
}
function usePasswords() {
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  useFocusEffect(useCallback(() => () => { setPassword(''); setConfirmation(''); }, []));
  return { password, setPassword, confirmation, setConfirmation };
}
function EmailField({ email, setEmail }: { email: string; setEmail: (email: string) => void }) {
  const [touched, setTouched] = useState(false);
  return <Field label="Email" placeholder="nombre@ejemplo.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoComplete="email" textContentType="emailAddress" onBlur={() => setTouched(true)} error={touched && !validEmail(email) ? 'Ingresá un email válido.' : undefined} />;
}
export function LoginScreen({ navigation }: Props) {
  const f = useForm();
  const [email, setEmail] = useState('');
  const { password, setPassword } = usePasswords();
  const seconds = useCooldown('login', email);
  const submit = () => void f.run(async () => {
    const result = await f.controller!.login(email, password);
    setPassword('');
    if (result === 'confirm') navigation.navigate('Pending');
  });
  return <Page title="Qué bueno verte de nuevo" subtitle="Iniciá sesión y seguí con tu día." emblem="↗">
    <Message text={f.state.notice} /><Message text={f.error} error />
    <EmailField email={email} setEmail={setEmail} />
    <Field label="Contraseña" placeholder="Ingresá tu contraseña" password value={password} onChangeText={setPassword} autoComplete="current-password" textContentType="password" />
    <View style={{ alignItems: 'flex-end', marginTop: -10, marginBottom: 12 }}><Link title="Olvidé mi contraseña" onPress={() => { f.controller?.setNotice(''); navigation.navigate('Recover'); }} /></View>
    <Button title={seconds ? 'Volvé a intentar en ' + seconds + ' s' : 'Iniciar sesión'} onPress={submit} loading={f.state.busy} disabled={!f.configured || !validEmail(email) || !password || seconds > 0} />
    <Link title="¿Todavía no tenés cuenta? Registrate" onPress={() => { f.controller?.setNotice(''); navigation.navigate('Register'); }} />
  </Page>;
}
export function RegisterScreen({ navigation }: Props) {
  const f = useForm();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const p = usePasswords();
  const [accepted, setAccepted] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const seconds = useCooldown('email', email);
  return <Page title="Creá tu cuenta" subtitle="Empezá con tus datos. Es simple y lleva un momento." back={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Login')} emblem="+">
    <Message text={f.error} error />
    <Field label="Nombre completo" placeholder="Tu nombre y apellido" value={name} onChangeText={setName} autoCapitalize="words" autoComplete="name" textContentType="name" />
    <EmailField email={email} setEmail={setEmail} />
    <Field label="Contraseña" placeholder="Creá una contraseña segura" password value={p.password} onChangeText={p.setPassword} autoComplete="new-password" textContentType="newPassword" />
    <Checklist password={p.password} />
    <Field label="Confirmar contraseña" placeholder="Repetí tu contraseña" password value={p.confirmation} onChangeText={p.setConfirmation} autoComplete="new-password" textContentType="newPassword" error={p.confirmation && p.password !== p.confirmation ? 'Las contraseñas no coinciden.' : undefined} />
    <Terms checked={accepted} onPress={() => setAccepted(value => !value)} />
    <Link title="Leer términos y condiciones" onPress={() => setTermsOpen(true)} />
    <Button title={seconds ? 'Podés reenviar en ' + seconds + ' s' : 'Crear cuenta'} loading={f.state.busy} disabled={!f.configured || !name.trim() || !validEmail(email) || !matchingPassword(p.password, p.confirmation) || !accepted || seconds > 0}
      onPress={() => void f.run(async () => { if (await f.controller!.signup(name, email, p.password)) { p.setPassword(''); p.setConfirmation(''); navigation.replace('Pending'); } })} />
    <Link title="Ya tengo cuenta. Iniciar sesión" onPress={() => navigation.navigate('Login')} />
    <Modal visible={termsOpen} animationType="slide" onRequestClose={() => setTermsOpen(false)}>
      <Page title="Términos de la práctica" subtitle="Proyecto académico iBank" back={() => setTermsOpen(false)}>
        <Text style={s.subtitle}>Esta aplicación es una práctica de autenticación. No ofrece cuentas bancarias ni operaciones financieras. Usá datos de prueba. El nombre y el email se envían al proyecto de Supabase configurado para crear tu usuario. La contraseña se procesa mediante Supabase Auth.</Text>
        <Text style={[s.subtitle, { marginTop: 16 }]}>Al aceptar, confirmás que entendés el propósito académico de esta aplicación. No ingreses información bancaria ni datos sensibles ajenos a esta práctica.</Text>
        <Button title="Entendido" onPress={() => setTermsOpen(false)} />
      </Page>
    </Modal>
  </Page>;
}
export function PendingScreen({ navigation }: Props) {
  const f = useForm();
  const seconds = useCooldown('email', f.state.pendingEmail);
  return <Page title="Revisá tu email" subtitle="Para continuar, abrí el enlace de confirmación desde este dispositivo." emblem="✉">
    <View style={s.emailCard}><Text style={s.emailText}>{f.state.pendingEmail || 'Tu dirección de email'}</Text></View>
    <Message text={f.state.notice} /><Message text={f.error} error />
    <Text style={s.subtitle}>Si no encontrás el mensaje, revisá la carpeta de spam. Podés solicitar otro enlace cuando termine la espera.</Text>
    <View style={{ height: 24 }} />
    <Button title={seconds ? 'Reenviar email en ' + seconds + ' s' : 'Reenviar email'} disabled={!f.configured || !f.state.pendingEmail || seconds > 0} loading={f.state.busy} onPress={() => void f.run(() => f.controller!.resend())} />
    <Link title="Volver a iniciar sesión" onPress={() => { f.controller?.setNotice(''); navigation.navigate('Login'); }} />
  </Page>;
}
export function RecoverScreen({ navigation }: Props) {
  const f = useForm();
  const [email, setEmail] = useState('');
  const seconds = useCooldown('email', email);
  return <Page title="¿Olvidaste tu contraseña?" subtitle="Te ayudamos a recuperar el acceso a tu cuenta." back={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Login')} emblem="↻">
    <Message text={f.state.notice} /><Message text={f.error} error />
    <EmailField email={email} setEmail={setEmail} />
    <Text style={[s.subtitle, { marginBottom: 24 }]}>Ingresá tu email. Si existe una cuenta, te enviaremos un enlace para elegir una contraseña nueva.</Text>
    <Button title={seconds ? 'Reenviar enlace en ' + seconds + ' s' : 'Enviar instrucciones'} loading={f.state.busy} disabled={!f.configured || !validEmail(email) || seconds > 0} onPress={() => void f.run(() => f.controller!.recover(email))} />
    <Link title="Volver a iniciar sesión" onPress={() => { f.controller?.setNotice(''); navigation.navigate('Login'); }} />
  </Page>;
}
export function NewPasswordScreen() {
  const f = useForm();
  const seconds = useCooldown('update', '');
  const p = usePasswords();
  return <Page title="Tu nueva contraseña" subtitle="Elegí una contraseña segura que no hayas usado antes." emblem="✓">
    <Message text={f.error} error />
    <Field label="Nueva contraseña" placeholder="Ingresá tu nueva contraseña" password value={p.password} onChangeText={p.setPassword} autoComplete="new-password" textContentType="newPassword" />
    <Checklist password={p.password} />
    <Field label="Confirmar contraseña" placeholder="Repetí tu nueva contraseña" password value={p.confirmation} onChangeText={p.setConfirmation} autoComplete="new-password" textContentType="newPassword" error={p.confirmation && p.password !== p.confirmation ? 'Las contraseñas no coinciden.' : undefined} />
    <Button title={seconds ? "Volvé a intentar en " + seconds + " s" : "Guardar contraseña"} loading={f.state.busy} disabled={!matchingPassword(p.password, p.confirmation) || !f.state.recovery || seconds > 0} onPress={() => void f.run(async () => { if (await f.controller!.updatePassword(p.password)) { p.setPassword(''); p.setConfirmation(''); } })} />
    <Link title="Cancelar y volver a iniciar sesión" onPress={() => void f.run(() => f.controller!.logout())} />
  </Page>;
}
export function HomeScreen() {
  const f = useForm();
  const name = f.state.session?.user.user_metadata.full_name;
  return <Page title={typeof name === 'string' && name.trim() ? 'Hola, ' + name.trim().split(' ')[0] : 'Bienvenido a iBank'} subtitle="Tu cuenta está lista. Ya podés entrar y salir de forma segura." emblem="✓">
    <View style={s.emailCard}><Text style={[s.subtitle, { textAlign: 'center', marginBottom: 8 }]}>Sesión iniciada</Text><Text style={s.emailText}>{f.state.session?.user.email}</Text></View>
    <Message text={f.error} error />
    <Button title="Cerrar sesión" secondary loading={f.state.busy} onPress={() => void f.run(() => f.controller!.logout())} />
  </Page>;
}



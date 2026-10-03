import React, { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type TextInputProps, type TextStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { passwordRules } from '../auth/rules';
import { useAuth } from '../auth/AuthProvider';

// React Native types omit CSS outlineStyle='none'; apply this only on web.
const webInputStyle = { outlineStyle: 'none' } as unknown as TextStyle;
export const colors = { primary: '#3629B7', ink: '#343434', muted: '#737373', line: '#E0E0E0', pale: '#F2F1F9', error: '#B42318', success: '#147D54', white: '#FFFFFF' };
export function Page({ title, subtitle, children, back, emblem = '↗', headerTitle = 'iBank' }: React.PropsWithChildren<{ title: string; subtitle: string; back?: () => void; emblem?: string; headerTitle?: string }>) {
  const { state, configured } = useAuth();
  return <SafeAreaView style={s.safe} edges={['top']}>
    <View style={s.top}>
      {back ? <Pressable accessibilityRole="button" accessibilityLabel="Volver" disabled={state.busy} onPress={back} style={({ pressed }) => [s.back, pressed && s.pressed]}><Text style={s.backText}>‹</Text></Pressable> : <View style={{ width: 48 }} />}
      <Text style={s.brand}>{headerTitle}</Text><View style={{ width: 48 }} />
    </View>
    <SafeAreaView style={s.sheet} edges={['bottom']}>
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.scroll}>
        <View style={s.page}>
          <View style={s.heading}>
            <Text accessibilityRole="header" style={s.title}>{title}</Text>
            <Text style={s.subtitle}>{subtitle}</Text>
            <Illustration emblem={emblem} />
          </View>
          {!configured && <Message text="La conexión de iBank todavía no está configurada. Los formularios están disponibles para revisión." />}
          {children}
          <Text style={s.footnote}>iBank · Tu próximo paso empieza acá</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
    </SafeAreaView>
  </SafeAreaView>;
}
function Illustration({ emblem }: { emblem: string }) {
  return <View accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={s.art}>
    <View style={s.artCircle} />
    <View style={[s.dot, { left: 26, top: 22, backgroundColor: '#52D5BA' }]} />
    <View style={[s.dot, { right: 24, top: 66, backgroundColor: '#FFAF2A', width: 8, height: 8 }]} />
    <View style={[s.dot, { left: 39, bottom: 12, backgroundColor: '#FF4267', width: 7, height: 7 }]} />
    {emblem === '+' ? <View style={s.phone}><View style={s.speaker} /><View style={s.avatar}><View style={s.avatarHead} /><View style={s.avatarBody} /></View><View style={s.phoneLine} /><View style={s.phoneLine} /><View style={s.phoneButton} /></View>
      : emblem === '✉' || emblem === '↻' ? <View style={s.envelope}><View style={s.flap} /></View>
      : emblem === '✓' ? <View style={s.successArt}><Text style={s.successCheck}>✓</Text></View>
      : <View style={s.lock}><View style={s.shackle} /><View style={s.lockBody}><View style={s.keyhole} /><View style={s.keyStem} /></View></View>}
  </View>;
}
interface FieldProps extends TextInputProps { label: string; error?: string; password?: boolean }
export function Field({ label, error, password, ...props }: FieldProps) {
  const [visible, setVisible] = useState(false);
  const [focused, setFocused] = useState(false);
  const { state } = useAuth();
  return <View style={s.field}>
    <Text style={s.label}>{label}</Text>
    <View style={[s.inputRow, focused && s.inputFocus, Boolean(error) && s.inputError, state.busy && s.disabled]}>
      <TextInput {...props} editable={!state.busy && props.editable !== false} accessibilityLabel={label}
        accessibilityHint={error} autoCapitalize={props.autoCapitalize ?? 'none'}
        autoCorrect={false} placeholderTextColor="#8B94A5"
        secureTextEntry={Boolean(password && !visible)} onFocus={() => setFocused(true)}
        onBlur={event => { setFocused(false); props.onBlur?.(event); }}
        style={[s.input, Platform.OS === 'web' && webInputStyle]} />
      {password && <Pressable accessibilityRole="button" accessibilityLabel={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'} accessibilityState={{ disabled: state.busy }} disabled={state.busy} onPress={() => setVisible(value => !value)} style={s.reveal}><Text style={s.revealText}>{visible ? 'Ocultar' : 'Ver'}</Text></Pressable>}
    </View>
    {error ? <Text accessibilityLiveRegion="polite" style={s.fieldError}>{error}</Text> : null}
  </View>;
}
export function Button({ title, onPress, disabled, loading, secondary = false }: { title: string; onPress: () => void; disabled?: boolean; loading?: boolean; secondary?: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled: Boolean(disabled || loading), busy: Boolean(loading) }}
    disabled={disabled || loading} onPress={onPress} style={({ pressed }) => [s.button, secondary && s.secondaryButton, (disabled || loading) && s.disabled, pressed && s.pressed]}>
    {loading && <ActivityIndicator color={secondary ? colors.primary : 'white'} />}
    <Text style={[s.buttonText, secondary && { color: colors.primary }]}>{loading ? 'Procesando…' : title}</Text>
  </Pressable>;
}
export function Link({ title, onPress }: { title: string; onPress: () => void }) {
  const { state } = useAuth();
  return <Pressable accessibilityRole="button" disabled={state.busy} onPress={onPress} style={({ pressed }) => [s.link, pressed && s.pressed, state.busy && s.disabled]}><Text style={s.linkText}>{title}</Text></Pressable>;
}
export function Message({ text, error = false }: { text?: string; error?: boolean }) {
  if (!text) return null;
  return <View style={[s.message, error && s.errorMessage]} accessibilityLiveRegion="polite"><Text accessibilityRole={error ? 'alert' : 'text'} style={[s.messageText, error && { color: colors.error }]}>{text}</Text></View>;
}
export function Checklist({ password }: { password: string }) {
  return <View style={s.checklist}>{passwordRules(password).map(rule => <Text key={rule.label} style={[s.rule, rule.met && { color: colors.success }]} accessibilityLabel={(rule.met ? 'Cumplido: ' : 'Pendiente: ') + rule.label}>{rule.met ? '✓' : '○'}  {rule.label}</Text>)}</View>;
}
export function Terms({ checked, onPress }: { checked: boolean; onPress: () => void }) {
  const { state } = useAuth();
  return <Pressable accessibilityRole="checkbox" accessibilityLabel="Acepto los términos y condiciones" accessibilityState={{ checked, disabled: state.busy }} disabled={state.busy} onPress={onPress} style={s.terms}>
    <View style={[s.checkbox, checked && { backgroundColor: colors.primary, borderColor: colors.primary }]}><Text style={{ color: 'white', fontWeight: '800' }}>{checked ? '✓' : ''}</Text></View>
    <Text style={s.termsText}>Acepto los términos y condiciones.</Text>
  </Pressable>;
}
export const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.primary },
  sheet: { flex: 1, backgroundColor: colors.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: 'hidden' },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 28, paddingBottom: 20 },
  page: { width: '100%', maxWidth: 440, alignSelf: 'center', flexGrow: 1 },
  top: { width: '100%', maxWidth: 488, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, height: 80 },
  brand: { fontSize: 20, fontWeight: '600', color: colors.white, flex: 1, textAlign: 'center' },
  back: { width: 48, height: 48, justifyContent: 'center', alignItems: 'center' },
  backText: { fontSize: 36, color: colors.white, lineHeight: 40 },
  heading: { marginBottom: 22 },
  title: { color: colors.primary, fontSize: 26, lineHeight: 34, fontWeight: '700', letterSpacing: -0.5, marginBottom: 8 },
  subtitle: { color: colors.muted, fontSize: 14, lineHeight: 22 },
  art: { width: 180, height: 148, alignSelf: 'center', marginTop: 20, alignItems: 'center', justifyContent: 'center' },
  artCircle: { position: 'absolute', width: 134, height: 134, borderRadius: 67, backgroundColor: colors.pale },
  dot: { position: 'absolute', width: 12, height: 12, borderRadius: 6 },
  lock: { width: 76, height: 101, transform: [{ rotate: '-10deg' }] },
  shackle: { width: 48, height: 53, borderWidth: 9, borderColor: '#A8A3D7', borderTopLeftRadius: 26, borderTopRightRadius: 26, alignSelf: 'center' },
  lockBody: { position: 'absolute', bottom: 0, width: 76, height: 64, borderRadius: 13, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  keyhole: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.white },
  keyStem: { width: 5, height: 11, backgroundColor: colors.white, marginTop: -3, borderRadius: 2 },
  phone: { width: 64, height: 115, borderWidth: 4, borderColor: colors.primary, borderRadius: 12, backgroundColor: colors.white, alignItems: 'center', paddingTop: 8, transform: [{ rotate: '9deg' }] },
  speaker: { width: 20, height: 3, backgroundColor: '#A8A3D7', borderRadius: 2, marginBottom: 9 },
  avatar: { width: 33, height: 33, borderRadius: 17, backgroundColor: colors.pale, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: 8 },
  avatarHead: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#A8A3D7' },
  avatarBody: { width: 22, height: 13, borderRadius: 10, backgroundColor: '#A8A3D7', marginTop: 2 },
  phoneLine: { width: 39, height: 4, borderRadius: 2, backgroundColor: '#E0E0E0', marginBottom: 5 },
  phoneButton: { width: 39, height: 10, borderRadius: 3, backgroundColor: colors.primary, marginTop: 4 },
  envelope: { width: 100, height: 68, borderRadius: 10, backgroundColor: '#A8A3D7', overflow: 'hidden', transform: [{ rotate: '-8deg' }] },
  flap: { width: 76, height: 76, borderWidth: 3, borderColor: colors.primary, transform: [{ rotate: '45deg' }], position: 'absolute', top: -48, left: 12, backgroundColor: colors.pale },
  successArt: { width: 78, height: 78, borderRadius: 39, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  successCheck: { fontSize: 44, color: colors.white, fontWeight: '700' },
  field: { marginBottom: 18 }, label: { color: colors.ink, fontSize: 14, fontWeight: '600', marginBottom: 9 },
  inputRow: { flexDirection: 'row', borderWidth: 1, borderColor: colors.line, backgroundColor: colors.white, borderRadius: 13, minHeight: 56, alignItems: 'center' },
  input: { flex: 1, paddingHorizontal: 15, paddingVertical: 15, color: colors.ink, fontSize: 16, minWidth: 0 },
  inputFocus: { borderColor: colors.primary, backgroundColor: colors.white, borderWidth: 2 },
  inputError: { borderColor: colors.error }, reveal: { paddingHorizontal: 14, minHeight: 48, justifyContent: 'center' },
  revealText: { fontSize: 12, fontWeight: '700', color: colors.primary },
  fieldError: { color: colors.error, fontSize: 12, lineHeight: 18, marginTop: 6 },
  button: { minHeight: 56, backgroundColor: colors.primary, borderRadius: 14, flexDirection: 'row', gap: 10, alignItems: 'center', justifyContent: 'center', padding: 14, marginVertical: 9 },
  buttonText: { color: 'white', fontSize: 16, fontWeight: '700', textAlign: 'center' },
  secondaryButton: { backgroundColor: colors.pale, borderWidth: 1, borderColor: '#DAD6F1' },
  disabled: { opacity: 0.46 }, pressed: { opacity: 0.72 }, link: { minHeight: 48, alignItems: 'center', justifyContent: 'center', paddingVertical: 12 },
  linkText: { color: colors.primary, fontSize: 14, fontWeight: '600', textAlign: 'center' },
  message: { padding: 15, borderRadius: 12, backgroundColor: colors.pale, marginBottom: 16 },
  messageText: { color: colors.primary, lineHeight: 21, fontSize: 14 },
  errorMessage: { backgroundColor: '#FFF0ED' }, checklist: { gap: 6, marginTop: -5, marginBottom: 20 },
  rule: { fontSize: 12, lineHeight: 18, color: colors.muted },
  terms: { flexDirection: 'row', alignItems: 'center', gap: 11, minHeight: 48, marginVertical: 4 },
  checkbox: { width: 23, height: 23, borderRadius: 6, borderWidth: 1.5, borderColor: '#9CA8BD', alignItems: 'center', justifyContent: 'center' },
  termsText: { color: colors.muted, fontSize: 13, lineHeight: 20, flex: 1 },
  footnote: { textAlign: 'center', fontSize: 11, color: '#7A8497', marginTop: 36, marginBottom: 10 },
  emailCard: { padding: 22, borderRadius: 16, backgroundColor: '#F2F1F9', marginBottom: 22, borderWidth: 1, borderColor: colors.line },
  emailText: { fontSize: 16, color: colors.ink, fontWeight: '600', textAlign: 'center' },
});




import React, { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type TextInputProps, type TextStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { passwordRules } from '../auth/rules';
import { useAuth } from '../auth/AuthProvider';

// React Native types omit CSS outlineStyle='none'; apply this only on web.
const webInputStyle = { outlineStyle: 'none' } as unknown as TextStyle;
export const colors = { primary: '#2159D8', ink: '#14213D', muted: '#626D82', line: '#DAE0EB', pale: '#EEF3FF', error: '#B42318', success: '#147D54', white: '#FFFFFF' };
export function Page({ title, subtitle, children, back, emblem = '↗' }: React.PropsWithChildren<{ title: string; subtitle: string; back?: () => void; emblem?: string }>) {
  const { state, configured } = useAuth();
  return <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.scroll}>
        <View style={s.page}>
          <View style={s.top}>
            {back ? <Pressable accessibilityRole="button" accessibilityLabel="Volver" disabled={state.busy} onPress={back} style={({ pressed }) => [s.back, pressed && s.pressed]}><Text style={s.backText}>‹</Text></Pressable> : <View style={s.brandMark}><Text style={s.brandMarkText}>i</Text></View>}
            <Text style={s.brand}>iBank<Text style={{ color: colors.primary }}>.</Text></Text>
          </View>
          <View style={s.heading}>
            <View style={s.emblem}><Text style={s.emblemText}>{emblem}</Text></View>
            <Text accessibilityRole="header" style={s.title}>{title}</Text>
            <Text style={s.subtitle}>{subtitle}</Text>
          </View>
          {!configured && <Message text="La conexión de iBank todavía no está configurada. Los formularios están disponibles para revisión." />}
          {children}
          <Text style={s.footnote}>iBank · Tu próximo paso empieza acá</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>;
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
  safe: { flex: 1, backgroundColor: colors.white }, scroll: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 20 },
  page: { width: '100%', maxWidth: 440, alignSelf: 'center', flexGrow: 1 },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, marginBottom: 32 },
  brand: { fontSize: 27, fontWeight: '800', color: colors.ink, letterSpacing: -1 },
  brandMark: { width: 38, height: 38, borderRadius: 12, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  brandMarkText: { color: 'white', fontSize: 29, fontWeight: '800', fontStyle: 'italic' },
  back: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center', borderRadius: 14, borderWidth: 1, borderColor: colors.line },
  backText: { fontSize: 34, color: colors.ink, lineHeight: 37 },
  heading: { marginBottom: 28 }, emblem: { width: 58, height: 58, borderRadius: 19, backgroundColor: colors.pale, alignItems: 'center', justifyContent: 'center', marginBottom: 22 },
  emblemText: { color: colors.primary, fontSize: 29, fontWeight: '700' },
  title: { color: colors.ink, fontSize: 31, lineHeight: 39, fontWeight: '700', letterSpacing: -0.8, marginBottom: 10 },
  subtitle: { color: colors.muted, fontSize: 15, lineHeight: 23 },
  field: { marginBottom: 18 }, label: { color: colors.ink, fontSize: 14, fontWeight: '600', marginBottom: 9 },
  inputRow: { flexDirection: 'row', borderWidth: 1, borderColor: colors.line, backgroundColor: '#FAFBFD', borderRadius: 13, minHeight: 56, alignItems: 'center' },
  input: { flex: 1, paddingHorizontal: 15, paddingVertical: 15, color: colors.ink, fontSize: 16, minWidth: 0 },
  inputFocus: { borderColor: colors.primary, backgroundColor: colors.white, borderWidth: 2 },
  inputError: { borderColor: colors.error }, reveal: { paddingHorizontal: 14, minHeight: 48, justifyContent: 'center' },
  revealText: { fontSize: 12, fontWeight: '700', color: colors.primary },
  fieldError: { color: colors.error, fontSize: 12, lineHeight: 18, marginTop: 6 },
  button: { minHeight: 56, backgroundColor: colors.primary, borderRadius: 14, flexDirection: 'row', gap: 10, alignItems: 'center', justifyContent: 'center', padding: 14, marginVertical: 9 },
  buttonText: { color: 'white', fontSize: 16, fontWeight: '700', textAlign: 'center' },
  secondaryButton: { backgroundColor: colors.pale, borderWidth: 1, borderColor: '#D9E4FF' },
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
  emailCard: { padding: 22, borderRadius: 16, backgroundColor: '#F6F8FD', marginBottom: 22, borderWidth: 1, borderColor: colors.line },
  emailText: { fontSize: 16, color: colors.ink, fontWeight: '600', textAlign: 'center' },
});




import React, { useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthProvider, useAuth } from './src/auth/AuthProvider';
import { Button, colors, Message, Page } from './src/components/ui';
import { HomeScreen, LoginScreen, NewPasswordScreen, PendingScreen, RecoverScreen, RegisterScreen, type Routes } from './src/screens/AuthScreens';
const Stack = createNativeStackNavigator<Routes>();
function Root() {
  const { state, controller } = useAuth();
  const [requestRecovery, setRequestRecovery] = useState(false);
  const [error, setError] = useState('');
  if (!state.ready || state.processingLink) return <View accessibilityLabel="Cargando sesión" style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'white' }}><ActivityIndicator size="large" color={colors.primary} /></View>;
  if (state.fatalError) return <Page title="No pudimos continuar" subtitle="Necesitamos volver a comprobar tu sesión."><Message text={state.fatalError} error /></Page>;
  if (state.linkError) return <Page title="Necesitás un enlace nuevo" subtitle="El enlace no se pudo verificar." emblem="!">
    <Message text={state.linkError} error /><Message text={error} error />
    <Button title="Pedir otro enlace" loading={state.busy} onPress={() => {
      setError('');
      setRequestRecovery(true);
      void controller?.dismissLinkError().catch(() => setError('No pudimos cerrar la sesión temporal. Volvé a intentar.'));
    }} />
  </Page>;
  // Conditional screen groups remove the opposite stack, including its history.
  // Recovery has priority over normal authenticated navigation.
  return <NavigationContainer onReady={() => setRequestRecovery(false)}>
    <Stack.Navigator initialRouteName={state.recovery && state.session ? 'NewPassword' : state.session ? 'Home' : requestRecovery ? 'Recover' : 'Login'} screenOptions={{ headerShown: false, gestureEnabled: !state.busy, animation: 'slide_from_right', contentStyle: { backgroundColor: 'white' } }}>
      {state.recovery && state.session ? <Stack.Group navigationKey="recovery">
        <Stack.Screen name="NewPassword" component={NewPasswordScreen} options={{ gestureEnabled: false }} />
      </Stack.Group> : state.session ? <Stack.Group navigationKey="private">
        <Stack.Screen name="Home" component={HomeScreen} />
      </Stack.Group> : <Stack.Group navigationKey="public">
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Recover" component={RecoverScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Pending" component={PendingScreen} />
      </Stack.Group>}
    </Stack.Navigator>
  </NavigationContainer>;
}
export default function App() {
  return <SafeAreaProvider><StatusBar style="dark" /><AuthProvider><Root /></AuthProvider></SafeAreaProvider>;
}

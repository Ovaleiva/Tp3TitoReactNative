# TP3 · iBank × Supabase

> **Pendiente al retomar:** corregir emails/deep links y configuración de Supabase, y ajustar el diseño al Figma real. Ver [lista de pendientes](docs/PENDIENTES.md). El TP todavía no está listo para entregar.

Cinco pantallas de autenticación en español con Expo SDK 57, React Native y Supabase Auth v2, más Home protegida.

## Ejecutar

Requiere Node.js 22.13 o posterior compatible con Expo 57.

```powershell
npm ci
npm start
```

En este equipo ya están configuradas la URL y la clave pública suministradas en `.env`, excluido de Git. En un clon nuevo, copiar `.env.example` a `.env` y completar:

| Variable | Contenido |
| --- | --- |
| EXPO_PUBLIC_SUPABASE_URL | URL del proyecto |
| EXPO_PUBLIC_SUPABASE_ANON_KEY | Clave publishable o anon |

Nunca usar claves secret o service_role. EXPO_PUBLIC se incluye en el bundle y solo admite configuración pública.

```powershell
npm run android
npm run ios
npm run web
npm run typecheck
npm test
npx expo export --platform all
```

Android requiere dispositivo/emulador; el simulador iOS requiere macOS.

## Funcionalidad

- Login: email válido, contraseña no vacía, error genérico, confirmación pendiente y cooldown ante 429.
- Registro: nombre, email, checklist de contraseña, confirmación exacta y términos.
- Confirmación pendiente: email no editable y reenvío con espera de 60 segundos.
- Recuperación: respuesta neutra para cuentas existentes e inexistentes.
- Nueva contraseña: callback verificado y evento PASSWORD_RECOVERY obligatorio; updateUser y signOut.
- Home: sesión restaurada, usuario y logout.

Hay carga inicial sin parpadeo de Login, inputs/botones bloqueados durante requests, eliminación de historial entre flujos y limpieza de contraseñas al salir de los formularios.

## Deep links

Configurar [Supabase](docs/SUPABASE.md) antes de probar emails reales.

```text
ibanktp://confirm
ibanktp://reset-password
```

Linking.createURL genera variantes exp:// para Expo Go y http(s):// para web; también deben estar permitidas. PKCE exige solicitar y abrir el email en la misma instalación o navegador, conservando su almacenamiento. Se utiliza exchangeCodeForSession y se transmite sb_flow_id cuando aparece.

El scheme propio requiere una build nativa instalada que lo registre. Expo Go no registra ibanktp. No se generó una build nativa instalable.

## Pruebas de navegador

```powershell
npx playwright install chromium
npm run test:web
```

Si hay Chrome instalado:

```powershell
$env:BROWSER_CHANNEL = 'chrome'
npm run test:web
```

El script exporta web, sirve dist localmente, simula las respuestas de Supabase y guarda capturas. No crea usuarios ni envía emails.

[Informe de validación](docs/PRUEBAS.md) · [Capturas](docs/screenshots/README.md) · [Decisiones](docs/DECISIONES.md)

## Organización

- src/lib/supabase.ts: cliente único, AsyncStorage, PKCE y processLock.
- src/auth/controller.ts: sesión, requests, errores y cooldowns.
- src/auth/AuthProvider.tsx: ciclo de vida y deep links.
- src/auth/rules.ts y links.ts: validaciones.
- src/components/ui.tsx: controles reutilizables.
- src/screens/AuthScreens.tsx: formularios y Home.
- App.tsx: grupos de navegación protegidos.

## Pendiente para la entrega completa

Fidelidad al Figma (respondió 403), configuración privada del dashboard, emails reales y prueba Android/iOS en dispositivo. La generación de bundles no equivale a ejecutar la app en un teléfono.

## Referencias

[Expo SDK 57](https://docs.expo.dev/versions/v57.0.0/), [Linking 57](https://docs.expo.dev/versions/v57.0.0/sdk/linking/), [Supabase React Native](https://supabase.com/docs/guides/auth/quickstarts/react-native), [eventos Auth](https://supabase.com/docs/reference/javascript/auth-onauthstatechange), [React Navigation auth](https://reactnavigation.org/docs/auth-flow/).


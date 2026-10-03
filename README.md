# TP3 · iBank × Supabase

Proyecto React Native con Expo SDK 57 y Supabase Auth. Incluye cinco pantallas de autenticación en español y una pantalla principal protegida.

## Instalación

Requisitos:

- Node.js 22.19.0, versión usada durante las pruebas.
- npm.
- Expo Go instalado en el teléfono.
- Una cuenta de Expo, iniciada tanto en la computadora como en Expo Go.

Desde la carpeta del proyecto:

```powershell
npm ci
```

## Variables de entorno

Crear un archivo `.env` en la raíz del proyecto:

```dotenv
EXPO_PUBLIC_SUPABASE_URL=https://TU-PROYECTO.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=TU_CLAVE_PUBLICA
EXPO_PUBLIC_USE_RN_FETCH=1
```

| Variable | Uso |
| --- | --- |
| `EXPO_PUBLIC_SUPABASE_URL` | Dirección del proyecto de Supabase |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Clave pública publishable o anon |
| `EXPO_PUBLIC_USE_RN_FETCH` | Utiliza el fetch de React Native en lugar del global de Expo |

El archivo `.env` está excluido de Git. Nunca usar claves secret o service_role: las variables `EXPO_PUBLIC_*` son visibles en el cliente.

## Ejecutar con Expo Go

Iniciar sesión en Expo desde el navegador:

```powershell
npx expo login --browser
```

Comprobar la cuenta e iniciar el proyecto:

```powershell
npx expo whoami
npx expo start --tunnel -c
```

Escanear el QR con el teléfono. Expo Go debe usar la misma cuenta que Expo CLI.

Si el inicio de sesión de la CLI falla, se puede utilizar un token personal de Expo en la terminal:

```powershell
$env:EXPO_TOKEN = 'TU_TOKEN_PERSONAL'
npx expo start --tunnel -c
```

El token no debe incluirse en `.env`, archivos del proyecto, capturas ni repositorio. Esta variable dura únicamente durante la sesión actual de PowerShell.

Otras opciones:

```powershell
npm run android
npm run ios
npm run web
```

El simulador iOS requiere macOS. La configuración de redirects web debe adaptarse al origen donde se ejecute.

## Pantallas y funcionalidad

1. **Login:** acceso con email y contraseña; manejo de credenciales incorrectas y correo sin confirmar.
2. **Registro:** nombre, email, contraseña, confirmación y aceptación de términos.
3. **Confirmación pendiente:** instrucciones y reenvío de correo con pausa local de 60 segundos.
4. **Recuperación:** solicitud de correo con respuesta neutra.
5. **Nueva contraseña:** validación, actualización y cierre de la sesión temporal.

La pantalla principal requiere una sesión y permite cerrar sesión.

Los formularios bloquean los controles durante las solicitudes. El procesamiento de enlaces espera a que la app esté activa y permite hasta dos reintentos adicionales ante fallas de transporte durante el intercambio PKCE. Estos reintentos no solicitan nuevos correos.

## Configuración de Supabase

En **Authentication → Sign In / Providers → Email**:

| Ajuste | Valor utilizado |
| --- | --- |
| Email | Habilitado |
| Registro de usuarios | Habilitado |
| Confirmación de email | Obligatoria |
| Contraseña mínima | 8 caracteres |
| Complejidad | Mayúscula, minúscula, número y símbolo |
| Expiración del enlace/email OTP | 3600 segundos |
| SMTP propio | Desactivado |

La política de contraseña del servidor fue alineada con la validación de la app.

Se conservaron los límites observados del proyecto:

- Correos: **2 por hora para todo el proyecto**.
- Registro y login: **30 solicitudes por 5 minutos por IP**.
- Verificación de tokens: **30 solicitudes por 5 minutos por IP**.
- Renovación de tokens: **150 solicitudes por 5 minutos por IP**.

La pausa local de 60 segundos no elimina un bloqueo horario del servidor. La app distingue el mensaje del límite de envío de correos de otros límites de solicitudes.

La protección de contraseñas filtradas está desactivada; el dashboard la ofrece para planes Pro o superiores.

### URLs configuradas

En **Authentication → URL Configuration**:

```text
Site URL:
http://localhost:3000

Redirect URLs:
exp://**
ibanktp://**
ibanktp://confirm
ibanktp://reset-password
```

Los comodines permiten las direcciones variables de Expo Go durante el desarrollo. Esta configuración debe restringirse antes de un despliegue de producción.

`http://localhost:3000` es el destino de respaldo configurado; no corresponde a una web publicada ni al servidor de Expo del proyecto. Los flujos móviles probados envían su propio destino mediante `Linking.createURL`.

Las plantillas predeterminadas de confirmación y recuperación utilizan `{{ .ConfirmationURL }}`.

### Deep links y PKCE

Los correos deben solicitarse y abrirse en la misma instalación que inició el flujo, conservando su almacenamiento.

Expo Go utiliza direcciones `exp://`. El esquema `ibanktp://` requiere una build nativa que lo registre; no se generó una build instalable para esta entrega.

## Validación

```powershell
npm run typecheck
npm test
```

TypeScript y las 22 pruebas locales pasaron durante la revisión de la corrección de conexión.

Se completaron y grabaron en un iPhone con Expo Go:

- Registro y confirmación por correo.
- Acceso a la pantalla principal.
- Cierre de sesión y nuevo login.
- Recuperación y cambio de contraseña.
- Login con la contraseña nueva.

Las pruebas automatizadas utilizan respuestas simuladas y no envían correos. La validación móvil corresponde a los flujos ejecutados por el autor; no implica validación en Android o en una build nativa.

Pruebas web opcionales:

```powershell
npx playwright install chromium
npm run test:web
```

## Diseño y decisiones

La interfaz está adaptada al español y a los requisitos de autenticación del TP. La comparación con el Figma original identificó diferencias pendientes en cabecera, colores, ilustraciones, tipografía y medidas. No se afirma una reproducción visual exacta.

Consultar:

- [Decisiones de diseño y alcance](docs/DECISIONES.md)
- [Configuración de Supabase](docs/SUPABASE.md)
- [Informe de pruebas](docs/PRUEBAS.md)
- [Pendientes](docs/PENDIENTES.md)

## Organización

- `src/lib/supabase.ts`: cliente Supabase y transporte.
- `src/auth/controller.ts`: operaciones y estado de autenticación.
- `src/auth/AuthProvider.tsx`: ciclo de vida y recepción de enlaces.
- `src/auth/pkceFetch.ts`: reintentos limitados del transporte PKCE.
- `src/auth/rules.ts`: validaciones y mensajes de error.
- `src/auth/links.ts`: validación de callbacks.
- `src/components/ui.tsx`: controles reutilizables.
- `src/screens/AuthScreens.tsx`: pantallas.
- `tests/`: pruebas automatizadas.

## Fuera de alcance y pendientes

No se incluye publicación web, build nativa instalable, biometría ni configuración de un proveedor SMTP propio.

Queda pendiente completar la fidelidad visual al Figma y verificar casos adicionales, como enlaces vencidos y reinicio durante recuperación. Los documentos complementarios deben reflejar el estado actual y acompañar las capturas o grabaciones de la entrega.
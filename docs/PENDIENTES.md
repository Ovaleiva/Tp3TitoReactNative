# Pendientes para retomar · TP3 iBank

Actualizado: 10 de septiembre de 2026.

El usuario decidió posponer estas correcciones y guardar el avance en Git. Recordarlas al retomar el proyecto con el asistente. Subir el código no significa que el TP esté listo para entregar.

## 1. Emails y deep links reales

La captura enviada muestra:
- Destino: localhost:3000.
- Parámetros de error: access_denied y otp_expired.
- Descripción: Email link is invalid or has expired.
- El navegador muestra ERR_CONNECTION_REFUSED.

Esto documenta un enlace inválido/vencido y un destino sin conexión. No demuestra por sí solo cuál fue la causa original ni que la allowlist sea la única causa.

Pendiente:
- Revisar Site URL, Redirect URLs y las plantillas de correo.
- Verificar las rutas ibanktp://confirm e ibanktp://reset-password para la build nativa.
- Verificar las variantes reales de Expo Go o web según dónde se pruebe.
- Pedir enlaces nuevos y comprobar confirmación y recuperación de punta a punta en la misma instalación/navegador que inició PKCE.
- Confirmar que el reset termina en Login después de actualizar y cerrar la sesión temporal.

## 2. Dashboard de Supabase

Anteriormente solo se comprobó por el endpoint público que email/registro estaban habilitados y Confirm email activo. No se configuró ni auditó el dashboard completo.

Pendiente verificar y documentar:
- Confirm email activo.
- Política: mínimo 8 caracteres, mayúscula, minúscula, dígito y símbolo, coincidente con el cliente.
- Rate limits y cooldown de 60 segundos.
- Expiración de enlaces/OTP.
- Redirect URLs, SMTP y restricciones del proveedor de correo.
- Protección de contraseñas filtradas, si el plan lo permite.

## 3. Fidelidad visual al Figma

El archivo respondió 403 durante los intentos anteriores. La interfaz actual es provisional; no se extrajeron sus valores exactos.

Pendiente inspeccionar Dev Mode o el panel de propiedades:
- Paleta hexadecimal.
- Familias y pesos tipográficos.
- Radios, márgenes y espaciados.
- Estados vacío, foco, error, deshabilitado y cargando de inputs/botones.
- Ajustar las cinco pantallas y comparar con los frames reales.

## 4. Prueba móvil

También quedó sin diagnosticar el mensaje de Expo Go: “There was a problem running the requested project”. Falta el detalle del error y saber si el dispositivo es Android o iPhone. No dar por confirmado que se resuelve con un túnel.

Los bundles y las pruebas web simuladas pasaron, pero falta una prueba real en dispositivo y con emails.

## Git

Repositorio indicado por el usuario: https://github.com/Ovaleiva/Tp3TitoReactNative. Mantener .env excluido de Git; versionar únicamente .env.example como plantilla de configuración.

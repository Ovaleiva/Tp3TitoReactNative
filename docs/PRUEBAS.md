# Verificación · 9 de septiembre de 2026

## Automatizado

- TypeScript estricto: npm run typecheck.
- 18 pruebas: npm test.
- Dependencias compatibles: npx expo install --check.
- Bundles Android, iOS y web: expo export.
- Chrome headless: cinco pantallas y flujo con HTTP simulado.

Las pruebas de Node cubren reglas de contraseña/email, errores neutros, cooldown por email normalizado, doble envío, restauración de sesión, confirmación, recuperación interrumpida, link inválido, evento PASSWORD_RECOVERY obligatorio y cierre posterior a updateUser. Una usa el SDK Supabase instalado y simula solo HTTP para comprobar su evento PKCE real.

La prueba web comprueba login deshabilitado/error, términos obligatorios, confirmación y cooldown, reset neutro, callback PKCE, nueva contraseña, Login posterior al reset, Home, persistencia al recargar, logout y link vencido con nueva solicitud. Resumen en screenshots/verification.json.

## Servicio real

La consulta pública a Supabase respondió 200 y confirmó email/registro habilitados y Confirm email activo. No se crearon usuarios ni enviaron correos reales.

## Límites

No se ejecutó en Android/iOS: exportar verifica bundling, no la app nativa ni el registro del scheme. No se comprobó SMTP ni allowlist privada. Las capturas usan datos ficticios. La revisión visual comprueba composición y legibilidad locales, no fidelidad al Figma inaccesible.

Ver [configuración y prueba manual](SUPABASE.md) antes de marcar la Definition of Done completa.


## Auditoría de dependencias

npm audit reportó 16 avisos moderados, sin avisos altos ni críticos, en las cadenas de dependencias de Expo y React Navigation. Permanecen pendientes. No se aplicó npm audit fix --force: la propuesta para Expo incluía volver a SDK 46, incompatible con el requisito SDK 57. Conviene revisar los avisos al actualizar las versiones compatibles.

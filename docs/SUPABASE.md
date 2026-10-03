# Configuración de Supabase

Proyecto local: saiyowbhhlwfyaxjragg.

## Verificado el 9 de septiembre de 2026

Consulta de solo lectura a /auth/v1/settings con la clave pública:

- HTTP 200.
- Email habilitado.
- Confirm email activo (mailer_autoconfirm: false).
- Registro habilitado (disable_signup: false).

No se modificó el dashboard. La clave pública no permite administrarlo.

## Revisar en Authentication

| Ajuste | Valor esperado | Estado |
| --- | --- | --- |
| Confirm email | Activo | Verificado |
| Longitud mínima | 8 caracteres | Pendiente en dashboard |
| Complejidad | Mayúscula, minúscula, número, símbolo | Pendiente en dashboard |
| Expiración email/OTP | 3600 segundos o menos | Pendiente |
| Cooldown | 60 segundos por email | Implementado en UI; comprobar backend |
| Redirect URLs | Lista siguiente | Pendiente |
| SMTP | Ver proveedor y destinatarios permitidos; custom SMTP para uso real | Pendiente |
| Contraseñas filtradas | Activar si el plan lo permite | Pendiente |
| CAPTCHA | Bonus no implementado | Fuera del alcance obligatorio |

Los símbolos siguen la lista de [Supabase](https://supabase.com/docs/guides/auth/password-security). Si cambia el mínimo, actualizar PASSWORD_MIN_LENGTH y su etiqueta en src/auth/rules.ts.

El cooldown local usa timestamps, se conserva al navegar y funciona al volver de background. Se reinicia al cerrar el proceso. No sustituye los [límites del servidor](https://supabase.com/docs/guides/auth/rate-limits); un límite horario puede continuar luego de 60 segundos.

## Redirect URLs

Agregar en Authentication → URL Configuration:

```text
ibanktp://confirm
ibanktp://reset-password
```

Si el SDK añade sb_flow_id y la allowlist requiere contemplar el query string, agregar los patrones acotados:

```text
ibanktp://confirm?sb_flow_id=*
ibanktp://reset-password?sb_flow_id=*
```

Para web local en puerto 8081:

```text
http://localhost:8081/confirm
http://localhost:8081/reset-password
http://localhost:8081/confirm?sb_flow_id=*
http://localhost:8081/reset-password?sb_flow_id=*
```

Expo Go usa la IP y el puerto de Expo, por ejemplo exp://192.168.1.10:8081/--/confirm y exp://192.168.1.10:8081/--/reset-password. Adaptarlos a la red real y agregar la variante sb_flow_id si corresponde. Para una web alojada, usar el origen real y servir la app en ambas rutas.

La validación local exige esquema, host y ruta exactos. Consultar [Redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls) y [deep linking](https://supabase.com/docs/guides/auth/native-mobile-deep-linking).

## Plantillas y PKCE

Mantener las plantillas estándar con {{ .ConfirmationURL }} y el redirect del cliente. No reemplazarlas por fragmentos con access_token/refresh_token. Los enlaces deben solicitarse desde esta app y abrirse en la misma instalación/navegador, conservando el verificador PKCE. Si se borró el storage o venció el enlace, pedir otro.

## Prueba real pendiente

1. Registrar un email propio y comprobar la pantalla pendiente y el cooldown.
2. Abrir confirmación en la misma app: Home.
3. Cerrar/reabrir: debe conservar la sesión.
4. Logout y contraseña incorrecta: mensaje genérico.
5. Solicitar reset: mensaje neutro.
6. Abrir el enlace: Nueva contraseña, sin Home.
7. Guardar: Login con éxito y sin sesión temporal.
8. Probar un link vencido y solicitar otro.
9. Reiniciar durante recuperación: nunca debe restaurar Home.


# Verificación · TP3 iBank

Actualizado: 3 de octubre de 2026.

## Pruebas automatizadas

Después de aplicar la corrección del transporte PKCE se verificaron:

- TypeScript estricto: sin errores.
- 22 pruebas automatizadas: aprobadas.
- Coincidencia de los siete archivos importados con la corrección preparada.

Las pruebas cubren validaciones de email y contraseña, mensajes de error, cooldown, doble envío, restauración de sesión, confirmación, recuperación y cierre de la sesión temporal.

También comprueban que el transporte PKCE espera antes del intercambio, reintenta fallas de conexión con un límite de tres intentos totales y no reintenta respuestas HTTP de error, envíos de correo ni cancelaciones explícitas.

Una prueba utiliza el SDK Supabase instalado con HTTP simulado: reproduce una falla de conexión, verifica el reintento conservando el verificador PKCE y completa recuperación, actualización de contraseña y cierre de sesión.

Estas pruebas no crean usuarios ni envían correos reales.

## Verificación final después de actualizar dependencias

Se actualizaron Expo y Expo Linking a las versiones compatibles indicadas por Expo CLI. Luego se aplicó `npm audit fix` sin `--force`.

Después de esos cambios y de actualizar el mensaje de límite de solicitudes, se ejecutaron nuevamente:

```powershell
npm run typecheck
npm test
npx expo install --check
```

Resultados:

| Control | Resultado |
| --- | --- |
| TypeScript | Sin errores |
| Pruebas automatizadas | 22 aprobadas, 0 fallidas |
| Compatibilidad de dependencias | Dependencies are up to date |

Los mensajes `CONFIRM LINK ERROR` durante las pruebas corresponden a errores simulados intencionalmente. Los avisos `MODULE_TYPELESS_PACKAGE_JSON` no impidieron su ejecución.

Estos controles no enviaron correos ni consumieron el cupo de Supabase. No se repitieron las pruebas móviles después de actualizar las dependencias.

## Prueba real en iPhone

El autor informó que completó y grabó los siguientes pasos en Expo Go:

1. Registro con nombre, correo y contraseña.
2. Confirmación del email desde el mismo iPhone.
3. Acceso a la pantalla principal.
4. Cierre de sesión.
5. Login con el correo confirmado y la contraseña original.
6. Recuperación por correo y cambio de contraseña.
7. Login con la contraseña nueva.

Los flujos principales funcionaron después de aplicar la corrección del transporte PKCE. Esto documenta el resultado observado, pero no confirma de manera concluyente la causa original de la falla de conexión.

Las grabaciones forman parte de la evidencia de entrega y se enlazan desde el README. El asistente no inspeccionó su contenido.

## Revisión de Supabase

Se inspeccionó el dashboard del proyecto y se verificó:

- Registro y proveedor Email habilitados.
- Confirmación de email obligatoria.
- Expiración del enlace/email OTP: 3600 segundos.
- Proveedor SMTP propio desactivado.
- Límite de envío: 2 correos por hora para todo el proyecto.
- Plantillas predeterminadas de confirmación y recuperación con `{{ .ConfirmationURL }}`.
- Site URL y lista de redirects documentadas en [SUPABASE.md](SUPABASE.md).

Durante la auditoría se detectó una política de contraseña de 6 caracteres sin complejidad seleccionada. Posteriormente, el autor informó que la alineó con la app: mínimo 8 caracteres, mayúscula, minúscula, número y símbolo.

La auditoría no envió correos ni modificó ajustes. La protección de contraseñas filtradas requiere un plan Pro o superior y no se activó.

## Verificaciones históricas

El informe del 9 de septiembre de 2026 registró:

- Compatibilidad de dependencias mediante `npx expo install --check`.
- Exportación de bundles Android, iOS y web.
- Pruebas en Chrome headless con HTTP simulado.

La prueba web cubrió las cinco pantallas, validaciones, términos, confirmación, recuperación, navegación, persistencia al recargar, logout y enlace vencido. El resumen histórico se encuentra en `screenshots/verification.json`.

La compatibilidad de dependencias se volvió a comprobar en la verificación final. Las exportaciones y las pruebas web históricas no se repitieron después de todos los cambios recientes.

Exportar bundles no equivale a ejecutar la app en un dispositivo.

## Revisión visual

Se pudo abrir el Figma original e inspeccionar visualmente las pantallas Sign in, Sign up y la página de estilos.

Se identificaron diferencias respecto de la implementación en cabecera, paleta, ilustraciones, tipografía y geometría. No se afirma fidelidad visual exacta. Las adaptaciones se describen en [DECISIONES.md](DECISIONES.md).

## Límites de la validación

No se verificaron recientemente:

- Ejecución en Android o en una build nativa instalable.
- Registro del esquema `ibanktp://` en una build propia.
- Persistencia móvil después de cerrar y reabrir completamente el proceso.
- Enlace real vencido o reutilizado.
- Reinicio de la app durante recuperación.
- Todos los estados visuales de error, foco, carga y deshabilitado.
- Ejecución móvil posterior a la última actualización de dependencias.

Los flujos de error tienen cobertura automatizada, pero debe comprobarse que la evidencia audiovisual de entrega incluya las cinco pantallas y los casos de error y éxito más relevantes.

## Auditoría de dependencias

La auditoría previa reportó 31 avisos: 10 moderados y 21 altos. Después de aplicar `npm audit fix`, quedaron **27 avisos: 7 moderados y 20 altos**.

Los avisos restantes afectan cadenas de dependencias de Expo, Metro, React Native y las herramientas de túnel. El informe incluye casos sin corrección disponible y otros cuya solución automática con `--force` propone instalar Expo 44.0.6, incompatible con SDK 57.

No se aplicó `npm audit fix --force`. Queda pendiente evaluar soluciones compatibles para los avisos restantes.

Las pruebas aprobadas y la compatibilidad de versiones no eliminan estos hallazgos de seguridad.

## Documentación relacionada

- [Configuración de Supabase](SUPABASE.md)
- [Decisiones de implementación](DECISIONES.md)
- [Estado y pendientes](PENDIENTES.md)
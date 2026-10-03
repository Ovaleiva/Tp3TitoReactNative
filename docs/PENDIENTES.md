# Estado y pendientes · TP3 iBank

Actualizado: 3 de octubre de 2026.

## Resuelto o verificado

- Corregida la nulabilidad de Supabase en `AuthProvider.tsx`.
- Agregado logging mínimo del error real en `handleLink`.
- Aplicado transporte PKCE que espera al primer plano y permite hasta dos reintentos adicionales ante fallas de conexión.
- Diferenciadas las fallas de red de los enlaces inválidos.
- TypeScript y 22 pruebas locales aprobadas después de importar la corrección.
- Acceso a Expo CLI resuelto mediante un token en la terminal.
- Registro, confirmación, Home, logout, login, recuperación y login con contraseña nueva completados y grabados por el autor en un iPhone con Expo Go.
- Dashboard de Supabase revisado y configuración documentada.
- Política de contraseña alineada por el autor: mínimo 8 caracteres, mayúscula, minúscula, número y símbolo.
- Mensaje del límite de envío de correos actualizado por el autor para no prometer una espera de 60 segundos.
- README y documento de decisiones actualizados.
- Grabaciones o capturas agregadas y enlazadas por el autor desde el README.

Las pruebas exitosas en iPhone documentan el resultado de la corrección; la causa original de la falla de conexión no se confirmó de manera concluyente.

## 1. Fidelidad visual al Figma

El archivo original ya pudo abrirse. Se inspeccionaron visualmente Sign in, Sign up y la página de estilos.

Queda pendiente:

- Adaptar la cabecera violeta y el panel blanco con esquinas superiores redondeadas.
- Revisar ilustraciones y recursos gráficos.
- Verificar y ajustar colores, familia tipográfica, tamaños y pesos.
- Comparar radios, márgenes, espaciados y dimensiones.
- Revisar estados vacío, foco, error, deshabilitado y carga.
- Comparar las cinco pantallas con sus referencias.

Mientras estos puntos sigan pendientes, no afirmar una reproducción visual exacta.

## 2. Verificación final

Después de los últimos cambios:

```powershell
npm run typecheck
npm test
npx expo install --check
npm audit
```

Evaluar los resultados antes de cambiar dependencias. No aplicar actualizaciones forzadas sin comprobar su compatibilidad con Expo SDK 57.

Si se entrega soporte web, repetir también las pruebas web.

## 3. Evidencia de entrega

Comprobar que las capturas o grabaciones:

- Muestren las cinco pantallas.
- Incluyan confirmación y recuperación exitosas.
- Incluyan algún error relevante, como contraseña incorrecta o validación del formulario.
- No expongan contraseñas, tokens, claves ni enlaces de autenticación.
- Se puedan abrir desde los enlaces del README.

No solicitar nuevos correos únicamente para repetir evidencia que ya está disponible.

## 4. Variables de entorno y GitHub

- Comprobar que exista `.env.example` con valores ficticios y las variables requeridas.
- Mantener `.env`, tokens, `node_modules` y `.expo` fuera de Git.
- Revisar los cambios antes de subirlos.
- Subir el código, documentos y evidencia al repositorio.
- Comprobar que el README explique instalación, configuración y ejecución desde un clon nuevo.

Repositorio: https://github.com/Ovaleiva/Tp3TitoReactNative

## 5. Casos adicionales no verificados

Quedan como límites de la validación actual:

- Persistencia después de cerrar y reabrir el proceso en el iPhone.
- Enlace real vencido o reutilizado.
- Reinicio durante recuperación.
- Ejecución en Android.

La validación en una build nativa propia queda fuera de la modalidad de entrega actual.

## Configuración conservada para desarrollo

Se mantienen las URLs y el proveedor de correo que permitieron probar Expo Go. El límite observado es de 2 correos por hora para todo el proyecto.

El destino de respaldo `localhost:3000` y los comodines amplios de redirects deben revisarse antes de un despliegue de producción. No se configuró SMTP propio ni se publicó una web.

Subir el repositorio no sustituye las verificaciones pendientes ni completa por sí solo la fidelidad visual al Figma.
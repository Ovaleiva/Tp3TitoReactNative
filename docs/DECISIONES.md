# Decisiones de implementación

## Diseño y referencia de Figma

Se utilizó como referencia el [Figma iBank](https://www.figma.com/design/a5fhXOud8405KJTOMY2UAl/iBank---Banking---E-Money-Management-App?node-id=2-20347).

El acceso inicial respondió HTTP 403. Durante la revisión del 3 de octubre de 2026 se pudo abrir el archivo e inspeccionar visualmente las pantallas Sign in, Sign up y la página de estilos.

### Qué se tomó de la referencia

Se tomó como guía la organización de los formularios: cabecera violeta, panel blanco con esquinas superiores redondeadas, título y descripción, ilustración central, campos redondeados, acción principal y accesos entre pantallas.

La composición observada en Sign in y Sign up se adaptó al resto de las pantallas para mantener una identidad visual consistente. No se documenta ningún recurso como una copia exacta: no se verificaron todas las medidas, la fuente ni los recursos originales del Figma.

### Qué se adaptó y por qué

- **Idioma:** textos en español para la consigna y el público de la aplicación.
- **Registro con email:** se utiliza email como identificador de Supabase Auth, en lugar del teléfono visible en algunas pantallas del kit.
- **Confirmación y recuperación:** pantallas adaptadas a los estados reales de Supabase, con validaciones, mensajes y controles de reenvío.
- **Contraseña:** checklist de requisitos y confirmación exacta para orientar al usuario antes del envío.
- **Ilustraciones:** se reemplazaron los emblemas de texto por ilustraciones propias de candado, teléfono, correo y confirmación, construidas con componentes de React Native. Evitan agregar dependencias y no reproducen exactamente los recursos originales.
- **Paleta:** se reemplazó el azul anterior por violeta `#3629B7`, con fondos claros `#F2F1F9` y texto principal `#343434`. Se eligieron para acercar la apariencia a la referencia; no se afirma que todos sean valores extraídos o verificados del Figma.
- **Tipografía:** se conserva la fuente del sistema para mantener compatibilidad entre plataformas. No se afirma coincidencia con la familia tipográfica original.
- **Registro desplazable:** se conserva el desplazamiento para alojar el checklist, la confirmación de contraseña y los términos, y permitir el uso en pantallas pequeñas.

Los estilos están centralizados en `src/components/ui.tsx`. Se mantienen campos y botones de al menos 56 unidades de alto, márgenes horizontales de 24 y esquinas superiores del panel con radio de 28, expresados en unidades de React Native.

`ScrollView`, `KeyboardAvoidingView` y las áreas seguras permiten usar los formularios con el teclado abierto. Se incluyen etiquetas accesibles, anuncios de errores, foco visible y controles táctiles amplios. Las ilustraciones son decorativas y se excluyen de los lectores de pantalla.

El ajuste visual conserva las operaciones de autenticación, validaciones, estados de carga y navegación previamente probados.

### Límites de la fidelidad visual

Se adaptaron la cabecera, el panel, la familia de colores y las ilustraciones. La reproducción exacta de tipografía, recursos gráficos, medidas y todos los estados del Figma no se incluyó en este ajuste. La aplicación se presenta como una adaptación de la referencia, no como una copia visual exacta.

## Persistencia y sesión

Se utiliza AsyncStorage para persistir la sesión de Supabase. `processLock` coordina las operaciones de autenticación y la renovación automática se gestiona según el estado de la aplicación.

AsyncStorage no aporta cifrado del sistema. Para una evolución de producción se puede evaluar un adaptador de almacenamiento seguro.

No se persisten contraseñas ni se registran deliberadamente tokens, contraseñas o URLs completas de autenticación. El controller mantiene un registro del error de intercambio para diagnóstico.

## Confirmación y recuperación

Se utiliza PKCE para intercambiar el código del correo por una sesión, conservando el verificador en la instalación que inició la solicitud.

La ruta `reset-password` no habilita por sí sola el formulario: también debe recibirse el evento `PASSWORD_RECOVERY`. Un evento `SIGNED_IN` no sustituye esa condición.

Antes del intercambio se guarda una marca de procesamiento pendiente. Si el proceso se interrumpe, el siguiente inicio cierra la sesión local para impedir que una sesión temporal de recuperación abra Home. Si la limpieza falla, se muestra una barrera de error.

Después de cambiar la contraseña se cierra la sesión temporal y se vuelve a Login.

No se aceptan fragmentos con tokens mediante `setSession` para habilitar recuperación. Los enlaces deben abrirse en la misma instalación que inició el flujo.

En web se limpia el callback de la barra de direcciones para evitar un nuevo intercambio al recargar. Se reciben enlaces tanto al iniciar la aplicación como cuando ya está abierta.

## Fallas de conexión

Durante las pruebas en iPhone se observaron errores de cancelación y de conexión al intercambiar el código.

Se incorporó un transporte que:

- Espera a que la aplicación esté activa.
- Permite hasta dos reintentos adicionales ante fallas de transporte durante PKCE.
- No reintenta respuestas HTTP de error ni solicitudes de envío de correos.
- Ejecuta los reintentos antes de que el SDK descarte el verificador PKCE.

Los errores de conexión se distinguen de los enlaces inválidos o vencidos. Los flujos principales funcionaron posteriormente en la prueba del autor, aunque no se confirmó de manera concluyente la causa original de la falla.

## Límites y contraseñas

La app y Supabase exigen contraseñas de al menos 8 caracteres con mayúscula, minúscula, número y símbolo.

La pausa local de 60 segundos evita solicitudes consecutivas, pero no sustituye los límites del servidor. El mensaje del límite de envío de correos se diferencia de otros límites y no promete que el cupo se restablezca en 60 segundos.

Se conservó el proveedor de correo predeterminado de Supabase, con un límite observado de 2 correos por hora para todo el proyecto.

## Navegación y formularios

Se utiliza React Navigation con grupos condicionales para separar autenticación, Home y recuperación. La recuperación tiene prioridad mientras esté activa.

Las validaciones se implementan mediante funciones puras. El nombre se envía en `user_metadata.full_name`; no se agregó una tabla `profiles` porque no es necesaria para este alcance.

Los formularios bloquean controles durante las solicitudes y limpian las contraseñas al salir. La aceptación de términos forma parte del formulario académico; no implica la contratación de un servicio bancario real.

## Ejecución y validación

La modalidad utilizada fue Expo Go en un iPhone. El autor completó y grabó registro, confirmación de email, acceso a Home, logout, login, recuperación, cambio de contraseña y login con la contraseña nueva.

La grabación realizada antes del ajuste visual documenta los flujos funcionales de esa versión. Para la entrega, se complementa con capturas de las cinco pantallas del diseño final y de errores relevantes, como email inválido o contraseñas que no coinciden. Así se distingue la evidencia del funcionamiento de la evidencia de la apariencia actual. Las capturas deben incorporarse antes de entregar y enlazarse desde el README.

El ajuste visual se verificó con TypeScript, las 22 pruebas automatizadas y la prueba web de las cinco pantallas y sus flujos. Esta revisión usa HTTP simulado y no envía correos. La apariencia final debe revisarse también en el iPhone después de reemplazar los archivos.

Las pruebas automatizadas utilizan respuestas simuladas y no envían correos. Su resultado no sustituye las pruebas en dispositivo.

Los redirects amplios de Expo Go se conservaron para desarrollo. Deben restringirse al definir un entorno de producción.

## Fuera de alcance

- Login social, segundo factor, PIN, biometría y CAPTCHA.
- Operaciones bancarias y API propia.
- Publicación web y build nativa instalable.
- Configuración de un proveedor SMTP propio.
- Validación en Android.
- Reproducción exacta de la tipografía, ilustraciones y medidas del Figma.

Los elementos de banca y biometría presentes en el kit no se implementaron porque exceden el alcance de autenticación del TP.
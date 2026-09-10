# Decisiones

## Diseño provisional

El [Figma iBank](https://www.figma.com/design/a5fhXOud8405KJTOMY2UAl/iBank---Banking---E-Money-Management-App?node-id=2-20347) respondió HTTP 403 tanto por web como por Chrome. No se extrajeron tokens ni nombres exactos de frames.

Los valores actuales son decisiones locales: fondo blanco, azul #2159D8, texto #14213D, fuente del sistema, inputs de al menos 56 px, radios de 13/14 px y márgenes de 24 px. Están centralizados en src/components/ui.tsx. No se presentan como valores verificados del Figma.

ScrollView, KeyboardAvoidingView y safe areas permiten usar pantallas pequeñas. Hay etiquetas accesibles, errores anunciados, foco visible y controles táctiles amplios. El registro puede desplazarse.

## Persistencia

AsyncStorage sigue el quickstart y la consigna. Supabase persiste/refresca la sesión y processLock coordina las operaciones de Auth. El refresh solo corre en foreground; los listeners se limpian al desmontar.

AsyncStorage no agrega cifrado del sistema. Una evolución para producción puede usar un adaptador SecureStore. No se persisten contraseñas y se limpian al perder foco. No hay logs de tokens ni contraseñas.

## Recuperación

PKCE permite canjear un código de un solo uso y recibir PASSWORD_RECOVERY real. La ruta reset-password por sí sola nunca habilita el formulario.

Antes del canje se guarda una marca de callback/recuperación pendiente. Tras una interrupción, el inicio siguiente cierra la sesión local: una sesión temporal no debe restaurar Home. Si el cierre falla, se mantiene una barrera de error.

No se aceptan fragmentos con tokens mediante setSession para habilitar recuperación, porque SIGNED_IN no reemplaza PASSWORD_RECOVERY. Solicitar links nuevos desde esta versión.

En web se limpia el callback de la barra para que recargar no vuelva a canjearlo. Se cubren enlaces de inicio y enlaces recibidos con la app abierta. PKCE requiere conservar el almacenamiento de la instalación que inició la solicitud.

## Navegación y formularios

React Navigation con grupos condicionales es una alternativa permitida por el PDF. Se separan auth, Home y recuperación; esta última tiene prioridad.

Las validaciones son funciones puras equivalentes a un esquema de formularios. El nombre se envía en user_metadata.full_name. No hace falta una tabla profiles para este alcance.

Los términos visibles explican el carácter académico de la app; no simulan un contrato bancario.

## Fuera de alcance

Login social, segundo factor OTP, PIN, biometría, CAPTCHA y operaciones bancarias. No se desplegó la app ni se creó una API propia.


# Invitación de boda · Jose i Anas

App Astro con invitación pública, confirmación individual y panel privado para los novios. La portada `/` muestra una vista previa interactiva del formulario que no guarda respuestas; el dashboard está en `/admin/`, las invitaciones se crean y gestionan en `/admin/gestion`, y se abren mediante enlaces privados `/i/TOKEN/` (valenciano) o `/uk/i/TOKEN/` (ucraniano).

## Información y flujo

- **Evento:** nombres, fecha, ceremonia y contenidos públicos en `src/config/wedding.ts`. Los textos de la interfaz se traducen en `src/lib/i18n.ts`; el programa y el nombre de cada espacio deben tener sus variantes española y ucraniana en la configuración. La apertura y fecha límite del RSVP se ajustan desde el panel.
- **Idiomas y grupos:** Astro gestiona las rutas `es` y `uk`. En «Grupos e idiomas» se crea un grupo con idioma predeterminado. Al abrir la gestión se crea el grupo «Valencia» si falta y se preselecciona al crear invitaciones. Al asignar una tarjeta a un grupo, hereda su idioma; cambiar el idioma del grupo actualiza todas sus tarjetas. Las tarjetas sin grupo pueden escoger idioma propio. El enlace antiguo redirige al idioma actual y el invitado puede cambiar de idioma desde la tarjeta. Los mensajes personales se redactan por separado en español y ucraniano; si falta una versión, se usa el mensaje general traducido.
- **Invitación:** destinatario visible, correo de referencia opcional, mensaje personal, personas incluidas, fecha de creación, marca de envío y estado de revocación. Una invitación comparte un único enlace privado.
- **Persona invitada:** nombre, asistencia (`pendiente`, `asiste`, `no asiste`), alergias e intolerancias en texto libre, observaciones generales, autorización para usar los datos alimentarios y fecha de respuesta. Los datos alimentarios y las observaciones se borran si la respuesta pasa a `no asiste` o `pendiente`. Desde el panel se puede vincular con una persona de otra invitación; la pareja aparece en ambas fichas, en el resumen y en el CSV privado.
- **Novios:** crean tarjetas, copian el enlace, marcan el envío, editan la tarjeta y cada persona, añaden o quitan personas, filtran respuestas, ajustan el plazo, exportan CSV, renuevan o revocan enlaces y borran definitivamente una tarjeta con sus respuestas. Renovar invalida el enlace anterior.
- **Invitados:** abren el enlace, responden por cada persona y pueden corregir su respuesta hasta el cierre del plazo. Si confirman asistencia, pueden indicar alergias y otras observaciones. Si declaran alergias, deben autorizar expresamente su uso para organizar el menú.
- **URL visible de la invitación:** el enlace personal con token sigue siendo necesario para abrir la invitación por primera vez o compartirla con otro dispositivo. Tras cargarla, el navegador guarda el token en `localStorage` y muestra `/i/` o `/uk/i/` en la barra de direcciones. Esas rutas recuperan la última invitación abierta en ese navegador; sin ese dato local, se debe usar de nuevo el enlace personal.

El envío del enlace se hace desde el canal que elijan los novios. El botón de «enviada» registra ese paso; la app no manda correos automáticamente.

## Arranque local

Requiere Node.js 24.15.0 (Volta) o 22.23.4 o superior y un proyecto Supabase exclusivo para la boda. En este equipo se recomienda usar Volta:

```sh
volta run --node 24.15.0 npm install
```

1. Crea un proyecto Supabase **exclusivo para la boda**. Aplica `db/schema.sql` a su PostgreSQL desde el editor SQL de Supabase o con `psql` y la URI de conexión directa o del *Session pooler* obtenida en **Connect**. El esquema es privado y puede volver a aplicarse para añadir las columnas nuevas sin borrar invitaciones anteriores. Para la aplicación desplegada en Vercel, utiliza en cambio la URI del *Transaction pooler* (puerto 6543): cada instancia abre como máximo una conexión.

   ```sh
   psql "$SUPABASE_MIGRATION_URL" -v ON_ERROR_STOP=1 -f db/schema.sql
   ```

2. En **Authentication → Users**, crea o invita a cada administrador. Copia sus UUID en `ADMIN_USER_IDS`, separados por comas. El inicio de sesión usa Supabase Auth con correo y contraseña; crear un usuario en Supabase no le da acceso al panel hasta incluir su UUID en esta lista. No habilites registros públicos si solo entrarán los novios.

3. Copia `.env.example` a `.env.local`. Rellena `DATABASE_URL` con la URI del *Transaction pooler*, `SUPABASE_URL` con la URL del proyecto, `SUPABASE_PUBLISHABLE_KEY` con la clave publicable, `ADMIN_USER_IDS` y `PUBLIC_SITE_URL`. Genera `INVITATION_LINK_KEY` con `openssl rand -base64 32` y guarda el resultado en `.env.local`. Las variables antiguas `ADMIN_EMAIL`, `ADMIN_PASSWORD_SALT`, `ADMIN_PASSWORD_HASH` y `ADMIN_SESSION_KEY` ya no se usan.

   `PUBLIC_SITE_URL` debe ser el origen público HTTPS de la invitación, sin rutas ni parámetros (por ejemplo, `https://boda.tudominio.com`). El panel usa esta variable para los mensajes y enlaces que se comparten. En desarrollo también acepta `http://localhost:4321` para probar la copia del mensaje; ese enlace solo funciona en el propio ordenador. En producción, una dirección local no habilita los botones de copia.

   Las invitaciones privadas incluyen una miniatura de enlace en valenciano o ucraniano. Para ver esa vista previa en WhatsApp, la URL de la invitación y la imagen deben ser accesibles desde una dirección pública HTTPS; `localhost` solo permite comprobar el HTML y la copia del mensaje en desarrollo.

4. Arranca la app:

   ```sh
   volta run --node 24.15.0 npm run dev
   ```

Abre `http://localhost:4321/admin/login`. Antes de compartir invitaciones, revisa `src/config/wedding.ts`, el dominio público y la fecha límite desde el panel. Para producción configura las mismas variables en Vercel y publica el proyecto con el adaptador ya incluido.

**Claves y datos:** `INVITATION_LINK_KEY` cifra los tokens guardados para que el panel pueda volver a mostrar los enlaces. Guárdala de forma segura y estable: si cambia, los enlaces existentes no podrán recuperarse desde el panel. No subas `.env.local` ni la URI de PostgreSQL al repositorio. La clave publicable se usa solo para Supabase Auth en el servidor; la aplicación accede a la base mediante `DATABASE_URL`, nunca desde el navegador. La conexión SQL verifica el certificado del servidor con la CA pública de Supabase incluida en `src/lib/prod-ca-2021.crt`. La base usa el esquema privado `wedding`, sin acceso directo para los roles públicos de Supabase. El CSV contiene datos alimentarios y se descarga solo después de iniciar sesión.

## Datos de prueba

Para probar el panel con volumen, el script `scripts/seed-demo.mjs` añade 120 invitaciones y **300 personas ficticias**. Incluye ambos idiomas, grupos, tarjetas sin grupo, invitaciones enviadas y sin enviar, algunas revocadas, respuestas de los tres tipos, alergias, observaciones y las opciones de autobús. Conserva las invitaciones que ya existan. Los correos de prueba usan el dominio reservado `.invalid` y no se envían mensajes.

```sh
node scripts/seed-demo.mjs --plan
node --env-file=.env.local scripts/seed-demo.mjs --seed
node --env-file=.env.local scripts/seed-demo.mjs --verify
```

Cada registro de prueba usa un identificador fijo independiente del nombre visible. El script rechaza una segunda carga para evitar duplicados. Cuando terminen las pruebas, `node --env-file=.env.local scripts/seed-demo.mjs --cleanup` elimina únicamente esas invitaciones y sus personas; los grupos de prueba se eliminan solo si quedan vacíos. **No ejecutes la limpieza hasta que se hayan validado los datos.**

## Comprobaciones

```sh
volta run --node 24.15.0 npm run check
volta run --node 24.15.0 npm run build
volta run --node 24.15.0 npm test
```

Las pruebas de navegador necesitan Chrome/Chromium de Playwright o `PLAYWRIGHT_CHROMIUM_EXECUTABLE` con la ruta a Chrome. La prueba completa del flujo se activa con `WEDDING_E2E_EMAIL` y `WEDDING_E2E_PASSWORD` y debe ejecutarse **solo contra un proyecto Supabase de prueba desechable**, con un usuario Auth cuyo UUID figure en `ADMIN_USER_IDS`:

```sh
PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/google-chrome-stable \
WEDDING_E2E_EMAIL='admin-de-prueba@example.com' \
WEDDING_E2E_PASSWORD='contraseña de prueba' \
volta run --node 24.15.0 npm run test:e2e
```

`docs/assets.md` documenta la procedencia de las imágenes de la invitación.

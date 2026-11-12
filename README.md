# Invitación de boda · Jose i Anas

App Astro con invitación pública, confirmación individual y panel privado para los novios. La portada `/` muestra una vista previa interactiva del formulario que no guarda respuestas; las invitaciones reales se crean en `/admin/` y se abren mediante enlaces privados `/i/TOKEN/` (valenciano) o `/uk/i/TOKEN/` (ucraniano).

## Información y flujo

- **Evento:** nombres, fecha, ceremonia y contenidos públicos en `src/config/wedding.ts`. Los textos de la interfaz se traducen en `src/lib/i18n.ts`; el programa y el nombre de cada espacio deben tener sus variantes española y ucraniana en la configuración. La apertura y fecha límite del RSVP se ajustan desde el panel.
- **Idiomas y grupos:** Astro gestiona las rutas `es` y `uk`. En «Grupos e idiomas» se crea un grupo con idioma predeterminado. Al asignar una tarjeta a un grupo, hereda su idioma; cambiar el idioma del grupo actualiza todas sus tarjetas. Las tarjetas sin grupo pueden escoger idioma propio. El enlace antiguo redirige al idioma actual y el invitado puede cambiar de idioma desde la tarjeta. Los mensajes personales se redactan por separado en español y ucraniano; si falta una versión, se usa el mensaje general traducido.
- **Invitación:** destinatario visible, correo de referencia opcional, mensaje personal, personas incluidas, fecha de creación, marca de envío y estado de revocación. Una invitación comparte un único enlace privado.
- **Persona invitada:** nombre, asistencia (`pendiente`, `asiste`, `no asiste`), alergias e intolerancias en texto libre, otras necesidades alimentarias, observaciones generales, autorización para usar los datos alimentarios y fecha de respuesta. Los datos alimentarios y las observaciones se borran si la respuesta pasa a `no asiste` o `pendiente`.
- **Novios:** crean tarjetas, copian el enlace, marcan el envío, editan la tarjeta y cada persona, añaden o quitan personas, filtran respuestas, ajustan el plazo, exportan CSV, renuevan o revocan enlaces y borran definitivamente una tarjeta con sus respuestas. Renovar invalida el enlace anterior.
- **Invitados:** abren el enlace, responden por cada persona y pueden corregir su respuesta hasta el cierre del plazo. Si confirman asistencia, pueden indicar alergias, necesidades alimentarias y otras observaciones. Si declaran datos alimentarios, deben autorizar expresamente su uso para organizar el menú.

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

4. Arranca la app:

   ```sh
   volta run --node 24.15.0 npm run dev
   ```

Abre `http://localhost:4321/admin/login`. Antes de compartir invitaciones, revisa `src/config/wedding.ts`, el dominio público y la fecha límite desde el panel. Para producción configura las mismas variables en Vercel y publica el proyecto con el adaptador ya incluido.

**Claves y datos:** `INVITATION_LINK_KEY` cifra los tokens guardados para que el panel pueda volver a mostrar los enlaces. Guárdala de forma segura y estable: si cambia, los enlaces existentes no podrán recuperarse desde el panel. No subas `.env.local` ni la URI de PostgreSQL al repositorio. La clave publicable se usa solo para Supabase Auth en el servidor; la aplicación accede a la base mediante `DATABASE_URL`, nunca desde el navegador. La conexión SQL verifica el certificado del servidor con la CA pública de Supabase incluida en `src/lib/prod-ca-2021.crt`. La base usa el esquema privado `wedding`, sin acceso directo para los roles públicos de Supabase. El CSV contiene datos alimentarios y se descarga solo después de iniciar sesión.

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

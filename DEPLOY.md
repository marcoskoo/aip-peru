# AIP PERÚ — Despliegue en Netlify

Guía paso a paso para desplegar la aplicación **AIP PERÚ** en Netlify.

---

## 1. Requisitos previos

- Cuenta en [netlify.com](https://app.netlify.com) (plan Starter o superior recomendado)
- Repositorio Git (GitHub, GitLab o Bitbucket) con el código del proyecto
- Base de datos **PostgreSQL** serverless-friendly:
  - Recomendado: [Neon](https://neon.tech) (gratis para empezar, serverless Postgres)
  - Alternativas: Supabase, Railway, Render

> ⚠️ **SQLite no funciona en Netlify** porque las funciones serverless no tienen
> sistema de archivos persistente. Por eso el proyecto ya usa PostgreSQL.

---

## 2. Preparar la base de datos (Neon)

1. Crea una cuenta en https://neon.tech y un nuevo proyecto.
2. Copia la **connection string** que aparece en el dashboard. Tiene la forma:
   ```
   postgresql://user:password@ep-xxxxx.sa-east-1.aws.neon.tech/dbname?sslmode=require
   ```
3. Inicializa el schema ejecutando localmente:
   ```bash
   # Configura tu .env con DATABASE_URL apuntando a Neon
   bun run db:push    # crea todas las tablas en Neon
   ```
4. (Opcional) Carga los datos semilla:
   ```bash
   bun run tsx prisma/seed.ts
   ```

---

## 3. Configurar Netlify

### 3.1 Conectar el repositorio
1. En Netlify → **Add new site → Import an existing project**
2. Conecta tu proveedor de Git y selecciona el repositorio
3. Netlify detectará automáticamente Next.js (gracias al `netlify.toml`)
4. **Build command**: `prisma generate && next build` (ya configurado)
5. **Publish directory**: `.next` (ya configurado)

### 3.2 Variables de entorno (CRÍTICO)

En **Site settings → Environment variables**, agrega:

| Variable | Valor | Notas |
|---|---|---|
| `DATABASE_URL` | `postgresql://...?sslmode=require` | Tu connection string de Neon |
| `NEXTAUTH_SECRET` | (genera con `openssl rand -base64 32`) | Solo si usas autenticación |
| `NEXTAUTH_URL` | `https://TU-SITIO.netlify.app` | URL canónica de tu sitio |
| `NODE_VERSION` | `20` | Ya está en `netlify.toml` |

> 🔒 **Importante:** nunca subas el archivo `.env` a Git. El `.gitignore` ya lo excluye.

### 3.3 Deploy
1. Click en **Deploy site**
2. Espera a que termine el build (~3-5 min la primera vez, Prisma debe descargar binaries para Linux)
3. Netlify te dará una URL como `https://aip-peru.netlify.app`

---

## 4. Configuración técnica incluida

El proyecto ya incluye todo lo necesario para Netlify:

### `netlify.toml`
- Plugin oficial `@netlify/plugin-nextjs` (maneja App Router automáticamente)
- Headers de seguridad (X-Frame-Options, Permissions-Policy, etc.)
- Cache de 1 año para assets estáticos (`/charts/*`, `/_next/static/*`)
- Bundler `esbuild` para funciones serverless
- Inclusión de los binaries de Prisma en las funciones

### `prisma/schema.prisma`
- `binaryTargets` incluye `linux-amazon-2-openssl-3.0.x` (runtime de Netlify)
- Conexión PostgreSQL con SSL (`sslmode=require`)

### `next.config.ts`
- `serverExternalPackages: ["@prisma/client", ".prisma/client"]` (evita bundlear Prisma)
- Sin `output: "standalone"` (el plugin de Netlify maneja el build)

---

## 5. Límites a tener en cuenta

| Recurso | Límite (Starter) | Notas |
|---|---|---|
| Bandwidth | 100 GB/mes | Las imágenes de cartas son ~130 MB en total |
| Build time | 300 min/mes | Cada build tarda ~3-5 min |
| Function invocations | 125k/mes | Las API routes cuentan aquí |
| Function duration | 26 s timeout | Suficiente para queries a Postgres |
| Function size | 50 MB (comprimido) | Prisma + sharp caben, pero ajustado |

---

## 6. Solución de problemas

### Error: "Prisma couldn't find the Query Engine"
Causa: los binaries de Prisma no se incluyeron en la función.
Solución: verifica que `netlify.toml` tenga:
```toml
[functions]
  included_files = ["node_modules/.prisma/**/*", "node_modules/@prisma/client/**/*"]
```

### Error: "Database connection timeout"
Causa: el connection pool de Postgres se agotó.
Solución: Neon soporta connection pooling con `?pgbouncer=true&connection_limit=1`.

### El build falla por límite de 50 MB en funciones
Causa: dependencias muy pesadas (sharp, react-syntax-highlighter).
Solución: ya configuramos `serverExternalPackages` para Prisma. Si persiste, considera:
- Usar `@prisma/adapter-pg` (driver adapter, sin binario)
- Lazy-import de módulos pesados

### Las imágenes de cartas no cargan
Causa: el directorio `public/charts/` no se subió o supera el límite.
Solución: verifica que las imágenes estén en Git (usa Git LFS si son muy grandes).

---

## 7. Dominio personalizado

1. En Netlify → **Domain settings → Add custom domain**
2. Sigue las instrucciones para configurar DNS
3. Netlify emite automáticamente certificado SSL/TLS vía Let's Encrypt
4. Actualiza `NEXTAUTH_URL` con tu dominio final

---

## 8. Monitoreo

- **Functions log**: Site → Functions → ver logs en tiempo real
- **Analytics**: Site → Analytics (tráfico, bandwidth, function invocations)
- **Deploy logs**: cada deploy tiene su log completo

---

## 9. Rollback

Netlify guarda todos los deploys. Para hacer rollback:
1. Ve a **Deploys** en el dashboard
2. Encuentra el último deploy exitoso
3. Click en **Publish deploy** → el sitio vuelve a esa versión instantáneamente

---

_Última actualización: configuración verificada para Next.js 16 + Prisma 6 + Netlify plugin 5.x_

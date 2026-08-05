# APP-Inmobiliaria

Aplicación de gestión inmobiliaria: catálogo de propiedades, visitas, señas,
alquileres y documentación de clientes.

- `backend/` — API REST con Express, MikroORM y MySQL
- `frontend/` — SPA con React, TypeScript, Vite y Tailwind
- `docs/` — contrato de la API de señas y mapeo del modelo de datos

## Requisitos

- Node.js 20 o superior
- pnpm (`npm install -g pnpm`)
- Docker, para la base de datos

## Puesta en marcha

### 1. Base de datos

Desde esta carpeta:

```bash
docker compose up -d
```

Levanta MySQL en el puerto **3307** con la base `app-inmobiliaria`. El esquema
se crea solo: el backend corre `updateSchema()` en cada arranque.

### 2. Backend

```bash
cd backend
pnpm install
cp .env.example .env
```

Editá `.env` y completá `JWT_SECRET`. Generá el valor con:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Es obligatorio: **el servidor no arranca sin él**, a propósito. Con un secreto
adivinable cualquiera puede firmar un token con rol de agente y acceder a toda
la API, y un valor por defecto haría que el problema pase desapercibido.

```bash
pnpm start:dev
```

Queda escuchando en `http://localhost:3000` y recompila al guardar.

### 3. Frontend

En otra terminal:

```bash
cd frontend
pnpm install
cp .env.example .env
pnpm dev
```

Abre `http://localhost:5173` y espera la API en `http://localhost:3000`.

## Contraseñas

Se guardan hasheadas con bcrypt. Si venías de una base anterior con las
contraseñas en texto plano, migralas una vez:

```bash
cd backend
pnpm build
pnpm migrate:passwords
```

Es idempotente: saltea las que ya están hasheadas, así que correrlo de más no
hace daño.

## Scripts

**Backend**

| Comando | Qué hace |
|---|---|
| `pnpm start:dev` | Compila y arranca, recompilando al guardar |
| `pnpm build` | Compila TypeScript a `dist/` |
| `pnpm migrate:passwords` | Hashea las contraseñas que estén en texto plano |

**Frontend**

| Comando | Qué hace |
|---|---|
| `pnpm dev` | Servidor de desarrollo de Vite |
| `pnpm build` | Build de producción |
| `pnpm lint` | ESLint |

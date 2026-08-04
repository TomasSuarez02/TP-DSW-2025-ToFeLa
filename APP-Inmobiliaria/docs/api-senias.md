# Contrato de API — Señas y Pagos

Este documento describe el flujo de seña con pago. **El backend ya lo implementa**
(módulos `backend/src/senia` y `backend/src/pago`), así que el frontend puede correr
con `VITE_USE_MOCK=false` y pegarle a la API real.

Las constantes de negocio viven en dos archivos espejados que hay que mantener
sincronizados: `backend/src/senia/senia.rules.ts` y `frontend/src/config/senia.ts`.

## Reglas de negocio acordadas

- La seña mínima es el **20%** del precio de la propiedad.
- Una seña confirmada deja la propiedad **señada** durante **10 días** corridos.
- Vencido ese plazo sin que el administrador la pase a `alquilada`, la seña queda
  `vencida` y la propiedad vuelve a `disponible`.
- El cliente completa el trámite presencialmente (papeles + saldo); el administrador
  es quien marca la propiedad como `alquilada`.

## Estados

### `Senia.estado`

| Estado | Significado |
| --- | --- |
| `pendiente_pago` | Creada, todavía sin pago aprobado. **No** reserva la propiedad. |
| `confirmada` | Pago aprobado. La propiedad pasa a `señada` y se fija `fechaVencimiento`. |
| `vencida` | Pasó `fechaVencimiento` sin concretarse. La propiedad vuelve a `disponible`. |
| `cancelada` | Cancelada por el cliente (solo posible desde `pendiente_pago`) o por el admin. |

### `Pago.estado`

`pendiente` · `aprobado` · `rechazado`

## Endpoints

Salvo `GET /api/senias`, todos los endpoints de señas requieren el header
`Authorization: Bearer <token>`.

**Identificación de la seña.** Su PK es compuesta (propiedad + cliente +
`fecha_hora_senia`), como en el modelo de datos. El backend la codifica en un string
URL-safe que expone como `clave` y que las rutas reciben como `:clave`:

```
19-13-1785867913511   →   propiedad 19, cliente 13, fecha en epoch ms
```

Ver `backend/src/shared/db/clave-compuesta.ts`. Una clave mal formada devuelve `400`.

### `POST /api/senias/cliente`

Crea la seña del cliente autenticado. No pone la propiedad en `reservada`: eso ocurre
recién cuando el pago se aprueba.

```jsonc
// request
{ "propiedad": 12, "importe": 40000 }

// response 201
{ "message": "senia created", "data": { /* Senia */ } }
```

Validaciones: la propiedad existe y está `disponible` (si no, `400`); el importe es
mayor o igual al 20% del precio de la propiedad y no lo supera (`400`); el cliente no
tiene ya otra seña `pendiente_pago` o `confirmada` sobre esa propiedad (`409`).

Las señas que carga un agente por `POST /api/senias` no pasan por el mínimo del 20%:
pueden tener cualquier importe menor o igual al precio.

### `GET /api/senias/mis-senias`

Señas del cliente autenticado, con `propiedad`, `cliente` y `pago` populados. Ya existe.

### `GET /api/senias`

Todas las señas (admin). Ya existe.

### `POST /api/pagos`

Procesa el pago de una seña. La pasarela es simulada: el backend decide aprobado o
rechazado según el número de tarjeta (ver "Tarjetas de prueba").

```jsonc
// request
{
  "senia": "19-13-1785867913511",
  "numeroTarjeta": "4111111111111111",
  "titular": "JUAN PEREZ",
  "vencimiento": "12/28",
  "cvv": "123"
}

// response 201 — aprobado
{
  "message": "pago aprobado",
  "data": {
    "id": 3,
    "estado": "aprobado",
    "monto": 40000,
    "ultimosCuatro": "1111",
    "fecha": "2026-08-03T14:22:00.000Z",
    "referencia": "MOCK-8F3A21",
    "senia": {
      "clave": "19-13-1785867913511",
      "estado": "confirmada",
      "fechaVencimiento": "2026-08-13T14:22:00.000Z"
    }
  }
}

// response 402 — rechazado
{ "message": "El pago fue rechazado por la entidad emisora", "data": { "estado": "rechazado" } }
```

Efecto lateral en caso de aprobación: `Senia.estado = 'confirmada'`,
`Senia.fechaVencimiento = ahora + 10 días`, `Propiedad.estado = 'señada'`.

Un pago rechazado deja la seña en `pendiente_pago` para que el cliente reintente; el
reintento sobrescribe el intento anterior, así que cada seña guarda un solo `Pago`.
Del número de tarjeta solo se persisten los últimos cuatro dígitos: el número completo
y el CVV nunca se guardan.

Otras respuestas: `400` si el número no pasa Luhn, `403` si la seña es de otro cliente,
`409` si la seña ya fue pagada o si la propiedad dejó de estar disponible mientras tanto.

### `PATCH /api/senias/:clave/cancelar`

El cliente cancela una seña propia en estado `pendiente_pago`. Devuelve la seña
actualizada. Si ya estaba `confirmada`, responder `409`.

### `PATCH /api/senias/:clave/estado` (agente)

```jsonc
{ "estado": "confirmada" | "vencida" | "cancelada" }
```

Solo para el rol `agente` (`403` en caso contrario). `confirmada` fija el vencimiento
y deja la propiedad `señada`; `vencida` y `cancelada` la liberan.

Cuando el agente concreta el alquiler usa el endpoint de propiedades ya existente
(`PUT /api/propiedades/:id` con `{ "estado": "alquilada" }`).

## Vencimiento de la reserva

No hay tarea programada: al consultar señas (`GET /api/senias`, `/mis-senias`, `/:clave`)
el backend barre las señas `confirmada` cuyo `fechaVencimiento` ya pasó, las marca
`vencida` y devuelve la propiedad a `disponible`. Si el agente alcanzó a poner la
propiedad en `alquilada`, la seña queda `confirmada` porque cumplió su función.

## Forma de los objetos

```ts
type Senia = {
  clave: string                      // PK compuesta codificada, ver arriba
  importe: number
  estado: 'pendiente_pago' | 'confirmada' | 'vencida' | 'cancelada'
  fechaVencimiento?: string | null   // ISO 8601, presente solo si está confirmada
  fecha_hora_senia?: string          // fecha de creación; 3er componente de la clave
  propiedad: number | Propiedad
  cliente: number | Cliente
  pago?: Pago | null
}

type Pago = {
  id: number
  estado: 'pendiente' | 'aprobado' | 'rechazado'
  monto: number
  ultimosCuatro: string
  fecha: string
  referencia?: string
}
```

El frontend tolera que `propiedad` y `cliente` vengan como id o como objeto populado.

## Tarjetas de prueba

Al no haber pasarela real, la aprobación se decide por el número de tarjeta. El
frontend muestra estos datos en pantalla y el backend debe aplicar la misma regla:

| Número | Resultado |
| --- | --- |
| `4111 1111 1111 1111` | aprobado |
| `4111 1111 1117 0000` | rechazado |
| cualquier otro terminado en `0000` | rechazado |
| resto (válido por Luhn) | aprobado |

Ojo: el formulario valida Luhn antes de enviar, así que la tarjeta de rechazo tiene
que ser un número válido que además termine en `0000` — por eso `...1117 0000` y no
`...1111 0000`, que no pasa Luhn.

El CVV y la fecha de vencimiento se validan por formato, no afectan el resultado.

## Nota de compatibilidad

El frontend tolera que falten `estado` y `fechaVencimiento`: asume `pendiente_pago` y
no muestra contador de vencimiento. Con `VITE_USE_MOCK=true` el pago se simula
íntegramente en el navegador, sin llamar a `POST /api/pagos` — sirve para trabajar en
el frontend sin levantar el backend, pero el flujo real ya está disponible.

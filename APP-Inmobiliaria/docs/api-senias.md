# Contrato de API — Señas y Pagos

Este documento describe lo que el frontend espera del backend para el flujo de seña
con pago. El frontend de la rama `feat/frontend-senias-pago` ya está escrito contra
este contrato.

## Reglas de negocio acordadas

- La seña mínima es el **20%** del precio de la propiedad.
- Una seña confirmada reserva la propiedad durante **10 días** corridos.
- Vencido ese plazo sin que el administrador la pase a `alquilada`, la seña queda
  `vencida` y la propiedad vuelve a `disponible`.
- El cliente completa el trámite presencialmente (papeles + saldo); el administrador
  es quien marca la propiedad como `alquilada`.

## Estados

### `Senia.estado`

| Estado | Significado |
| --- | --- |
| `pendiente_pago` | Creada, todavía sin pago aprobado. **No** reserva la propiedad. |
| `confirmada` | Pago aprobado. La propiedad pasa a `reservada` y se fija `fechaVencimiento`. |
| `vencida` | Pasó `fechaVencimiento` sin concretarse. La propiedad vuelve a `disponible`. |
| `cancelada` | Cancelada por el cliente (solo posible desde `pendiente_pago`) o por el admin. |

### `Pago.estado`

`pendiente` · `aprobado` · `rechazado`

## Endpoints

### `POST /api/senias/cliente`

Crea la seña del cliente autenticado. **Cambio respecto de hoy:** ya no debe poner la
propiedad en `reservada` — eso ocurre recién cuando el pago se aprueba.

```jsonc
// request
{ "propiedad": 12, "importe": 40000 }

// response 201
{ "message": "senia created", "data": { /* Senia */ } }
```

Validaciones esperadas: la propiedad existe y está `disponible`; el importe es
mayor o igual al 20% del precio de la propiedad.

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
  "senia": 7,
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
    "senia": { "id": 7, "estado": "confirmada", "fechaVencimiento": "2026-08-13T14:22:00.000Z" }
  }
}

// response 402 — rechazado
{ "message": "El pago fue rechazado por la entidad emisora", "data": { "estado": "rechazado" } }
```

Efecto lateral en caso de aprobación: `Senia.estado = 'confirmada'`,
`Senia.fechaVencimiento = ahora + 10 días`, `Propiedad.estado = 'reservada'`.

### `PATCH /api/senias/:id/cancelar`

El cliente cancela una seña propia en estado `pendiente_pago`. Devuelve la seña
actualizada. Si ya estaba `confirmada`, responder `409`.

### `PATCH /api/senias/:id/estado` (admin)

```jsonc
{ "estado": "confirmada" | "vencida" | "cancelada" }
```

Cuando el admin concreta el alquiler usa el endpoint de propiedades ya existente
(`PUT /api/propiedades/:id` con `{ "estado": "alquilada" }`).

## Forma de los objetos

```ts
type Senia = {
  id: number
  importe: number
  estado: 'pendiente_pago' | 'confirmada' | 'vencida' | 'cancelada'
  fechaVencimiento?: string | null   // ISO 8601, presente solo si está confirmada
  fechaCreacion?: string
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

Mientras el backend no envíe `estado` ni `fechaVencimiento`, el frontend asume
`pendiente_pago` y no muestra contador de vencimiento. Con `VITE_USE_MOCK=true` el
pago se simula íntegramente en el navegador, sin llamar a `POST /api/pagos`.

# Modelo de datos — cómo se mapea el diagrama al código

Referencia: `MODELO DSW 2026.drawio`. Este documento explica dónde vive cada
entidad del diagrama y las pocas decisiones donde el código agrega algo.

## Entidades

| Diagrama | Código | Tabla |
| --- | --- | --- |
| Usuario (rol CLI/AGE) | `shared/db/usuario.entity.ts` + subclases | `usuario` |
| Inmobiliaria | `inmobiliaria/` | `inmobiliaria` |
| Propiedad | `propiedad/` | `propiedad` |
| TipoPropiedad | `tipopropiedad/` | `tipo_propiedad` |
| EstadoPropiedad | `estadopropiedad/` | `estado_propiedad` |
| Imagen | `imagenes/` | `imagen` |
| Visita | `visita/` | `visita` |
| Seña | `senia/` | `senia` |
| Alquiler | `alquiler/` | `alquiler` |
| EstadoAlquiler | `estadoalquiler/` | `estado_alquiler` |
| Documentacion | `documentacion/` | `documentacion` |
| DocumentacionCliente | `documentacioncliente/` | `documentacion_cliente` |
| Pago | `pago/` | `pago` |

## Usuario: una tabla, dos roles

El diagrama tiene una sola tabla `Usuario` con `rol = CLI | AGE`. En el código eso
es **herencia de tabla única** de MikroORM: `Usuario` es la clase raíz con
`discriminatorColumn: 'rol'`, y `Cliente` (`CLI`) y `AgenteInmobiliario` (`AGE`) son
subclases que comparten la tabla `usuario`.

La ventaja es que el resto del código sigue trabajando con tipos distintos
(`em.find(Cliente, ...)` filtra solo por `rol = 'CLI'` automáticamente) mientras la
base tiene la forma exacta del diagrama.

`fecha_ingreso` e `inmobiliaria_id` están declarados en `AgenteInmobiliario`, así que
son columnas nulables de `usuario` — igual que el `NULL` que marca el diagrama.

## Claves compuestas en las rutas REST

Seña, Visita y Alquiler tienen PK compuesta (propiedad + cliente + fecha). Eso no
entra en una ruta `/recurso/:id`, así que se codifica en un string URL-safe:

```
19-13-1785867913511   →   propiedad 19, cliente 13, fecha en epoch ms
```

Las entidades lo exponen como `clave` (propiedad derivada, no se persiste) y las
rutas lo reciben como `:clave`. La codificación está en
`shared/db/clave-compuesta.ts`.

Las columnas de fecha que son PK usan `datetime(3)`: la clave viaja con precisión de
milisegundos y un `datetime` común los truncaría, con lo que ninguna búsqueda por
clave encontraría su fila.

`Imagen` también es entidad débil en el diagrama, con PK `(id, id_propiedad)`. Como
MySQL no puede autoincrementar una columna de PK compuesta, el id se numera dentro de
cada propiedad en `imagenes/imagen.controler.ts`.

## Estados como tablas de referencia

`EstadoPropiedad` y `EstadoAlquiler` son tablas. Sus filas las carga
`shared/db/seed.ts` en cada arranque, de forma idempotente:

- EstadoPropiedad: `disponible`, `reservada`, `señada`, `alquilada`
- EstadoAlquiler: `pendiente`, `confirmado`, `cancelado`, `finalizado`

Para no obligar a cada consumidor a navegar la relación, `Propiedad` y `Alquiler`
exponen un getter `estado` con la descripción en texto. La API entonces sigue
recibiendo y devolviendo `{ "estado": "señada" }` aunque la base esté normalizada;
la traducción a la fila correspondiente la hacen los controladores con los helpers de
`shared/db/estados.ts`.

## DocumentacionCliente: entidad, no un M:N pelado

En el diagrama `DocumentacionCliente` figura como entidad propia, y en el código lo
es: tiene PK compuesta (`documentacion`, `cliente`) más `estado`, `fecha_carga` y
`observaciones`. Antes era un `@ManyToMany` sin atributos; se convirtió porque
concretar un alquiler exige saber si los papeles fueron **aprobados**, y un pivot
sin columnas no puede decirlo.

`Cliente.documentaciones` y `Documentacion.clientes` son ahora `OneToMany` hacia esa
entidad, así que los consumidores reciben la presentación con su estado en vez de la
contraparte directa.

## Cómo cierra el flujo

`Senia` y `Alquiler` no son islas: `Alquiler.senia` apunta a la seña que lo originó
(FK compuesta de tres columnas, porque la PK de `Senia` lo es) y es `unique`, así que
una seña se concreta una sola vez. El adelanto queda imputado y el saldo cobrado
cuelga del alquiler como `Alquiler.pagoSaldo`.

Entre los dos `Pago` se cubre el primer mes: `Senia.pago` (tarjeta, online) más
`Alquiler.pagoSaldo` (presencial) suman `Propiedad.precio`.

## Dónde el código va más allá del diagrama

- **`Senia.importe`, `estado` y `fechaVencimiento`** los exige el flujo de pago de la
  seña (ver `api-senias.md`). Son columnas simples de `Seña`, no una tabla de
  referencia: son 4 valores fijos, a diferencia de `EstadoPropiedad`/`EstadoAlquiler`.
- **`Pago`** es una entidad nueva, por la misma razón. Es genérica: `medio` distingue
  tarjeta de efectivo o transferencia, y los campos de tarjeta son nulables porque un
  cobro presencial no los tiene. Del número solo se guardan los últimos cuatro dígitos.
- **`TipoPropiedad.estado`** existía en el código y no en el diagrama: se eliminó.
- La relación M:N Cliente–Inmobiliaria que había en el código tampoco está en el
  diagrama (que solo tiene Inmobiliaria 1—* Usuario): se eliminó.

## Migración

El cambio de modelo se aplicó sobre la base existente sin perder datos:

- backup previo: `backend/backups/app-inmobiliaria-pre-modelo-dsw.sql`
- script de migración: `backend/backups/migracion-modelo-dsw.sql` (documenta el
  procedimiento paso a paso en su encabezado)

Un detalle a tener en cuenta si hay que repetirlo: **no** sirve renombrar las tablas
viejas dentro de la misma base, porque el `updateSchema()` de MikroORM las borra por
no estar en el modelo. Hay que restaurar el dump en una base auxiliar y copiar desde
ahí.

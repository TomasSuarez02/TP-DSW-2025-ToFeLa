# PROPOSAL TP DSW



## TEAM MEMBERS
* 50252 - Tomás Nahuel Suárez
* 52960 - Lautaro Goyoaga
* 52977 - Felipe Bentancour
* 50839 - Paloma Tejedor



## REPOSITORIES
* [ Frontend app ]
* [ Backentd app ]



## OVERVIEW

### '...'

Our real estate agency specializes in property rentals, offering comprehensive services for both property owners and tenants. We operate in various areas of the city and its surroundings, managing a wide range of properties including apartments, houses, offices, and commercial spaces. We handle the entire rental process—from property listing, responding to inquiries, organizing viewings, and screening potential tenants, to drafting and signing lease agreements.

Through a modern and user-friendly online system, clients can access an up-to-date catalog of available properties, filter listings according to their needs, and request viewings. Property owners can rely on us for full management of their assets, including monthly rent collection, contract administration, and handling of tenant requests.



## MODEL OR CLASESS DIAGRAM
* https://drive.google.com/file/d/1LIt04DcUZPJjcmk4pFcEN-Hz-9-4sP1d/view?usp=sharing



## FUNCTIONAL SCOPE

### MINIMUM SCOPE
Requirements for Regularity:
|Req|Detail|
|:-|:-|
  |Simple CRUD|1. CRUD-Cliente<br>2. CRUD-TipoPropiedad<br>3. CRUD-Inmobiliaria<br>4.TipoDocumentacion|
|Dependent CRUD|1. CRUD-Propiedad {depend on} Inmboliaria<br>2. CRUD-Agente Inmobiliario {depend on} inmobiliaria|
|Listado + Detalle|1. Listado de propiedades filtrado por zona, tipo o inmobiliaria => muestra dirección, precio, estado<br>2. Listado de visitas por cliente o propiedad => muestra fecha, agente, estado => detalle muestra toda la información de la visita|
|CUU / EPIC|1. Reservar una propiedad mediante una seña<br>2. Agendar visita|


### ADDITIONAL SCOPE
Requirements for AD:
|Req|Detail|
|:-|:-|
|CUU/Epic|1. Registrar un pago de alquiler<br>2. Confirmar alquiler|


### VOLUNTARY ADDITIONAL FUNCTIONAL SCOP
|Req|Detail|
|:-|:-|
|Listados |1. Listado de propiedades más vistas|
|CUU/Epic|1. Marcar propiedades como favoritas(cliente)<br>2. Búsqueda avanzada de propiedades con múltiples filtros(zona, precio, disponibilidad)|
|Otros|1.Envio notificación automática al usuario previo al vencimiento de su contrato|

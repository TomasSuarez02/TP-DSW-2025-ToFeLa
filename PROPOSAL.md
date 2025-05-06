# PROPOSAL TP DSW



## TEAM MEMBERS
* 50252 - Tomás Nahuel Suárez
* 52960 - Lautaro Goyoaga
* 52977 - Felipe Bentancour



## REPOSITORIES
* [ Frontend app ]
* [ Backentd app ]



## OVERVIEW

### '...'

Our real estate agency specializes in property rentals, offering comprehensive services for both property owners and tenants. We operate in various areas of the city and its surroundings, managing a wide range of properties including apartments, houses, offices, and commercial spaces. We handle the entire rental process—from property listing, responding to inquiries, organizing viewings, and screening potential tenants, to drafting and signing lease agreements.

Through a modern and user-friendly online system, clients can access an up-to-date catalog of available properties, filter listings according to their needs, and request viewings. Property owners can rely on us for full management of their assets, including monthly rent collection, contract administration, and handling of tenant requests.



## MODEL OR CLASESS DIAGRAM
* https://app.diagrams.net/#G1ZbQkN20eFp5l86Js8l3kue8Z8fASMzbW#%7B%22pageId%22%3A%22d972EGIYbc2AfdaPhBwq%22%7D



## FUNCTIONAL SCOPE

### MINIMUM SCOPE
Requirements for Regularity:
|Req|Detail|
|:-|:-|
|Simple CRUD|1. CRUD-Usuario<br>2. CRUD-Propiedad<br>3. CRUD-Inmobiliaria<br>|
|Dependent CRUD|1. CRUD-Contrato {depend on} Alquiler<br>2. CRUD-Alquiler {depend on} Propiedad y Usuario<br>3. CRUD-Visita {depend on} agente inmobiliario, cliente y propiedad|
|Listado + Detalle|1. Listado de propiedades filtrado por zona, tipo o inmobiliaria => muestra dirección, precio, estado<br>2. Listado de visitas por cliente o propiedad => muestra fecha, agente, estado => detalle muestra toda la información de la visita|
|CUU / EPIC|1. Reservar una visita a una propiedad disponible<br>2. Generar un contrato desde un alquiler vigente<br>3. Ver historial de visitas y contratos de un cliente|


### ADDITIONAL SCOPE
Requirements for AD:
|Req|Detail|
|:-|:-|
|CRUD |1. CRUD-Seña<br>2. CRUD-Pago<br>3. CRUD-Consulta|
|CUU/Epic|1. Reservar una propiedad mediante una seña<br>2. Registrar un pago asociado a un alquiler o contrato vigente<br>3. Cancelar visit programada|

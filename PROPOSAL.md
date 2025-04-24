# PROPOSAL TP DSW

# TEAM
## TEAM MEMBERS
* 50252 - Tomás Nahuel Suárez
* 52960 - Lautaro Goyoaga
* 52977 - Felipe Bentancour

## SUBJECT
#### OVERVIEW

### '...'

Our real estate agency specializes in property rentals, offering comprehensive services for both property owners and tenants. We operate in various areas of the city and its surroundings, managing a wide range of properties including apartments, houses, offices, and commercial spaces. We handle the entire rental process—from property listing, responding to inquiries, organizing viewings, and screening potential tenants, to drafting and signing lease agreements.

Through a modern and user-friendly online system, clients can access an up-to-date catalog of available properties, filter listings according to their needs, and request viewings. Property owners can rely on us for full management of their assets, including monthly rent collection, contract administration, and handling of tenant requests.

### MODEL OR CLASESS DIAGRAM


## FUNCTIONAL SCOPE

### MINIMUM SCOPE

Regularity:
|Req|Detail|
|:-|:-|
|Simple CRUD|1. CRUD-CLIENT<br>2. CRUD-PROPERTY<br>3. CRUD-CITY<br>|
|Dependent CRUD|1. CRUD-ZONE {depend on} CRUD-CITY<br>2. CRUD-RENT {depend on} ...<br>|

Additional Requirements for AD:
|Req|Detail|
|:-|:-|
|CRUD |1. CRUD-AGENT 2. ...<br>|
|CUU/Epic|1. ...<br>|

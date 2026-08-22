# es-MX glossary

Binding terminology for the Spanish localisation. Every catalogue entry and every
translation pass follows this file. Mexican B2B conventions, usted-form
throughout, no literal calques.

## Core objects

| English | es-MX | Note |
| --- | --- | --- |
| Company / Companies | Empresa / Empresas | Never "Compañía" |
| Contact / Contacts | Contacto / Contactos | |
| Deal / Deals | Negocio / Negocios | HubSpot MX convention; never "Trato" |
| Pipeline | Pipeline | Untranslated; the term of art in MX sales teams |
| Activity / Activities | Actividad / Actividades | |
| Note | Nota | |
| Task | Tarea | |
| Call | Llamada | |
| Meeting | Reunión | |
| Email | Correo | "Email" acceptable in tight UI, "Correo" preferred |
| Owner | Responsable | Never "Dueño" |
| Workspace | Espacio de trabajo | |

## Deal stages

| English | es-MX |
| --- | --- |
| Demo booked | Demo agendada |
| Qualified to buy | Calificado para compra |
| Decision maker bought in | Decisor convencido |
| Contract sent | Contrato enviado |
| Closed won | Ganado |
| Closed lost | Perdido |
| Unqualified to buy | No calificado |

## Recurring UI verbs

| English | es-MX | Note |
| --- | --- | --- |
| Sign in | Iniciar sesión | |
| Sign out | Cerrar sesión | |
| Create / New | Crear / Nuevo, Nueva | Gender agrees with the object |
| Save | Guardar | |
| Cancel | Cancelar | |
| Delete | Eliminar | Never "Borrar" in destructive dialogs |
| Edit | Editar | |
| Search | Buscar | |
| Filter | Filtrar | |
| Sort | Ordenar | |
| Settings | Configuración | Singular |
| Connections | Conexiones | |

## Agent surfaces

| English | es-MX | Note |
| --- | --- | --- |
| Agent | Agente | |
| Research | Investigación | |
| Enrichment | Enriquecimiento | |
| Evidence | Evidencia | |
| Suggestion | Sugerencia | |
| Brief | Resumen ejecutivo | Context decides; never "Brief" |

## Tone rules

- Usted-form for all copy addressed to the user. Imperatives in button labels
  stay infinitive ("Guardar", not "Guarde").
- Empty states explain, they do not apologise.
- Dates and money format through `Intl` with `es-MX`; currency symbols follow
  the record's currency, `$` means MXN only when the currency says so.
- Anglicisms the MX sales world already uses stay: Pipeline, Demo, CRM, Dashboard.
- Never machine-translate a metaphor; rewrite it or drop it.

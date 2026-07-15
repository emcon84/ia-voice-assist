# Propuesta de Servicio — Asistente de IA MAX
### Desarrollado para HORMAX · Versión 1.0

---

## ¿Qué es MAX?

MAX es un asistente de inteligencia artificial especializado en hormigón y productos HORMAX, diseñado para ser usado por equipos de obra, ingenieros, arquitectos y capataces desde cualquier dispositivo móvil o computadora.

El asistente permite:

- **Consultas técnicas por voz** — el usuario habla, MAX responde en audio, sin necesidad de tipear nada
- **Contexto de obra personalizado** — cada proyecto tiene su propio espacio de conversación, con memoria del contexto de esa obra específica
- **Historial de chats** — todas las consultas quedan guardadas, organizadas por proyecto
- **Instalable como app** — funciona como aplicación instalada en el celular (sin necesidad de App Store ni Google Play), disponible sin conexión parcial
- **Accesible desde cualquier dispositivo** — celular, tablet, computadora

---

## Plataformas utilizadas

El servicio funciona gracias a la combinación de las siguientes plataformas. Cada una cumple un rol específico y **todas las cuentas son propiedad del cliente**.

| Plataforma | Para qué se usa | Quién la maneja |
|---|---|---|
| **Vercel** | Hosting de la aplicación web | El desarrollador, en nombre del cliente |
| **Supabase** | Base de datos (historial, proyectos, usuarios) | El desarrollador, en nombre del cliente |
| **Anthropic** | Motor de inteligencia artificial (el "cerebro" de MAX) | El desarrollador, en nombre del cliente |
| **OpenAI** | Voz de MAX (text-to-speech) | El desarrollador, en nombre del cliente |
| **Groq** | Reconocimiento de voz del usuario (speech-to-text) | El desarrollador, en nombre del cliente |
| **Clerk** | Sistema de login y autenticación de usuarios | El desarrollador, en nombre del cliente |

> **Importante:** El desarrollador crea todas las cuentas utilizando el email corporativo del cliente. Las credenciales de acceso son entregadas al cliente y documentadas. El desarrollador tiene acceso técnico únicamente a los fines de mantenimiento, según lo establecido en el contrato.

---

## Costos mensuales estimados

Los costos varían según el volumen de uso del equipo. Se presentan dos escenarios representativos.

### Definición de "consulta"
Una consulta equivale a una conversación completa con MAX: el usuario hace una pregunta, MAX responde, puede haber algunas preguntas de seguimiento. Promedio: 5 a 8 intercambios por consulta.

---

### Escenario A — Uso Medio
**Perfil:** 20 usuarios activos · 5 consultas por persona por día · 6 intercambios por consulta

| Servicio | Detalle | Costo estimado |
|---|---|---|
| Anthropic (IA) | ~18,000 llamadas/mes | $162/mes |
| OpenAI (voz) | ~9 millones de caracteres/mes | $135/mes |
| Groq (reconocimiento de voz) | Volumen medio | $5/mes |
| Vercel (hosting) | Plan Pro | $20/mes |
| Supabase (base de datos) | Plan Pro | $25/mes |
| Clerk (autenticación) | Hasta 10,000 usuarios activos | $25/mes |
| **Total infraestructura** | | **~$372/mes** |
| **Mensualidad de servicio** | Incluye mantenimiento, soporte y actualizaciones | **$700/mes** |

---

### Escenario B — Uso Alto
**Perfil:** 30 usuarios activos · 8 consultas por persona por día · 8 intercambios por consulta

| Servicio | Detalle | Costo estimado |
|---|---|---|
| Anthropic (IA) | ~57,600 llamadas/mes | $518/mes |
| OpenAI (voz) | ~28 millones de caracteres/mes | $432/mes |
| Groq (reconocimiento de voz) | Volumen alto | $21/mes |
| Vercel (hosting) | Plan Pro | $20/mes |
| Supabase (base de datos) | Plan Pro | $25/mes |
| Clerk (autenticación) | Hasta 10,000 usuarios activos | $25/mes |
| **Total infraestructura** | | **~$1,041/mes** |
| **Mensualidad de servicio** | Incluye mantenimiento, soporte y actualizaciones | **$1,800/mes** |

---

> **Nota sobre los costos:** Los valores de infraestructura están expresados en dólares estadounidenses y son estimaciones basadas en el uso proyectado. El desarrollador monitorea el consumo mensualmente e informa al cliente ante variaciones significativas. Los costos de infraestructura los abona el cliente directamente a cada plataforma con su tarjeta corporativa.

---

## Qué incluye la mensualidad de servicio

- Mantenimiento técnico de la aplicación
- Actualizaciones de seguridad
- Monitoreo de disponibilidad del servicio
- Soporte ante errores o caídas (tiempo de respuesta: 24–48 hs hábiles)
- Hasta 2 mejoras menores por mes (ajustes de comportamiento de MAX, textos, etc.)
- Informe mensual de uso (cantidad de consultas, usuarios activos)

---

## Aspectos legales y propiedad de los datos

### Propiedad de los datos
Todos los datos generados por el uso del asistente (conversaciones, proyectos, historial) son **propiedad exclusiva del cliente**. El desarrollador no comercializa, analiza ni comparte estos datos con terceros.

### Acceso técnico
El desarrollador tiene acceso técnico a la infraestructura únicamente a los fines de mantenimiento y resolución de problemas. Este acceso está limitado por contrato y no incluye la revisión de contenido de conversaciones salvo requerimiento explícito y documentado del cliente.

### Marco legal aplicable
El servicio cumple con la **Ley 25.326 de Protección de Datos Personales** de la República Argentina. El cliente, como titular de los datos de sus empleados y proyectos, es responsable de informar a sus usuarios sobre el uso del asistente.

### Transferencia del servicio
En caso de que el cliente decida prescindir del servicio del desarrollador, se garantiza:
- Entrega de todas las credenciales de las cuentas (ya son del cliente)
- Entrega del código fuente de la aplicación
- Exportación completa de la base de datos en formato estándar
- Asistencia técnica de transición por un período de 30 días

El costo de transferencia es un pago único de **$800 USD**, que cubre el tiempo de traspaso, documentación y acompañamiento.

---

## Estado actual del asistente

La versión actual incluye:

- ✅ Asistente de voz con reconocimiento y respuesta en español
- ✅ Sistema de proyectos (carpetas de obra) con contexto personalizado
- ✅ Historial de conversaciones por proyecto
- ✅ Login seguro con email o cuenta de Google
- ✅ Instalable como app en celular (Android e iOS)
- ✅ Funciona en cualquier navegador moderno
- ✅ Aviso automático al usuario cuando el servicio no está disponible

---

## Posibilidades de mejora futuras

El asistente tiene base técnica para incorporar las siguientes funcionalidades. Cada una se cotiza por separado según el alcance:

### Corto plazo (1–2 meses)
- **Panel de uso para el cliente** — dashboard con métricas: consultas por día, usuarios activos, temas más consultados
- **Resumen automático de obra** — MAX genera un resumen de todo lo conversado en un proyecto, exportable como PDF
- **Notificaciones** — recordatorios o alertas configurables por proyecto

### Mediano plazo (2–4 meses)
- **Carga de documentos técnicos** — el cliente sube fichas técnicas, manuales o especificaciones, y MAX las incorpora a sus respuestas
- **Multi-empresa** — soporte para múltiples empresas clientes desde una misma plataforma, con datos completamente separados
- **App nativa** — versión en App Store y Google Play para mayor integración con el celular

### Largo plazo
- **Integración con sistemas de gestión** — conexión con software de presupuestos, ERP o sistemas administrativos ya existentes en la empresa
- **MAX personalizado por rubro** — versiones del asistente especializadas en otros productos o industrias

---

## Contacto

**Desarrollador:** Emiliano  
**Email:** emcon84@gmail.com

---

*Este documento es una propuesta de servicios profesionales. Los costos de infraestructura son estimaciones basadas en el uso proyectado y pueden variar. El desarrollador se compromete a informar variaciones significativas con 30 días de anticipación.*

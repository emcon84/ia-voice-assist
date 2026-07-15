// Cerebro profundo de IMPUESTOS de Lucas (Contabía) — DEMO FICTICIO.
// Se carga on-demand cuando el usuario pregunta por monotributo, IVA, Ganancias,
// facturación, vencimientos, etc. (ver keywords en demo/index.ts).
//
// DISCIPLINA (heredada de LUCAS_BASE): la MECÁNICA y el CRITERIO se explican con
// seguridad total. Los MONTOS exactos en pesos (topes, cuotas, escalas) cambian en
// enero y julio: se dan como aproximados y se deriva a ARCA para el valor vigente.

export const TAXES_MODULE = `
CONOCIMIENTO PROFUNDO — IMPUESTOS ARGENTINA (para asesorar, no para recitar)

=== MONOTRIBUTO (Régimen Simplificado) ===

Qué es: un régimen que unifica en UNA cuota mensual fija tres cosas: el componente
impositivo (reemplaza IVA y Ganancias), el aporte jubilatorio (previsional) y la obra
social. Ideal para quien arranca, factura poco/mediano y no quiere el quilombo de
liquidar IVA todos los meses.

Quién puede: quien vende servicios o productos por debajo de un tope de facturación
anual. También hay topes de superficie del local, energía consumida y alquiler. Si
superás cualquiera de esos límites, quedás excluido y pasás a Responsable Inscripto.

Categorías: van de la más baja a la más alta según tu FACTURACIÓN ANUAL. Hay dos
escalas: una para SERVICIOS y otra para VENTA DE PRODUCTOS (bienes). La de bienes
permite facturar más en las categorías altas. El monto de cada categoría se actualiza
en enero y julio: da el criterio, y para el número exacto derivá a ARCA.

Los 3 componentes de la cuota:
- Impositivo: lo que reemplaza IVA + Ganancias.
- Previsional (SIPA): tu aporte jubilatorio. Ojo: aportás lo mínimo, por eso muchos
  monotributistas se jubilan con la mínima. Si te importa la jubilación, tenerlo en cuenta.
- Obra social: te da cobertura. Podés sumar adherentes (familia) pagando un extra por cada uno.
  Si ya tenés obra social por un trabajo en relación de dependencia, podés estar exento de
  este componente.

Facturación: el monotributista emite FACTURA C. No discrimina IVA (no lo cobra ni lo
computa). Para el que te compra, tu factura C no le da crédito fiscal.

Recategorización: cada 6 meses (enero y julio) mirás cuánto facturaste en los últimos
12 meses y te reubicás en la categoría que corresponde. Si facturaste más, subís (pagás
más); si facturaste menos, podés bajar. Es OBLIGATORIO revisar aunque no cambies. Mucha
gente pregunta "¿me tengo que recategorizar?" cuando en el fondo quiere saber si va a pagar
más o si se le puede caer el monotributo: anticipá esa duda.

Exclusión: si superás el tope anual de la categoría más alta, o algún otro parámetro
(alquiler, compras incompatibles con lo declarado, más de cierta cantidad de operaciones),
quedás EXCLUIDO de pleno derecho y pasás a Responsable Inscripto, a veces de forma
retroactiva. Es el susto más común. Si alguien está cerca del tope, avisale que planifique
el pase antes de que lo excluyan de golpe.

Monotributo y relación de dependencia: son COMPATIBLES. Podés estar en blanco en un laburo
y tener monotributo por tu actividad independiente. En ese caso la obra social ya la tenés
por el empleo, así que el componente de obra social del monotributo puede no corresponder.

=== RESPONSABLE INSCRIPTO (RI) ===

Qué es: el régimen "general". Acá NO pagás una cuota fija: liquidás impuestos según lo que
facturás y gastás. Es para quien factura por encima del tope de monotributo o necesita
discriminar IVA (por ejemplo, para venderle a empresas que le exigen factura A).

IVA: cobrás 21% (la alícuota general) sobre tus ventas = IVA débito. Y te podés computar el
IVA de tus compras = IVA crédito. Pagás la diferencia: débito menos crédito, todos los meses.
Hay alícuotas distintas (10,5% en algunos bienes, 27% en otros), pero el criterio es ese.

Ganancias: tributás sobre tu ganancia neta (ingresos menos gastos deducibles) según una
escala PROGRESIVA: cuanto más ganás, mayor la alícuota del tramo. Se paga anual con anticipos
durante el año. La escala y los tramos se actualizan: el criterio es fijo, los montos derivalos.

Autónomos: el RI persona física además paga aportes de autónomos (jubilación), que es una
suma según la categoría de autónomo. No lo confundas con el previsional del monotributo.

Factura: el RI emite FACTURA A cuando le vende a otro RI (discrimina IVA), y FACTURA B
cuando le vende a consumidor final o monotributista (IVA incluido, no discriminado).

=== MONOTRIBUTO vs RESPONSABLE INSCRIPTO — el criterio para decidir ===

No es solo "cuánto facturás". Preguntá y evaluá:
- ¿A quién le vendés? Si tus clientes son empresas que necesitan factura A para computar
  IVA, capaz te conviene RI aunque factures poco, porque si no te dejan de comprar.
- ¿Tenés muchos gastos con IVA? En RI te computás ese IVA crédito; en monotributo lo perdés.
- ¿Estás cerca del tope? Si venís creciendo, mejor planificar el pase que esperar la exclusión.
- ¿Querés simplicidad? Monotributo es una cuota y listo; RI implica contador y liquidaciones
  mensuales. Para el que arranca y factura poco, monotributo casi siempre gana.

Regla práctica: monotributo mientras entres cómodo en los topes y le vendas a consumidor
final o a otros monotributistas. RI cuando crecés, tenés gastos grandes con IVA, o tus
clientes te exigen factura A.

=== INGRESOS BRUTOS (impuesto PROVINCIAL) ===

Ojo, que a mucha gente se le escapa: además de lo nacional (ARCA), está Ingresos Brutos,
que es PROVINCIAL. Cada provincia tiene su régimen y su alícuota. Si trabajás en una sola
provincia, te inscribís en el régimen local (a veces hay régimen simplificado provincial).
Si operás en varias, entra el Convenio Multilateral, que reparte la base entre provincias.
No lo olvides al estimar la carga total: alguien puede estar al día con ARCA y deber IIBB.

=== VENCIMIENTOS ===

La cuota de monotributo vence todos los meses (típicamente alrededor del día 20). Las
obligaciones de ARCA (IVA, Ganancias, etc.) vencen según la TERMINACIÓN del CUIT: cada
dígito tiene su día. El calendario exacto se publica cada año en ARCA. Para no pifiarle,
recomendá débito automático de la cuota de monotributo: se paga sola y evitás la mora.

=== FACTURACIÓN ELECTRÓNICA ===

Todos facturan electrónicamente. El monotributista con Factura C, el RI con A o B. Se hace
desde el sitio de ARCA (Comprobantes en línea) o con la app, o con sistemas de gestión
habilitados. Para facturar necesitás CUIT, clave fiscal y tener dada de alta la actividad
(punto de venta).

=== CUÁNDO DERIVAR A CONTABÍA ===

Vos das criterio y educás. Pero derivá al contador de Contabía cuando: el caso tiene números
reales que hay que liquidar, hay un trámite puntual (alta, baja, pase de régimen, un plan de
pagos), hay empleados de por medio (sueldos, cargas sociales), o la persona necesita que
alguien se haga cargo formalmente. Vos despejás la duda; Contabía ejecuta el trámite.
`.trim();

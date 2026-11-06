# Módulo de Archivo — Páginas y lógica de negocio

**Sistema Hospitalario HRO — Hospital Regional de Occidente**

> Documento generado el **5 de noviembre de 2026 a las 00:24 (hora local, CST)**.
> Describe las pantallas del módulo de Archivo desde el punto de vista funcional:
> qué hace cada una, para qué sirve en el trabajo diario y qué reglas de negocio aplica.

---

## 1. Panorama general

El módulo de Archivo acompaña el recorrido físico del expediente del paciente: desde que
sale de la estantería hasta que regresa a ella, pasando por las salidas hacia las clínicas,
el control diario del Cuaderno Rojo, la baja de expedientes y los reportes de trabajo.

La navegación principal agrupa las pantallas así:

| Sección del menú | Pantalla | Propósito |
| --- | --- | --- |
| Expedientes para COEX | `/archivo` | Seguimiento del expediente y avance del circuito |
| Salida de archivo | `/archivo/salida` | Marcar en lote la salida de expedientes pendientes |
| Salida al Registro Médico | `/archivo/salida-hospital` | Registrar salidas consultando directamente al hospital |
| Reportes diarios | `/archivo/reportes` | Totales y detalle de las salidas del día |
| Cuaderno Rojo | `/archivo/cuaderno-rojo` | Registro diario de egresos, sobres y TIA |
| Depuración de expedientes | `/archivo/depuracion` | Dar de baja expedientes que ya no existen |
| Consolidado | `/archivo/consolidado` | Estadísticas diarias, mensuales y de depuraciones |
| Salidas externas de expedientes | `/archivo/salidas-externas` | Sección provisional, aún sin operación |

Además, el módulo incluye una pantalla administrativa que se abre desde el área de Jefe de
Archivo y una pantalla de registro de carnets que se usa desde Enfermería. Ambas se detallan
al final.

---

## 2. Páginas de la estación de Archivo

### 2.1. Expedientes para COEX — `/archivo`

**Para qué sirve:** es la pantalla de consulta y seguimiento del expediente físico. Permite
saber dónde está un expediente y ejecutar el siguiente paso del circuito de Archivo.

**Funciones principales:**

- Buscar un expediente por su número, ya sea escribiéndolo o escaneándolo con el lector.
- Mostrar la ficha del expediente: número, paciente, especialidad, estación y estado actual.
- Desplegar el historial de movimientos con estado, responsable, hora y observación.
- Ejecutar la acción que corresponde al estado actual:
  - Si está **registrado** o **no localizado**, permite **registrar la salida de archivo**.
  - Si ya salió de archivo hacia enfermería, permite **resguardarlo en la estantería**.
- Marcar un expediente como **no localizado**, con una observación obligatoria que explique
  el motivo.
- Filtrar por fecha y por estación, y ver un resumen del total, pendientes y expedientes con
  salida.
- Consultar la lista de carnets del día de la estación seleccionada.

**Reglas de negocio:**

- Un expediente que no tiene carnet registrado en la fecha consultada se informa como
  “sin carnet hoy”.
- Marcar “no localizado” solo se ofrece cuando el expediente está en estado **registrado**.
- La salida hacia enfermería no la marca Archivo: la registra Mesa COEX. Por eso, cuando el
  expediente ya salió de archivo, la pantalla solo informa la situación y no duplica la acción.
- Cada avance queda registrado en el historial; el historial no se edita ni se borra.

---

### 2.2. Cuaderno Rojo — `/archivo/cuaderno-rojo`

**Para qué sirve:** llevar el registro diario del Cuaderno Rojo físico de Archivo, con las
cantidades que el hospital reporta cada día.

**Funciones principales:**

- Registrar un nuevo día con las cuatro cantidades del cuaderno:
  - Egresos hospitalarios.
  - Sobres emergencia.
  - Sobres sellados.
  - TIA.
- Editar un registro existente, con una pantalla de confirmación antes de guardar.
- Consultar el historial por rango de fechas y generar un PDF del período.
- Eliminar registros únicamente en modo de simulación; en el entorno real no está habilitado.

**Reglas de negocio:**

- Solo puede existir **un registro por fecha**. Si la fecha ya tiene registro, el sistema
  avisa y ofrece editarlo en lugar de crear un duplicado.
- Todas las cantidades deben ser números enteros no negativos.
- El registro se maneja con la fecha de Guatemala, no con la fecha del equipo.
- Si el usuario cambió cantidades y trata de cerrar o cambiar la fecha, se le advierte que
  perderá los cambios y debe confirmar el descarte.
- Si el registro se guarda pero no aparece en el rango de fechas seleccionado, se avisa que
  se ajuste el filtro para verlo.
- El reporte PDF se genera con el período filtrado.

---

### 2.3. Salida de archivo — `/archivo/salida`

**Para qué sirve:** agilizar la salida de expedientes que están pendientes de despacho,
trabajando como una caja de atención rápida: se escribe o escanea el expediente y la salida
se registra de inmediato.

**Funciones principales:**

- Mostrar los expedientes pendientes de salida de la fecha.
- Buscar un expediente por número y seleccionar automáticamente la coincidencia.
- Registrar la salida con la tecla Enter o al hacer clic en la fila.
- Llevar una lista de las salidas hechas en la sesión, con confirmación visual del registro.
- Descargar un PDF con las salidas de la sesión.
- Acceso directo a la pantalla de Salida al Registro Médico.

**Reglas de negocio:**

- Solo se pueden marcar expedientes que estén pendientes; si no hay coincidencia o ya salió,
  se avisa al operador.
- El registro se envía en segundo plano para no frenar el trabajo en lote: la pantalla sigue
  respondiendo mientras se confirma.
- La lista de la sesión es un apoyo de trabajo; el PDF se genera con los expedientes marcados
  en esa sesión.
- La fecha de trabajo se puede cambiar desde el encabezado.

---

### 2.4. Salida al Registro Médico — `/archivo/salida-hospital`

**Para qué sirve:** registrar la salida de expedientes consultando directamente al hospital
(Registro Médico), sin depender de los carnets de enfermería. Es una pantalla compartida por
estación: varios operadores de la misma estación ven y marcan el mismo listado.

**Funciones principales:**

- Seleccionar la estación de trabajo; sin estación no se permite operar.
- Registrar salidas escribiendo o escaneando el número de expediente.
- Asignar una etiqueta a la salida (por ejemplo, prioritario o privado de libertad).
- Registrar manualmente un expediente cuando no se puede leer el código.
- Consultar la lista de salidas de la estación y la fecha.
- Eliminar una salida del listado de la estación.
- Descargar el PDF de salidas de la estación.
- Ver el estado de la cola de registros mientras se procesan.

**Reglas de negocio:**

- El listado es **por estación y por fecha**; lo que marca un operador lo ven los demás de
  la misma estación.
- Las consultas al hospital se procesan una a una en segundo plano para no bloquear el
  tecleo ni saturar el sistema.
- Si el expediente no existe en el hospital, se avisa; si ya estaba marcado en la estación,
  también se avisa y se refresca la lista.
- Eliminar una salida solo la quita del listado y del reporte de esa estación; no afecta al
  hospital.
- La pantalla se actualiza periódicamente para reflejar el trabajo de los demás operadores.

---

### 2.5. Reportes diarios de Archivo — `/archivo/reportes`

**Para qué sirve:** dar al personal de Archivo una vista rápida del trabajo del día: cuántos
expedientes salieron, con qué etiqueta y desde qué estación.

**Funciones principales:**

- Mostrar indicadores del día: salidas totales, salidas con etiqueta, archivo activo y
  archivo pasivo.
- Presentar los totales por etiqueta, con su proporción sobre el total.
- Mostrar las salidas agrupadas por estación, con totales, etiquetas, activos y pasivos.
- Consultar el detalle de cada salida: expediente, paciente, etiqueta, clasificación y hora.
- Filtrar el detalle por estación y buscar por número de expediente o nombre del paciente.
- Descargar el PDF general del día o el PDF de una estación específica.

**Reglas de negocio:**

- La información corresponde a la fecha seleccionada.
- Un expediente puede clasificarse como **activo** o **pasivo**; si no tiene clasificación,
  se muestra sin ese dato.
- Las salidas sin etiqueta cuentan como “normales” y no suman al total de salidas con
  etiqueta.
- El PDF general se habilita solo cuando hay salidas registradas.

---

### 2.6. Depuración de expedientes — `/archivo/depuracion`

**Para qué sirve:** dar de baja un expediente que ya no existe en el sistema, por ejemplo
porque el físico se extravió definitivamente o fue fusionado. La baja es lógica, no un borrado
físico.

**Funciones principales:**

- Buscar un expediente únicamente por su número.
- Mostrar el nombre del paciente antes de confirmar la baja.
- Marcar el expediente como depurado.
- Acumular una bitácora de los expedientes depurados del día, sin correlativo.
- Buscar dentro de la bitácora por número de expediente.
- Descargar un reporte PDF de los depurados.
- Deshacer la última depuración, disponible solo en modo de simulación.

**Reglas de negocio:**

- Si el número no existe, se informa que no se encontró.
- Si el expediente ya estaba depurado, se informa como duplicado y no se vuelve a dar de baja.
- La baja deja una señal permanente: en consultas posteriores el expediente se reconoce como
  “depurado / ya no existe”.
- La bitácora del día es visual y acumulativa; no asigna números de correlativo.
- El reporte PDF se bloquea si la consulta de la bitácora está incompleta o desactualizada,
  para no emitir información parcial.
- El modo de simulación se identifica claramente en pantalla y no guarda en el servidor.

---

### 2.7. Consolidado de Archivo — `/archivo/consolidado`

**Para qué sirve:** concentrar las estadísticas de trabajo de la Estación de Archivo en tres
vistas: diaria, mensual y de depuraciones.

**Funciones principales:**

- **Vista diaria:**
  - Ver el consolidado del día por especialidad.
  - Ver la clasificación de salidas del día: Clínica de la Mujer, archivo activo y archivo
    pasivo.
  - Ver el resumen del Cuaderno Rojo del día (egresos, sobres de emergencia, sobres sellados
    y TIA).
  - Descargar el PDF de expedientes archivados.
- **Vista mensual:**
  - Consultar el Informe Estadístico del mes.
  - Ver el detalle de consultas y los totales del mes.
- **Vista de depuraciones:**
  - Consultar el historial de depuraciones del período.

**Reglas de negocio:**

- El consolidado diario se alimenta de las salidas y del Cuaderno Rojo de la fecha elegida.
- El PDF de expedientes archivados se habilita cuando existen salidas registradas; si no hay,
  se indica que primero deben registrarse salidas en la pantalla de Salida al Registro Médico.
- La vista mensual reproduce la lógica del Informe Estadístico que el hospital lleva en Excel:
  informe diario y detalle de desarchivados por consulta y especialidad.
- Los cálculos oficiales los realiza el sistema; la pantalla solo presenta la información.

---

### 2.8. Salidas externas de expedientes — `/archivo/salidas-externas`

**Para qué sirve:** reservar el espacio de navegación para una funcionalidad futura de salidas
externas de expedientes.

**Situación actual:** sección provisional. Muestra un aviso de que la funcionalidad se definirá
en una fase posterior y no tiene operación ni reglas de negocio implementadas.

---

## 3. Páginas del módulo usadas desde otras áreas

### 3.1. Dashboard administrativo de Archivo — `/jefe-archivo`

**Para qué sirve:** dar al Jefe de Archivo una visión consolidada del movimiento de expedientes
y del estado del día.

**Funciones principales:**

- Seleccionar la fecha y actualizar la información.
- Buscar un expediente y consultar su trazabilidad completa.
- Descargar el PDF de trazabilidad del expediente; si el servicio aún no lo genera, se abre una
  vista de impresión para guardarla como PDF.
- Ver indicadores del día: salidas, salidas con etiqueta, archivo activo y archivo pasivo.
- Ver gráficas de salidas por etiqueta y de comparación activo vs. pasivo.
- Consultar las salidas por estación, con etiquetas, activos, pasivos y descarga de PDF por
  estación.
- Ver cuántos expedientes hay en cada estado actual del circuito.
- Ver el resumen del Cuaderno Rojo del día.
- Descargar el reporte general de salidas.

**Reglas de negocio:**

- La clasificación activo/pasivo se determina por el umbral configurado: los expedientes por
  encima del umbral se consideran activos y los que están por debajo, pasivos. Si no hay
  umbral configurado, el expediente queda sin clasificar.
- La trazabilidad se consulta por número de expediente y por la fecha de trabajo.
- Los reportes por estación solo se pueden descargar cuando la salida tiene estación asociada.
- La información de etiquetas se apoya en el listado de salidas del día cuando el resumen
  administrativo aún no la incluye.

---

### 3.2. Registro de carnets — `/enfermeria/carnets`

**Para qué sirve:** registrar los carnets de los pacientes que ingresan a la estación de
enfermería. Aunque se usa desde Enfermería, el archivo de la pantalla vive dentro del módulo de
Archivo y alimenta la información de especialidad que luego usa Archivo.

**Funciones principales:**

- Seleccionar la estación de enfermería.
- Registrar un carnet indicando especialidad y etiquetas del paciente (prioritario y privado
  de libertad).
- Leer el carnet con el lector o con la cámara.
- Ver los dos últimos carnets registrados para corregir la especialidad o eliminarlos.
- Consultar el listado de carnets del día.
- Ver el reporte de carnets por especialidad y sus límites.
- Asignar y mostrar el correlativo del carnet para anotarlo con lápiz.

**Reglas de negocio:**

- Cada carnet recibe un correlativo del día; se muestra al operador para que lo anote en el
  carnet físico.
- No se permite registrar dos veces al mismo paciente en el día: se informa como duplicado.
- Las etiquetas de prioritario y privado de libertad son opcionales y se muestran junto al
  carnet.
- Las correcciones solo aplican sobre los carnets recién registrados; el historial del día se
  consulta aparte.
- La especialidad elegida es la que después se usa para el consolidado diario de Archivo.

---

## 4. Reglas transversales del módulo

- **Un expediente es un objeto único del paciente:** puede tener varios viajes o ciclos, uno
  por cita. La pantalla operativa siempre debe trabajar sobre el ciclo vigente.
- **El historial es inmutable:** cada cambio de estado agrega un movimiento; nunca se
  reescribe ni se elimina.
- **La baja de expedientes es lógica:** un expediente depurado deja de existir para la
  operación, pero no se borra físicamente de la base.
- **Las etiquetas identifican condiciones especiales:** prioritario, privado de libertad u
  otras configuradas por estación. Acompañan a la salida y alimentan los reportes.
- **Activo y pasivo:** el archivo activo corresponde a los expedientes con número por encima
  del umbral configurado; el pasivo, a los que están por debajo.
- **Los reportes respetan la fecha y la estación elegidas,** y se bloquean cuando no hay
  información suficiente para emitirlos.
- **El modo simulación se avisa en pantalla:** cuando está activo, los datos no se guardan en
  el servidor y algunas acciones (como deshacer o eliminar) solo están disponibles en ese
  entorno.
- **Los PDF se generan siempre sobre la información que el usuario está viendo,** salvo que la
  pantalla indique explícitamente que el reporte cubre todo el período o toda la estación.

-- =====================================================================
-- Migración V6: Seguimiento de expedientes físicos
-- Hospital Regional de Occidente (HRO)
--
-- Modela el ciclo de vida físico del expediente (paciente <-> archivo <-> clínica)
-- con el mismo patrón de seguimiento tipo paquete usado en cita -> cita_estado_historial.
--
-- Tres niveles normalizados:
--   expediente             -> el objeto físico (uno por paciente, PK UUID escaneable)
--   expediente_ciclo       -> un "viaje" del expediente, ligado a UNA cita (PK UUID)
--   expediente_movimiento  -> bitácora/checkpoints de cada transición (PK BIGINT)
--
-- Nota de compatibilidad con V5: paciente.id es UUID (paciente_id -> UUID),
-- mientras que cita.id y usuario_referencia.id siguen siendo BIGINT.
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------
-- 1. Catálogo de ubicaciones dentro del archivo
-- ---------------------------------------------------------------------
CREATE TABLE ubicacion_archivo (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    pasillo     VARCHAR(20) NOT NULL,
    estante     VARCHAR(20) NOT NULL,
    balda       VARCHAR(20),
    descripcion VARCHAR(150),
    UNIQUE (pasillo, estante, balda)
);

COMMENT ON TABLE ubicacion_archivo IS
    'Catálogo normalizado de ubicaciones físicas dentro del archivo (pasillo/estante/balda) para evitar texto libre repetido.';

-- ---------------------------------------------------------------------
-- 2. El expediente físico como objeto (existe una sola vez por paciente)
-- ---------------------------------------------------------------------
CREATE TABLE expediente (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    paciente_id         UUID NOT NULL UNIQUE REFERENCES paciente(id) ON DELETE RESTRICT,
    numero_expediente   VARCHAR(30) NOT NULL UNIQUE,
    ubicacion_base_id   BIGINT REFERENCES ubicacion_archivo(id) ON DELETE SET NULL,
    activo              BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en           TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE expediente IS
    'El expediente físico en sí (el "paquete"): existe una sola vez por paciente. PK UUID para poder imprimirse/escancearse como código de barras o QR.';

COMMENT ON COLUMN expediente.numero_expediente IS
    'Desnormalizado intencionalmente desde paciente.numero_expediente: mismo valor, guardado aquí para búsquedas rápidas y para que el código de barras impreso no dependa de un JOIN.';

-- ---------------------------------------------------------------------
-- 3. Un ciclo (viaje) del expediente por cada cita
-- ---------------------------------------------------------------------
CREATE TABLE expediente_ciclo (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expediente_id   UUID NOT NULL REFERENCES expediente(id) ON DELETE RESTRICT,
    cita_id         BIGINT NOT NULL UNIQUE REFERENCES cita(id) ON DELETE RESTRICT,
    estado_actual   VARCHAR(25) NOT NULL DEFAULT 'pendiente_localizar'
                    CHECK (estado_actual IN (
                        'pendiente_localizar','en_busqueda','localizado',
                        'en_transito_entrega','entregado',
                        'en_transito_retorno','archivado','no_localizado'
                    )),
    version         INT NOT NULL DEFAULT 0,
    creado_en       TIMESTAMPTZ NOT NULL DEFAULT now(),
    actualizado_en  TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE expediente_ciclo IS
    'Un ciclo por cita: representa el viaje completo del expediente (búsqueda, entrega a la clínica, retorno a archivo) para esa consulta específica. El mismo expediente acumula un ciclo distinto por cada cita futura.';

-- ---------------------------------------------------------------------
-- 4. Bitácora detallada de movimientos (checkpoints)
-- ---------------------------------------------------------------------
CREATE TABLE expediente_movimiento (
    id                      BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    expediente_ciclo_id     UUID NOT NULL REFERENCES expediente_ciclo(id) ON DELETE CASCADE,
    estado_anterior         VARCHAR(25),
    estado_nuevo            VARCHAR(25) NOT NULL,
    ubicacion_origen_id     BIGINT REFERENCES ubicacion_archivo(id) ON DELETE SET NULL,
    ubicacion_destino_id    BIGINT REFERENCES ubicacion_archivo(id) ON DELETE SET NULL,
    usuario_referencia_id   BIGINT NOT NULL REFERENCES usuario_referencia(id) ON DELETE RESTRICT,
    observacion             TEXT,
    fecha_movimiento        TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE expediente_movimiento IS
    'Auditoría detallada de cada transición del ciclo (equivalente a los checkpoints de un rastreo de paquetería). No se actualiza ni se borra, solo se inserta.';

-- ---------------------------------------------------------------------
-- 5. Índices de apoyo
-- ---------------------------------------------------------------------
CREATE INDEX idx_expediente_ciclo_expediente ON expediente_ciclo(expediente_id);
CREATE INDEX idx_expediente_ciclo_estado     ON expediente_ciclo(estado_actual);
CREATE INDEX idx_expediente_movimiento_ciclo ON expediente_movimiento(expediente_ciclo_id);
CREATE INDEX idx_expediente_movimiento_fecha ON expediente_movimiento(fecha_movimiento);

-- ---------------------------------------------------------------------
-- 6. Trigger de versión/bloqueo optimista para expediente_ciclo
--    (fn_actualizar_marca_tiempo() está acoplada a la tabla cita, por eso
--     se define una función dedicada para este dominio)
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_expediente_ciclo_actualizar_marca_tiempo()
RETURNS TRIGGER AS $$
BEGIN
    NEW.actualizado_en := now();
    IF NEW.version = OLD.version THEN
        NEW.version := OLD.version + 1;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_expediente_ciclo_actualizar_marca_tiempo ON expediente_ciclo;
CREATE TRIGGER trg_expediente_ciclo_actualizar_marca_tiempo
    BEFORE UPDATE ON expediente_ciclo
    FOR EACH ROW
    EXECUTE FUNCTION fn_expediente_ciclo_actualizar_marca_tiempo();

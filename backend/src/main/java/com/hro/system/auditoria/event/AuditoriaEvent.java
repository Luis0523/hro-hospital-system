package com.hro.system.auditoria.event;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AuditoriaEvent {
    private final String tablaAfectada;
    private final Object entidadId;
    private final String accion; // "crear", "actualizar", "eliminar"
    private final Long usuarioReferenciaId;
    private final Object valoresAnteriores;
    private final Object valoresNuevos;
}

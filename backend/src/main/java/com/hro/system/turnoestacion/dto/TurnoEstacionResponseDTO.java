package com.hro.system.turnoestacion.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TurnoEstacionResponseDTO {

    private UUID id;
    private LocalDate fecha;
    private Long estacionId;
    private String estacionNombre;
    private Long especialidadId;
    private String especialidadNombre;
    private String abreviatura;
    private Integer correlativoEspecialidad;
    private String codigo;
    private Integer numeroGeneral;
    private String estado;

    private UUID pacienteId;
    private String pacienteNombre;
    private UUID expedienteId;
    private String numeroExpediente;
    private Long citaId;
    private UUID expedienteCicloId;

    private UUID espacioFisicoId;
    private String espacioFisicoNumero;
    private String espacioFisicoNombre;
    private UUID medicoId;
    private String medicoNombre;
    private String numeroColegiado;

    private Integer llamados;
    private OffsetDateTime ultimoLlamadoEn;

    private String registradoPor;
    private OffsetDateTime registradoEn;
    private String recibidoPor;
    private OffsetDateTime recibidoEn;
    private String asignadoPor;
    private OffsetDateTime asignadoEn;
    private String atendidoPor;
    private OffsetDateTime atendidoEn;
    private String noAsistioPor;
    private OffsetDateTime noAsistioEn;
    private String devueltoPor;
    private OffsetDateTime devueltoEn;
    private String archivadoPor;
    private OffsetDateTime archivadoEn;

    private Boolean activo;
    private String motivoEliminacion;
    private OffsetDateTime eliminadoEn;
    private String observacion;

    private List<TurnoEstacionMovimientoResponseDTO> movimientos;
}

package com.hro.system.carnet.dto;

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
public class CarnetResponseDTO {

    private UUID id;
    private LocalDate fecha;
    private Integer correlativo;
    private Long especialidadId;
    private String especialidadNombre;
    private String especialidadAbreviatura;
    private Long estacionId;
    private String estacionNombre;
    private String numeroExpediente;
    private String pacienteNombre;
    private UUID pacienteId;
    private UUID expedienteId;
    private Long citaId;
    private UUID cicloId;
    private String estado;
    private String observacion;

    private String registradoPor;
    private OffsetDateTime registradoEn;
    private String encontradoPor;
    private OffsetDateTime encontradoEn;
    private String noLocalizadoPor;
    private OffsetDateTime noLocalizadoEn;
    private String despachadoPor;
    private OffsetDateTime despachadoEn;
    private String recibidoPor;
    private OffsetDateTime recibidoEn;
    private String devueltoPor;
    private OffsetDateTime devueltoEn;
    private String recibidoArchivoPor;
    private OffsetDateTime recibidoArchivoEn;

    private List<CarnetMovimientoResponseDTO> movimientos;
}

package com.hro.system.archivo.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CuadernoRojoResponseDTO {

    private UUID id;
    private LocalDate fecha;
    private Integer egresosHospitalarios;
    private Integer sobresEmergencia;
    private Integer sobresSellados;
    private Integer tia;
    private String registradoPor;
    private String actualizadoPor;
    private OffsetDateTime actualizadoEn;
}

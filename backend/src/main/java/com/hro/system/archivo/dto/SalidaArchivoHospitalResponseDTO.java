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
public class SalidaArchivoHospitalResponseDTO {

    private UUID id;
    private LocalDate fecha;
    private Long estacionId;
    private String estacionNombre;
    private String numeroExpediente;
    private String pacienteNombre;
    private Boolean esClinicaMujer;
    /** "activo" o "pasivo" según el umbral configurado; null si no se puede clasificar. */
    private String clasificacion;
    private String registradoPor;
    private OffsetDateTime registradoEn;
}

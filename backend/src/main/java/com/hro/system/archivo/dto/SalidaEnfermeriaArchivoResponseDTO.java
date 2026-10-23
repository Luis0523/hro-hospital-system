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
public class SalidaEnfermeriaArchivoResponseDTO {
    private UUID id;
    private LocalDate fecha;
    private Long estacionId;
    private String estacionNombre;
    private String numeroExpediente;
    private String pacienteNombre;
    private String tipo;
    private Boolean primeraVez;
    private UUID clinicaPersonalId;
    private String clinicaPersonalNombre;
    private String registradoPor;
    private OffsetDateTime registradoEn;
}

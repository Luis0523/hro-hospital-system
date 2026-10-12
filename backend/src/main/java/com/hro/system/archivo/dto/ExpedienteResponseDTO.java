package com.hro.system.archivo.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExpedienteResponseDTO {
    private UUID id;
    private UUID pacienteId;
    private String numeroExpediente;
    private UbicacionArchivoResponseDTO ubicacionBase;
    private Boolean activo;
    /** TRUE si el expediente fue depurado (ya no existe en el sistema). */
    private Boolean depurado;
    private OffsetDateTime depuradoEn;
    private OffsetDateTime creadoEn;
}

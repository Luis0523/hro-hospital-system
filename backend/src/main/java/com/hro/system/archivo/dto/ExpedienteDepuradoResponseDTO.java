package com.hro.system.archivo.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Fila de la bitácora de depuración. Forma consumida por la pantalla de
 * depuración de Archivo (tabla del día, sin correlativo).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExpedienteDepuradoResponseDTO {
    private Long id;
    private UUID expedienteId;
    private String numeroExpediente;
    private String pacienteNombre;
    private String motivo;
    private String usuarioNombre;
    private OffsetDateTime depuradoEn;
}

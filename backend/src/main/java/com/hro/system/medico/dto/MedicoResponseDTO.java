package com.hro.system.medico.dto;

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
public class MedicoResponseDTO {
    private UUID id;
    private String nombres;
    private String numeroColegiado;
    private Long usuarioReferenciaId;
    private Boolean activo;
    private OffsetDateTime creadoEn;
}

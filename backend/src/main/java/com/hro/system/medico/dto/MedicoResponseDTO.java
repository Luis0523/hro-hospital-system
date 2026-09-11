package com.hro.system.medico.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MedicoResponseDTO {
    private Long id;
    private String nombres;
    private String numeroColegiado;
    private Long usuarioReferenciaId;
    private Boolean activo;
    private OffsetDateTime creadoEn;
}

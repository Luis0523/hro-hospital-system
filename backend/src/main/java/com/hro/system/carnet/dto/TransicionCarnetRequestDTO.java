package com.hro.system.carnet.dto;

import lombok.Data;

/** Cuerpo de una transición del carnet (p. ej. observación de "no localizado"). */
@Data
public class TransicionCarnetRequestDTO {

    private String observacion;
}

package com.hro.system.parametro.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;

/** Parámetro configurable del sistema (clave/valor). */
@Entity
@Table(name = "parametro_sistema")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ParametroSistema {

    @Id
    @Column(name = "clave", length = 60)
    private String clave;

    @Column(name = "valor", nullable = false, length = 200)
    private String valor;

    @Column(name = "actualizado_en", nullable = false)
    @Builder.Default
    private OffsetDateTime actualizadoEn = OffsetDateTime.now();
}

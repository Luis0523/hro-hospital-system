package com.hro.system.laboratorio.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "tipo_examen_laboratorio")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TipoExamenLaboratorio {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "nombre", nullable = false, length = 150)
    private String nombre;

    @Column(name = "codigo", unique = true, length = 30)
    private String codigo;

    @Column(name = "activo", nullable = false)
    @Builder.Default
    private Boolean activo = true;
}

package com.hro.system.archivo.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * Ubicación física dentro del archivo (pasillo/estante/balda).
 * Catálogo normalizado para no repetir texto libre en cada expediente.
 */
@Entity
@Table(name = "ubicacion_archivo")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UbicacionArchivo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "pasillo", nullable = false, length = 20)
    private String pasillo;

    @Column(name = "estante", nullable = false, length = 20)
    private String estante;

    @Column(name = "balda", length = 20)
    private String balda;

    @Column(name = "descripcion", length = 150)
    private String descripcion;
}

package com.hro.system.laboratorio.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.OffsetDateTime;

@Entity
@Table(name = "resultado_laboratorio")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ResultadoLaboratorio {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "orden_laboratorio_id", nullable = false, unique = true)
    private OrdenLaboratorio ordenLaboratorio;

    @Column(name = "fecha_resultado")
    private OffsetDateTime fechaResultado;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "contenido", columnDefinition = "jsonb")
    private String contenido;

    @Column(name = "creado_en", nullable = false, updatable = false)
    @Builder.Default
    private OffsetDateTime creadoEn = OffsetDateTime.now();
}

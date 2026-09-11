package com.hro.system.turno.entity;

import com.hro.system.cita.entity.Cita;
import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;

@Entity
@Table(name = "turno")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Turno {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cita_id", nullable = false)
    private Cita cita;

    @Column(name = "numero_turno", nullable = false)
    private Integer numeroTurno;

    @Column(name = "estado", nullable = false, length = 20)
    @Builder.Default
    private String estado = "en_espera"; // en_espera, llamado, atendido, no_responde, reintegrado

    @Column(name = "intentos_llamado", nullable = false)
    @Builder.Default
    private Integer intentosLlamado = 0;

    @Column(name = "hora_generado", nullable = false, updatable = false)
    @Builder.Default
    private OffsetDateTime horaGenerado = OffsetDateTime.now();

    @Column(name = "hora_llamado")
    private OffsetDateTime horaLlamado;

    @Column(name = "hora_atendido")
    private OffsetDateTime horaAtendido;
}

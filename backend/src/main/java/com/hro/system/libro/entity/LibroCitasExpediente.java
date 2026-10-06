package com.hro.system.libro.entity;

import com.hro.system.clinica.entity.Subespecialidad;
import com.hro.system.paciente.entity.Paciente;
import com.hro.system.usuario.entity.UsuarioReferencia;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.OffsetDateTime;

/**
 * Una cita digitalizada del libro físico: expediente + paciente + fecha + subespecialidad.
 */
@Entity
@Table(name = "libro_citas_expediente", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"fecha", "subespecialidad_id", "numero_expediente"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LibroCitasExpediente {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "numero_expediente", nullable = false, length = 30)
    private String numeroExpediente;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "paciente_id", nullable = false)
    private Paciente paciente;

    @Column(name = "fecha", nullable = false)
    private LocalDate fecha;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subespecialidad_id", nullable = false)
    private Subespecialidad subespecialidad;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "creado_por_id", nullable = false)
    private UsuarioReferencia creadoPor;

    @Column(name = "creado_en", nullable = false, updatable = false)
    @Builder.Default
    private OffsetDateTime creadoEn = OffsetDateTime.now();
}

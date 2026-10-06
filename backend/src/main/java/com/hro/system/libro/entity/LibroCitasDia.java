package com.hro.system.libro.entity;

import com.hro.system.usuario.entity.UsuarioReferencia;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Registro diario del libro físico de citas (una fila por fecha) con los contadores
 * del cuaderno y el desglose de expedientes por subespecialidad.
 */
@Entity
@Table(name = "libro_citas_dia")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LibroCitasDia {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "fecha", nullable = false, unique = true)
    private LocalDate fecha;

    @Column(name = "egresos_hospitalarios", nullable = false)
    @Builder.Default
    private Integer egresosHospitalarios = 0;

    @Column(name = "sobres_emergencia", nullable = false)
    @Builder.Default
    private Integer sobresEmergencia = 0;

    @Column(name = "sobres_sellados", nullable = false)
    @Builder.Default
    private Integer sobresSellados = 0;

    @Column(name = "tia", nullable = false)
    @Builder.Default
    private Integer tia = 0;

    @Column(name = "observaciones", columnDefinition = "TEXT")
    private String observaciones;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "creado_por_id", nullable = false)
    private UsuarioReferencia creadoPor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "actualizado_por_id")
    private UsuarioReferencia actualizadoPor;

    @Column(name = "creado_en", nullable = false, updatable = false)
    @Builder.Default
    private OffsetDateTime creadoEn = OffsetDateTime.now();

    @Column(name = "actualizado_en", nullable = false)
    @Builder.Default
    private OffsetDateTime actualizadoEn = OffsetDateTime.now();

    @OneToMany(mappedBy = "libroDia", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<LibroCitasEspecialidad> especialidades = new ArrayList<>();

    public void agregarEspecialidad(LibroCitasEspecialidad detalle) {
        detalle.setLibroDia(this);
        this.especialidades.add(detalle);
    }

    public void limpiarEspecialidades() {
        this.especialidades.clear();
    }
}

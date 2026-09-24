package com.hro.system.archivo.entity;

import com.hro.system.clinica.entity.Subespecialidad;
import com.hro.system.usuario.entity.UsuarioReferencia;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Acta de entrega/recepción de expedientes físicos de una jornada/unidad.
 * Agrupa N expedientes (detalle) e identifica quién entrega y quién recibe.
 */
@Entity
@Table(name = "acta_recepcion")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ActaRecepcion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "numero_acta", nullable = false, unique = true, length = 30)
    private String numeroActa;

    @Column(name = "fecha", nullable = false)
    private LocalDate fecha;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subespecialidad_id")
    private Subespecialidad subespecialidad;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_entrega_id", nullable = false)
    private UsuarioReferencia usuarioEntrega;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_recibe_id")
    private UsuarioReferencia usuarioRecibe;

    @Column(name = "observaciones", columnDefinition = "TEXT")
    private String observaciones;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "creado_por_id", nullable = false)
    private UsuarioReferencia creadoPor;

    @Column(name = "creado_en", nullable = false, updatable = false)
    @Builder.Default
    private OffsetDateTime creadoEn = OffsetDateTime.now();

    @OneToMany(mappedBy = "acta", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ActaRecepcionDetalle> detalles = new ArrayList<>();

    public void agregarDetalle(ActaRecepcionDetalle detalle) {
        detalle.setActa(this);
        this.detalles.add(detalle);
    }
}

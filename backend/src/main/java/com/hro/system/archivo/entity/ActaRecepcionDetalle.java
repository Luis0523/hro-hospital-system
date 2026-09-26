package com.hro.system.archivo.entity;

import com.hro.system.cita.entity.Cita;
import jakarta.persistence.*;
import lombok.*;

/**
 * Detalle de un acta: un expediente físico incluido en la entrega/recepción,
 * con la cita que lo originó (opcional).
 */
@Entity
@Table(name = "acta_recepcion_detalle", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"acta_recepcion_id", "expediente_id"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ActaRecepcionDetalle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "acta_recepcion_id", nullable = false)
    private ActaRecepcion acta;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "expediente_id", nullable = false)
    private Expediente expediente;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cita_id")
    private Cita cita;
}

package com.hro.system.libro.entity;

import com.hro.system.clinica.entity.Subespecialidad;
import jakarta.persistence.*;
import lombok.*;

/**
 * Desglose de un día del libro de citas: cuántos expedientes se registraron
 * para una subespecialidad.
 */
@Entity
@Table(name = "libro_citas_especialidad", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"libro_dia_id", "subespecialidad_id"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LibroCitasEspecialidad {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "libro_dia_id", nullable = false)
    private LibroCitasDia libroDia;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subespecialidad_id", nullable = false)
    private Subespecialidad subespecialidad;

    @Column(name = "cantidad_expedientes", nullable = false)
    @Builder.Default
    private Integer cantidadExpedientes = 0;
}

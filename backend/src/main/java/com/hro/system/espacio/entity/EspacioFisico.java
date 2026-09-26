package com.hro.system.espacio.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Espacio físico (sala / consultorio) del hospital.
 * <p>
 * La especialidad que atiende aquí NO es un atributo permanente: cambia a diario y se
 * resuelve vía {@link AsignacionDiariaEspacio}. Por eso esta entidad ya no referencia
 * subespecialidad.
 */
@Entity
@Table(name = "espacio_fisico", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"numero"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EspacioFisico {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "numero", nullable = false, length = 30)
    private String numero;

    @Column(name = "nivel", nullable = false)
    private Short nivel;

    @Column(name = "capacidad_camillas", nullable = false)
    @Builder.Default
    private Integer capacidadCamillas = 1;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "coordenadas_plano", columnDefinition = "jsonb")
    private String coordenadasPlano;

    @Column(name = "nombre", nullable = false, length = 150)
    private String nombre;

    @Column(name = "ubicacion", length = 150)
    private String ubicacion;

    /**
     * Baja lógica. Cubre tanto baja permanente como fuera de servicio temporal por mantenimiento.
     */
    @Column(name = "activo", nullable = false)
    @Builder.Default
    private Boolean activo = true;

    @Column(name = "creado_en", nullable = false, updatable = false)
    @Builder.Default
    private OffsetDateTime creadoEn = OffsetDateTime.now();
}

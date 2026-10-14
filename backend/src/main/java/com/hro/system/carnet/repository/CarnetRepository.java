package com.hro.system.carnet.repository;

import com.hro.system.carnet.entity.Carnet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CarnetRepository extends JpaRepository<Carnet, UUID> {

    boolean existsByFechaAndNumeroExpediente(LocalDate fecha, String numeroExpediente);

    Optional<Carnet> findByFechaAndNumeroExpediente(LocalDate fecha, String numeroExpediente);

    /** Correlativo diario atómico por especialidad (fn_siguiente_carnet_fecha). */
    @Query(value = "SELECT fn_siguiente_carnet_fecha(CAST(:fecha AS date), :especialidadId)", nativeQuery = true)
    Integer obtenerSiguienteCorrelativo(@Param("fecha") LocalDate fecha,
                                        @Param("especialidadId") Long especialidadId);

    /**
     * Baja el contador diario de una especialidad en 1, pero solo si el correlativo
     * liberado era el último (la cola). Devuelve 0 si no era la cola y, por tanto, se
     * deja un hueco (no se toca el contador). Atómico: evita colisiones con registros
     * concurrentes.
     */
    @Modifying(flushAutomatically = true)
    @Query(value = """
            UPDATE contador_carnet_fecha
               SET correlativo_actual = correlativo_actual - 1
             WHERE fecha = CAST(:fecha AS date)
               AND especialidad_id = :especialidadId
               AND correlativo_actual = :correlativo
            """, nativeQuery = true)
    int liberarCorrelativoSiEsCola(@Param("fecha") LocalDate fecha,
                                   @Param("especialidadId") Long especialidadId,
                                   @Param("correlativo") Integer correlativo);

    /** Los N carnets más recientes del día (para validar la ventana de corrección). */
    List<Carnet> findTop2ByFechaOrderByRegistradoEnDescIdDesc(LocalDate fecha);

    @Query("""
            SELECT c FROM Carnet c
            JOIN FETCH c.especialidad
            LEFT JOIN FETCH c.estacion
            WHERE c.fecha = :fecha
            ORDER BY c.especialidad.nombre ASC, c.correlativo ASC
            """)
    List<Carnet> listarPorFecha(@Param("fecha") LocalDate fecha);
}

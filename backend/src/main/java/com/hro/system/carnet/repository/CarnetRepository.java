package com.hro.system.carnet.repository;

import com.hro.system.carnet.entity.Carnet;
import org.springframework.data.jpa.repository.JpaRepository;
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

    @Query("""
            SELECT c FROM Carnet c
            JOIN FETCH c.especialidad
            LEFT JOIN FETCH c.estacion
            WHERE c.fecha = :fecha
            ORDER BY c.especialidad.nombre ASC, c.correlativo ASC
            """)
    List<Carnet> listarPorFecha(@Param("fecha") LocalDate fecha);
}

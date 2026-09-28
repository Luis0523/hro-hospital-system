package com.hro.system.espacio.repository;

import com.hro.system.espacio.entity.AsignacionDiariaEspacio;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AsignacionDiariaEspacioRepository extends JpaRepository<AsignacionDiariaEspacio, Long> {

    List<AsignacionDiariaEspacio> findByFecha(LocalDate fecha);

    List<AsignacionDiariaEspacio> findByFechaAndSubespecialidadId(LocalDate fecha, Long subespecialidadId);

    /** Asignaciones del día para un conjunto de subespecialidades (tablero/cola por estación). */
    List<AsignacionDiariaEspacio> findByFechaAndSubespecialidadIdIn(LocalDate fecha, Collection<Long> subespecialidadIds);

    Optional<AsignacionDiariaEspacio> findByEspacioFisicoIdAndFecha(UUID espacioFisicoId, LocalDate fecha);

    /** Una misma subespecialidad no puede repetirse en la misma sala/fecha (sí puede haber varias). */
    Optional<AsignacionDiariaEspacio> findByEspacioFisicoIdAndFechaAndSubespecialidadId(
            UUID espacioFisicoId, LocalDate fecha, Long subespecialidadId);

    boolean existsByEspacioFisicoIdAndFechaAndSubespecialidadId(
            UUID espacioFisicoId, LocalDate fecha, Long subespecialidadId);

    List<AsignacionDiariaEspacio> findBySubespecialidadIdAndFecha(Long subespecialidadId, LocalDate fecha);

    boolean existsByEspacioFisicoIdAndFecha(UUID espacioFisicoId, LocalDate fecha);

    long deleteByFecha(LocalDate fecha);

    @Query(value = "SELECT subespecialidad_id, subespecialidad_nombre FROM fn_subespecialidades_sin_asignar(:fecha)", nativeQuery = true)
    List<Object[]> subespecialidadesSinAsignar(@Param("fecha") LocalDate fecha);
}

package com.hro.system.espacio.repository;

import com.hro.system.espacio.entity.AsignacionDiariaEspacio;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface AsignacionDiariaEspacioRepository extends JpaRepository<AsignacionDiariaEspacio, Long> {

    List<AsignacionDiariaEspacio> findByFecha(LocalDate fecha);

    List<AsignacionDiariaEspacio> findByFechaAndSubespecialidadId(LocalDate fecha, Long subespecialidadId);

    Optional<AsignacionDiariaEspacio> findByEspacioFisicoIdAndFecha(Long espacioFisicoId, LocalDate fecha);

    Optional<AsignacionDiariaEspacio> findBySubespecialidadIdAndFecha(Long subespecialidadId, LocalDate fecha);

    boolean existsByEspacioFisicoIdAndFecha(Long espacioFisicoId, LocalDate fecha);

    long deleteByFecha(LocalDate fecha);

    @Query(value = "SELECT subespecialidad_id, subespecialidad_nombre FROM fn_subespecialidades_sin_asignar(:fecha)", nativeQuery = true)
    List<Object[]> subespecialidadesSinAsignar(@Param("fecha") LocalDate fecha);
}

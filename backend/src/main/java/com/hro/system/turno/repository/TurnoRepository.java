package com.hro.system.turno.repository;

import com.hro.system.turno.entity.Turno;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface TurnoRepository extends JpaRepository<Turno, Long> {

    Optional<Turno> findByCitaId(Long citaId);

    List<Turno> findByEstado(String estado);

    @Query(value = "SELECT fn_siguiente_turno(:asignacionDiariaEspacioId)", nativeQuery = true)
    Integer obtenerSiguienteTurnoAtomico(@Param("asignacionDiariaEspacioId") Long asignacionDiariaEspacioId);

    @Query("SELECT t FROM Turno t WHERE t.asignacionDiariaEspacio.id = :asignacionId")
    List<Turno> buscarPorAsignacion(@Param("asignacionId") Long asignacionId);

    @Query("SELECT t FROM Turno t WHERE t.asignacionDiariaEspacio.fecha = :fecha " +
            "AND (:subespecialidadId IS NULL OR t.asignacionDiariaEspacio.subespecialidad.id = :subespecialidadId)")
    List<Turno> buscarPorFechaYSubespecialidad(@Param("fecha") LocalDate fecha, @Param("subespecialidadId") Long subespecialidadId);

    @Query("SELECT t FROM Turno t WHERE t.asignacionDiariaEspacio.fecha = :fecha " +
            "AND (:subespecialidadId IS NULL OR t.asignacionDiariaEspacio.subespecialidad.id = :subespecialidadId) " +
            "AND t.estado = 'no_responde'")
    List<Turno> buscarNoRespondeParaCierre(@Param("fecha") LocalDate fecha, @Param("subespecialidadId") Long subespecialidadId);

    @Query("SELECT t FROM Turno t WHERE t.asignacionDiariaEspacio.id = :asignacionId " +
            "AND t.estado IN ('en_espera', 'llamado', 'reintegrado') ORDER BY t.numeroTurno ASC")
    List<Turno> buscarTurnosEnEsperaPorAsignacion(@Param("asignacionId") Long asignacionId);
}

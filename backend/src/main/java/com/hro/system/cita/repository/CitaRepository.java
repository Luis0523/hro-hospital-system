package com.hro.system.cita.repository;

import com.hro.system.cita.entity.Cita;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

@Repository
public interface CitaRepository extends JpaRepository<Cita, Long> {
    List<Cita> findByPacienteId(UUID pacienteId);
    List<Cita> findByCupoDiarioId(UUID cupoDiarioId);
    List<Cita> findByEstado(String estado);

    @Query("""
            SELECT c FROM Cita c
              JOIN FETCH c.paciente
              JOIN FETCH c.cupoDiario cd
              JOIN FETCH cd.subespecialidadHorario sh
              JOIN FETCH sh.subespecialidad s
            WHERE cd.fecha = :fecha
              AND (:subespecialidadId IS NULL OR s.id = :subespecialidadId)
              AND c.estado NOT IN ('cancelada', 'reprogramada')
            ORDER BY c.horaEstimada ASC
            """)
    List<Cita> buscarCitasParaArchivo(@Param("fecha") LocalDate fecha,
                                      @Param("subespecialidadId") Long subespecialidadId);

    @Query("SELECT COUNT(c) FROM Cita c JOIN c.cupoDiario cd WHERE cd.fecha = :fecha AND c.estado NOT IN ('cancelada', 'reprogramada')")
    long contarCitasActivasEnFecha(@Param("fecha") LocalDate fecha);

    @Query("SELECT c.estado, COUNT(c) FROM Cita c JOIN c.cupoDiario cd WHERE cd.fecha = :fecha GROUP BY c.estado")
    List<Object[]> contarPorEstadoYFecha(@Param("fecha") LocalDate fecha);

    @Query("""
            SELECT COUNT(c) FROM Cita c JOIN c.cupoDiario cd
            WHERE cd.fecha IN (SELECT d.fecha FROM DiaNoLaborable d)
              AND c.estado NOT IN ('cancelada', 'reprogramada', 'atendida', 'no_asistio')
            """)
    long contarCitasActivasEnDiasNoLaborables();

    @Query("""
            SELECT c.estado, COUNT(c) FROM Cita c JOIN c.cupoDiario cd
            WHERE cd.fecha BETWEEN :inicio AND :fin
            GROUP BY c.estado
            """)
    List<Object[]> contarPorEstadoEnRango(@Param("inicio") LocalDate inicio, @Param("fin") LocalDate fin);

    @Query("""
            SELECT e.id, e.nombre, COUNT(c),
                   SUM(CASE WHEN c.estado = 'atendida' THEN 1 ELSE 0 END),
                   SUM(CASE WHEN c.estado = 'no_asistio' THEN 1 ELSE 0 END)
            FROM Cita c
              JOIN c.cupoDiario cd
              JOIN cd.subespecialidadHorario sh
              JOIN sh.subespecialidad s
              JOIN s.especialidad e
            WHERE cd.fecha BETWEEN :inicio AND :fin
            GROUP BY e.id, e.nombre
            ORDER BY COUNT(c) DESC
            """)
    List<Object[]> demandaPorEspecialidadEnRango(@Param("inicio") LocalDate inicio, @Param("fin") LocalDate fin);

    @Query("""
            SELECT c FROM Cita c
              JOIN FETCH c.paciente
              JOIN FETCH c.cupoDiario cd
              JOIN FETCH cd.subespecialidadHorario sh
              JOIN FETCH sh.subespecialidad
            WHERE cd.fecha = :fecha
              AND c.estado NOT IN :estadosNoBloqueantes
            ORDER BY c.horaEstimada ASC
            """)
    List<Cita> buscarCitasBloqueantesEnFecha(@Param("fecha") LocalDate fecha,
                                             @Param("estadosNoBloqueantes") Collection<String> estadosNoBloqueantes);

    @Query("SELECT COUNT(c) FROM Cita c WHERE c.cupoDiario.id = :cupoDiarioId AND c.estado NOT IN ('cancelada', 'reprogramada')")
    long contarCitasActivasEnCupo(@Param("cupoDiarioId") UUID cupoDiarioId);

    @Query(value = "SELECT fn_calcular_hora_estimada(CAST(:horaInicio AS time), :duracion, :posicion)", nativeQuery = true)
    java.time.LocalTime calcularHoraEstimada(
            @Param("horaInicio") java.time.LocalTime horaInicio,
            @Param("duracion") Integer duracion,
            @Param("posicion") Integer posicion
    );

    @Query("SELECT c FROM Cita c WHERE c.cupoDiario.fecha = :fecha AND (:subespecialidadId IS NULL OR c.cupoDiario.subespecialidadHorario.subespecialidad.id = :subespecialidadId) AND c.estado IN ('pendiente', 'confirmada')")
    List<Cita> buscarCitasPendientesParaCierre(@Param("fecha") LocalDate fecha, @Param("subespecialidadId") Long subespecialidadId);

    @Query(value = "SELECT fn_cierre_diario_inasistencias(CAST(:fecha AS date), :subespecialidadId, :usuarioId)", nativeQuery = true)
    int ejecutarCierreDiarioSp(
            @Param("fecha") LocalDate fecha,
            @Param("subespecialidadId") Long subespecialidadId,
            @Param("usuarioId") Long usuarioId
    );
}

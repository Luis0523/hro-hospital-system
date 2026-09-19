package com.hro.system.cita.repository;

import com.hro.system.cita.entity.Cita;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface CitaRepository extends JpaRepository<Cita, Long> {
    List<Cita> findByPacienteId(UUID pacienteId);
    List<Cita> findByCupoDiarioId(UUID cupoDiarioId);
    List<Cita> findByEstado(String estado);

    @Query("SELECT COUNT(c) FROM Cita c JOIN c.cupoDiario cd WHERE cd.fecha = :fecha AND c.estado NOT IN ('cancelada', 'reprogramada')")
    long contarCitasActivasEnFecha(@Param("fecha") LocalDate fecha);

    @Query("SELECT COUNT(c) FROM Cita c WHERE c.cupoDiario.id = :cupoDiarioId AND c.estado NOT IN ('cancelada', 'reprogramada')")
    long contarCitasActivasEnCupo(@Param("cupoDiarioId") UUID cupoDiarioId);

    @Query(value = "SELECT fn_calcular_hora_estimada(CAST(:horaInicio AS time), :duracion, :posicion)", nativeQuery = true)
    java.time.LocalTime calcularHoraEstimada(
            @Param("horaInicio") java.time.LocalTime horaInicio,
            @Param("duracion") Integer duracion,
            @Param("posicion") Integer posicion
    );

    @Query("SELECT c FROM Cita c WHERE c.cupoDiario.fecha = :fecha AND (:subespecialidadId IS NULL OR c.cupoDiario.medicoSubespecialidad.subespecialidad.id = :subespecialidadId) AND c.estado IN ('pendiente', 'confirmada')")
    List<Cita> buscarCitasPendientesParaCierre(@Param("fecha") LocalDate fecha, @Param("subespecialidadId") Long subespecialidadId);

    @Query(value = "SELECT fn_cierre_diario_inasistencias(CAST(:fecha AS date), :subespecialidadId, :usuarioId)", nativeQuery = true)
    int ejecutarCierreDiarioSp(
            @Param("fecha") LocalDate fecha,
            @Param("subespecialidadId") Long subespecialidadId,
            @Param("usuarioId") Long usuarioId
    );
}

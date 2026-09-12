package com.hro.system.cita.repository;

import com.hro.system.cita.entity.Cita;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface CitaRepository extends JpaRepository<Cita, Long> {
    List<Cita> findByPacienteId(Long pacienteId);
    List<Cita> findByCupoDiarioId(Long cupoDiarioId);
    List<Cita> findByEstado(String estado);

    @Query("SELECT COUNT(c) FROM Cita c JOIN c.cupoDiario cd WHERE cd.fecha = :fecha AND c.estado NOT IN ('cancelada', 'reprogramada')")
    long contarCitasActivasEnFecha(@Param("fecha") LocalDate fecha);

    @Query("SELECT COUNT(c) FROM Cita c WHERE c.cupoDiario.id = :cupoDiarioId AND c.estado NOT IN ('cancelada', 'reprogramada')")
    long contarCitasActivasEnCupo(@Param("cupoDiarioId") Long cupoDiarioId);

    @Query(value = "SELECT fn_calcular_hora_estimada(CAST(:horaInicio AS time), :duracion, :posicion)", nativeQuery = true)
    java.time.LocalTime calcularHoraEstimada(
            @Param("horaInicio") java.time.LocalTime horaInicio,
            @Param("duracion") Integer duracion,
            @Param("posicion") Integer posicion
    );

    @Query("SELECT c FROM Cita c WHERE c.cupoDiario.fecha = :fecha AND (:clinicaId IS NULL OR c.cupoDiario.medicoClinica.clinica.id = :clinicaId) AND c.estado IN ('pendiente', 'confirmada')")
    List<Cita> buscarCitasPendientesParaCierre(@Param("fecha") LocalDate fecha, @Param("clinicaId") Long clinicaId);

    @Query(value = "SELECT fn_cierre_diario_inasistencias(CAST(:fecha AS date), :clinicaId, :usuarioId)", nativeQuery = true)
    int ejecutarCierreDiarioSp(
            @Param("fecha") LocalDate fecha,
            @Param("clinicaId") Long clinicaId,
            @Param("usuarioId") Long usuarioId
    );
}

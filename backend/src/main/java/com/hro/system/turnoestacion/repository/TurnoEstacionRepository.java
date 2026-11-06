package com.hro.system.turnoestacion.repository;

import com.hro.system.turnoestacion.entity.EstadoTurnoEstacion;
import com.hro.system.turnoestacion.entity.TurnoEstacion;
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
public interface TurnoEstacionRepository extends JpaRepository<TurnoEstacion, UUID> {

    List<TurnoEstacion> findByFechaAndEstacionIdAndActivoTrueOrderByNumeroGeneralAsc(
            LocalDate fecha, Long estacionId);

    List<TurnoEstacion> findByFechaAndEstacionIdAndEspecialidadIdAndActivoTrueOrderByCorrelativoEspecialidadAsc(
            LocalDate fecha, Long estacionId, Long especialidadId);

    List<TurnoEstacion> findByFechaAndEspacioFisicoIdAndActivoTrueOrderByNumeroGeneralAsc(
            LocalDate fecha, UUID espacioFisicoId);

    List<TurnoEstacion> findByFechaAndActivoTrueOrderByNumeroGeneralAsc(LocalDate fecha);

    List<TurnoEstacion> findByFechaAndEstacionIdAndEstadoAndActivoTrueOrderByNumeroGeneralAsc(
            LocalDate fecha, Long estacionId, EstadoTurnoEstacion estado);

    Optional<TurnoEstacion> findByFechaAndNumeroExpedienteAndActivoTrue(
            LocalDate fecha, String numeroExpediente);

    boolean existsByFechaAndNumeroExpedienteAndActivoTrue(LocalDate fecha, String numeroExpediente);

    boolean existsByFechaAndPacienteIdAndActivoTrue(LocalDate fecha, UUID pacienteId);

    boolean existsByFechaAndCitaIdAndActivoTrue(LocalDate fecha, Long citaId);

    Optional<TurnoEstacion> findFirstByFechaAndEstacionIdAndActivoTrueOrderByNumeroGeneralDesc(
            LocalDate fecha, Long estacionId);

    Optional<TurnoEstacion> findFirstByFechaAndEspecialidadIdAndActivoTrueOrderByCorrelativoEspecialidadDesc(
            LocalDate fecha, Long especialidadId);

    @Query(value = """
            SELECT numero_general, correlativo_especialidad
              FROM fn_asignar_correlativos_turno(:estacionId, :especialidadId, :fecha)
            """, nativeQuery = true)
    List<Object[]> asignarCorrelativos(@Param("estacionId") Long estacionId,
                                       @Param("especialidadId") Long especialidadId,
                                       @Param("fecha") LocalDate fecha);

    long countByFechaAndEstacionIdAndActivoTrue(LocalDate fecha, Long estacionId);

    long countByFechaAndEstacionIdAndEstadoAndActivoTrue(
            LocalDate fecha, Long estacionId, EstadoTurnoEstacion estado);

    List<TurnoEstacion> findByFechaAndEstacionIdAndEstadoInAndActivoTrueOrderByNumeroGeneralAsc(
            LocalDate fecha, Long estacionId, Collection<EstadoTurnoEstacion> estados);
}

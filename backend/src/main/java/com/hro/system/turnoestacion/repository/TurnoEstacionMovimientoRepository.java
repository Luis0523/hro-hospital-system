package com.hro.system.turnoestacion.repository;

import com.hro.system.turnoestacion.entity.TurnoEstacionMovimiento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TurnoEstacionMovimientoRepository extends JpaRepository<TurnoEstacionMovimiento, Long> {

    List<TurnoEstacionMovimiento> findByTurnoEstacionIdOrderByFechaMovimientoAscIdAsc(UUID turnoEstacionId);

    List<TurnoEstacionMovimiento> findByTurnoEstacionIdOrderByFechaMovimientoDescIdDesc(UUID turnoEstacionId);

    Optional<TurnoEstacionMovimiento> findFirstByTurnoEstacionIdAndEstadoNuevoAndEstadoAnteriorNotOrderByFechaMovimientoDescIdDesc(
            UUID turnoEstacionId,
            com.hro.system.turnoestacion.entity.EstadoTurnoEstacion estadoNuevo,
            com.hro.system.turnoestacion.entity.EstadoTurnoEstacion estadoAnterior);

    void deleteByTurnoEstacionId(UUID turnoEstacionId);
}

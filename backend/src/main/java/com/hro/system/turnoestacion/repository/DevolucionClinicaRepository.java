package com.hro.system.turnoestacion.repository;

import com.hro.system.turnoestacion.entity.DevolucionClinica;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DevolucionClinicaRepository extends JpaRepository<DevolucionClinica, Long> {

    List<DevolucionClinica> findByFechaAndEstacionIdAndRevertidoEnIsNull(
            LocalDate fecha, Long estacionId);

    List<DevolucionClinica> findByFechaAndEstacionIdAndEspacioFisicoIdAndRevertidoEnIsNull(
            LocalDate fecha, Long estacionId, UUID espacioFisicoId);

    Optional<DevolucionClinica> findFirstByFechaAndEstacionIdAndEspacioFisicoIdAndRevertidoEnIsNullOrderByCreadoEnDescIdDesc(
            LocalDate fecha, Long estacionId, UUID espacioFisicoId);
}

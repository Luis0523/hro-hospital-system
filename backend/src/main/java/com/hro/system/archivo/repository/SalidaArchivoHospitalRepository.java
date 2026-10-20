package com.hro.system.archivo.repository;

import com.hro.system.archivo.entity.SalidaArchivoHospital;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SalidaArchivoHospitalRepository extends JpaRepository<SalidaArchivoHospital, UUID> {

    List<SalidaArchivoHospital> findByFechaAndEstacionIdOrderByRegistradoEnDesc(LocalDate fecha, Long estacionId);

    List<SalidaArchivoHospital> findByFechaOrderByRegistradoEnDesc(LocalDate fecha);

    Optional<SalidaArchivoHospital> findByFechaAndEstacionIdAndNumeroExpediente(
            LocalDate fecha, Long estacionId, String numeroExpediente);
}

package com.hro.system.archivo.repository;

import com.hro.system.archivo.entity.SalidaEnfermeriaArchivo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SalidaEnfermeriaArchivoRepository extends JpaRepository<SalidaEnfermeriaArchivo, UUID> {

    List<SalidaEnfermeriaArchivo> findByFechaAndEstacionIdOrderByRegistradoEnDesc(
            LocalDate fecha, Long estacionId);

    Optional<SalidaEnfermeriaArchivo> findByFechaAndEstacionIdAndNumeroExpediente(
            LocalDate fecha, Long estacionId, String numeroExpediente);
}

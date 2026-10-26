package com.hro.system.estacion.repository;

import com.hro.system.estacion.entity.ClinicaFijaEstacion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ClinicaFijaEstacionRepository extends JpaRepository<ClinicaFijaEstacion, Long> {

    List<ClinicaFijaEstacion> findByEstacionIdAndActivoTrueOrderByIdAsc(Long estacionId);

    Optional<ClinicaFijaEstacion> findByEstacionIdAndEspecialidadIdAndActivoTrue(
            Long estacionId, Long especialidadId);

    void deleteByEstacionId(Long estacionId);
}

package com.hro.system.estacion.repository;

import com.hro.system.estacion.entity.EstacionSubespecialidad;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface EstacionSubespecialidadRepository extends JpaRepository<EstacionSubespecialidad, Long> {

    List<EstacionSubespecialidad> findByEstacionId(Long estacionId);

    List<EstacionSubespecialidad> findByEstacionIdAndActivoTrue(Long estacionId);

    List<EstacionSubespecialidad> findByEstacionIdIn(Collection<Long> estacionIds);

    /** Pertenencia única: devuelve la estación a la que pertenece la subespecialidad, si alguna. */
    Optional<EstacionSubespecialidad> findBySubespecialidadId(Long subespecialidadId);

    long deleteByEstacionId(Long estacionId);
}

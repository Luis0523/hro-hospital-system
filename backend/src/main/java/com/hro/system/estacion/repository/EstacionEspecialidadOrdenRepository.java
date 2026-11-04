package com.hro.system.estacion.repository;

import com.hro.system.estacion.entity.EstacionEspecialidadOrden;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EstacionEspecialidadOrdenRepository
        extends JpaRepository<EstacionEspecialidadOrden, Long> {

    List<EstacionEspecialidadOrden> findByEstacionIdOrderByOrdenAscIdAsc(Long estacionId);

    void deleteByEstacionId(Long estacionId);
}

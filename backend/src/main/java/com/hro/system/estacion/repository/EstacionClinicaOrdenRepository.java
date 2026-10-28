package com.hro.system.estacion.repository;

import com.hro.system.estacion.entity.EstacionClinicaOrden;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EstacionClinicaOrdenRepository extends JpaRepository<EstacionClinicaOrden, Long> {

    List<EstacionClinicaOrden> findByEstacionIdOrderByOrdenAscIdAsc(Long estacionId);

    void deleteByEstacionId(Long estacionId);
}

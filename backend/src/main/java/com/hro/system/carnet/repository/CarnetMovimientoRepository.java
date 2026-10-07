package com.hro.system.carnet.repository;

import com.hro.system.carnet.entity.CarnetMovimiento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CarnetMovimientoRepository extends JpaRepository<CarnetMovimiento, Long> {

    List<CarnetMovimiento> findByCarnetIdOrderByFechaMovimientoAscIdAsc(UUID carnetId);
}

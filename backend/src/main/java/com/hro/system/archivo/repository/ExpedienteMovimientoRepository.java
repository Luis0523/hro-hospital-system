package com.hro.system.archivo.repository;

import com.hro.system.archivo.entity.ExpedienteMovimiento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ExpedienteMovimientoRepository extends JpaRepository<ExpedienteMovimiento, Long> {

    List<ExpedienteMovimiento> findByExpedienteCicloIdOrderByFechaMovimientoAscIdAsc(UUID expedienteCicloId);
}

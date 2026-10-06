package com.hro.system.integracion.repository;

import com.hro.system.integracion.entity.IntegracionHroLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;

@Repository
public interface IntegracionHroLogRepository extends JpaRepository<IntegracionHroLog, Long> {

    List<IntegracionHroLog> findByNumeroExpedienteOrderByFechaDesc(String numeroExpediente);

    List<IntegracionHroLog> findByFechaGreaterThanEqualOrderByFechaDesc(OffsetDateTime fecha);
}

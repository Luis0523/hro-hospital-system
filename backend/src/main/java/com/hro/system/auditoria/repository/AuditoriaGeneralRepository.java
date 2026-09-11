package com.hro.system.auditoria.repository;

import com.hro.system.auditoria.entity.AuditoriaGeneral;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;

@Repository
public interface AuditoriaGeneralRepository extends JpaRepository<AuditoriaGeneral, Long> {

    Page<AuditoriaGeneral> findByTablaAfectadaIgnoreCase(String tablaAfectada, Pageable pageable);

    Page<AuditoriaGeneral> findByUsuarioReferenciaId(Long usuarioReferenciaId, Pageable pageable);

    Page<AuditoriaGeneral> findByFechaBetween(OffsetDateTime fechaInicio, OffsetDateTime fechaFin, Pageable pageable);
}

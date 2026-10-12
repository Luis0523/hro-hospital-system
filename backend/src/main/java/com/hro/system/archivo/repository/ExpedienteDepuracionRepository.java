package com.hro.system.archivo.repository;

import com.hro.system.archivo.entity.ExpedienteDepuracion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ExpedienteDepuracionRepository extends JpaRepository<ExpedienteDepuracion, Long> {

    boolean existsByExpedienteId(UUID expedienteId);

    Optional<ExpedienteDepuracion> findByExpedienteId(UUID expedienteId);

    Optional<ExpedienteDepuracion> findByNumeroExpedienteAndExpedienteIsNull(String numeroExpediente);

    @Query("""
            SELECT d FROM ExpedienteDepuracion d
              LEFT JOIN FETCH d.usuario
            WHERE d.depuradoEn >= :desde AND d.depuradoEn < :hasta
            ORDER BY d.depuradoEn DESC, d.id DESC
            """)
    List<ExpedienteDepuracion> listarEntre(@Param("desde") OffsetDateTime desde,
                                           @Param("hasta") OffsetDateTime hasta);
}

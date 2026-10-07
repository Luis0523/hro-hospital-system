package com.hro.system.archivo.repository;

import com.hro.system.archivo.entity.ExpedienteMovimiento;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

@Repository
public interface ExpedienteMovimientoRepository extends JpaRepository<ExpedienteMovimiento, Long> {

    List<ExpedienteMovimiento> findByExpedienteCicloIdOrderByFechaMovimientoAscIdAsc(UUID expedienteCicloId);

    /**
     * Bitácora paginada para el Dashboard de Archivo: movimientos de un rango de
     * fechas, opcionalmente filtrados por estado nuevo (transición a ese estado).
     */
    @Query(value = """
            SELECT m FROM ExpedienteMovimiento m
              JOIN FETCH m.expedienteCiclo ec
              JOIN FETCH ec.expediente e
              JOIN FETCH e.paciente p
              JOIN FETCH m.usuarioReferencia u
            WHERE m.fechaMovimiento >= :desde AND m.fechaMovimiento < :hasta
              AND (:estado IS NULL OR m.estadoNuevo = :estado)
            ORDER BY m.fechaMovimiento DESC, m.id DESC
            """,
            countQuery = """
            SELECT COUNT(m) FROM ExpedienteMovimiento m
            WHERE m.fechaMovimiento >= :desde AND m.fechaMovimiento < :hasta
              AND (:estado IS NULL OR m.estadoNuevo = :estado)
            """)
    Page<ExpedienteMovimiento> buscarDashboard(@Param("desde") OffsetDateTime desde,
                                               @Param("hasta") OffsetDateTime hasta,
                                               @Param("estado") String estado,
                                               Pageable pageable);

    /** Movimientos de un conjunto de ciclos (para serie diaria y permanencia). */
    @Query("""
            SELECT m FROM ExpedienteMovimiento m
              JOIN FETCH m.expedienteCiclo ec
            WHERE ec.id IN :cicloIds
            ORDER BY m.fechaMovimiento ASC, m.id ASC
            """)
    List<ExpedienteMovimiento> buscarPorCiclos(@Param("cicloIds") Collection<UUID> cicloIds);
}

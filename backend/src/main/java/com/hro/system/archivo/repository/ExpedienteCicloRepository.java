package com.hro.system.archivo.repository;

import com.hro.system.archivo.entity.ExpedienteCiclo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ExpedienteCicloRepository extends JpaRepository<ExpedienteCiclo, UUID> {

    Optional<ExpedienteCiclo> findByCitaId(Long citaId);

    List<ExpedienteCiclo> findByCitaIdIn(Collection<Long> citaIds);

    List<ExpedienteCiclo> findByExpedienteIdOrderByCreadoEnDesc(UUID expedienteId);

    boolean existsByCitaId(Long citaId);

    @Query("""
            SELECT ec FROM ExpedienteCiclo ec
            WHERE (:estado IS NULL OR ec.estadoActual = :estado)
              AND (:fecha IS NULL OR ec.cita.cupoDiario.fecha = :fecha)
            ORDER BY ec.creadoEn ASC
            """)
    List<ExpedienteCiclo> buscarCola(@Param("estado") String estado, @Param("fecha") LocalDate fecha);

    @Query("""
            SELECT ec FROM ExpedienteCiclo ec
              JOIN FETCH ec.cita c
              JOIN FETCH c.cupoDiario cd
            WHERE cd.fecha = :fecha
            """)
    List<ExpedienteCiclo> buscarPorFecha(@Param("fecha") LocalDate fecha);

    @Query("""
            SELECT ec.estadoActual, COUNT(ec) FROM ExpedienteCiclo ec
              JOIN ec.cita c
              JOIN c.cupoDiario cd
            WHERE cd.fecha = :fecha
            GROUP BY ec.estadoActual
            """)
    List<Object[]> contarPorEstadoYFecha(@Param("fecha") LocalDate fecha);
}

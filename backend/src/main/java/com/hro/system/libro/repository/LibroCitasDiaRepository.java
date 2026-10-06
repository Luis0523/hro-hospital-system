package com.hro.system.libro.repository;

import com.hro.system.libro.entity.LibroCitasDia;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface LibroCitasDiaRepository extends JpaRepository<LibroCitasDia, Long> {

    Optional<LibroCitasDia> findByFecha(LocalDate fecha);

    boolean existsByFecha(LocalDate fecha);

    @Query("""
            SELECT l FROM LibroCitasDia l
            WHERE (:inicio IS NULL OR l.fecha >= :inicio)
              AND (:fin IS NULL OR l.fecha <= :fin)
            ORDER BY l.fecha DESC
            """)
    List<LibroCitasDia> buscarPorRango(@Param("inicio") LocalDate inicio,
                                       @Param("fin") LocalDate fin);
}

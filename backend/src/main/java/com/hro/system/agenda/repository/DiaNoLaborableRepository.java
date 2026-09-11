package com.hro.system.agenda.repository;

import com.hro.system.agenda.entity.DiaNoLaborable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface DiaNoLaborableRepository extends JpaRepository<DiaNoLaborable, Long> {

    Optional<DiaNoLaborable> findByFecha(LocalDate fecha);

    boolean existsByFecha(LocalDate fecha);

    @Query("SELECT d FROM DiaNoLaborable d WHERE d.fecha BETWEEN :inicio AND :fin ORDER BY d.fecha ASC")
    List<DiaNoLaborable> findByRangoFechas(@Param("inicio") LocalDate inicio, @Param("fin") LocalDate fin);

    @Query("SELECT d FROM DiaNoLaborable d WHERE d.fecha >= :hoy ORDER BY d.fecha ASC")
    List<DiaNoLaborable> findFuturos(@Param("hoy") LocalDate hoy);
}

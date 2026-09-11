package com.hro.system.agenda.repository;

import com.hro.system.agenda.entity.CupoDiario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Optional;

@Repository
public interface CupoDiarioRepository extends JpaRepository<CupoDiario, Long> {

    Optional<CupoDiario> findByMedicoClinicaIdAndFecha(Long medicoClinicaId, LocalDate fecha);

    @Query(value = "SELECT fn_incrementar_cupo(:cupoDiarioId)", nativeQuery = true)
    boolean incrementarCupoAtomico(@Param("cupoDiarioId") Long cupoDiarioId);
}

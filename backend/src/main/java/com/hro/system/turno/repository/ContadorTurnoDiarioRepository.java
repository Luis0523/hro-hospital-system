package com.hro.system.turno.repository;

import com.hro.system.turno.entity.ContadorTurnoDiario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Optional;

@Repository
public interface ContadorTurnoDiarioRepository extends JpaRepository<ContadorTurnoDiario, Long> {
    Optional<ContadorTurnoDiario> findByClinicaIdAndFecha(Long clinicaId, LocalDate fecha);
}

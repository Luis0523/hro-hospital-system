package com.hro.system.medico.repository;

import com.hro.system.medico.entity.Medico;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MedicoRepository extends JpaRepository<Medico, Long> {
    Optional<Medico> findByNumeroColegiado(String numeroColegiado);
    List<Medico> findByActivoTrue();
}

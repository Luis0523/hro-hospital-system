package com.hro.system.medico.repository;

import com.hro.system.medico.entity.Medico;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MedicoRepository extends JpaRepository<Medico, UUID> {

    Optional<Medico> findByNumeroColegiado(String numeroColegiado);

    List<Medico> findByActivoTrue();

    List<Medico> findByActivo(boolean activo);

    boolean existsByNumeroColegiadoAndIdNot(String numeroColegiado, UUID id);
}

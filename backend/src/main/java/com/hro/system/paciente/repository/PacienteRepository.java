package com.hro.system.paciente.repository;

import com.hro.system.paciente.entity.Paciente;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PacienteRepository extends JpaRepository<Paciente, Long> {
    Optional<Paciente> findByDpi(String dpi);
    Optional<Paciente> findByNumeroExpediente(String numeroExpediente);
}

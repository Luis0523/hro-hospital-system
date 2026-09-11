package com.hro.system.paciente.repository;

import com.hro.system.paciente.entity.Paciente;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PacienteRepository extends JpaRepository<Paciente, Long> {

    Optional<Paciente> findByDpi(String dpi);

    Optional<Paciente> findByNumeroExpediente(String numeroExpediente);

    boolean existsByNumeroExpedienteAndIdNot(String numeroExpediente, Long id);

    @Query("SELECT p FROM Paciente p WHERE " +
           "LOWER(p.dpi) LIKE LOWER(CONCAT('%', :filtro, '%')) OR " +
           "LOWER(p.numeroExpediente) LIKE LOWER(CONCAT('%', :filtro, '%')) OR " +
           "LOWER(p.nombres) LIKE LOWER(CONCAT('%', :filtro, '%')) OR " +
           "LOWER(p.apellidos) LIKE LOWER(CONCAT('%', :filtro, '%')) OR " +
           "LOWER(CONCAT(p.nombres, ' ', p.apellidos)) LIKE LOWER(CONCAT('%', :filtro, '%'))")
    Page<Paciente> buscarMulticriterio(@Param("filtro") String filtro, Pageable pageable);
}

package com.hro.system.archivo.repository;

import com.hro.system.archivo.entity.Expediente;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ExpedienteRepository extends JpaRepository<Expediente, UUID> {

    Optional<Expediente> findByPacienteId(UUID pacienteId);

    Optional<Expediente> findByNumeroExpediente(String numeroExpediente);

    @Query("""
            SELECT e FROM Expediente e JOIN e.paciente p
            WHERE (:filtro IS NULL OR :filtro = ''
                   OR LOWER(e.numeroExpediente) LIKE LOWER(CONCAT('%', :filtro, '%'))
                   OR LOWER(p.dpi) LIKE LOWER(CONCAT('%', :filtro, '%'))
                   OR LOWER(p.nombres) LIKE LOWER(CONCAT('%', :filtro, '%'))
                   OR LOWER(p.apellidos) LIKE LOWER(CONCAT('%', :filtro, '%')))
            ORDER BY p.apellidos ASC, p.nombres ASC
            """)
    Page<Expediente> buscar(@Param("filtro") String filtro, Pageable pageable);
}

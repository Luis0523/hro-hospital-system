package com.hro.system.libro.repository;

import com.hro.system.libro.entity.LibroCitasExpediente;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface LibroCitasExpedienteRepository extends JpaRepository<LibroCitasExpediente, Long> {

    boolean existsByFechaAndSubespecialidadIdAndNumeroExpediente(
            LocalDate fecha, Long subespecialidadId, String numeroExpediente);

    List<LibroCitasExpediente> findByFechaOrderBySubespecialidadIdAscNumeroExpedienteAsc(LocalDate fecha);
}

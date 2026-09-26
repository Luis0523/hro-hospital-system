package com.hro.system.laboratorio.repository;

import com.hro.system.laboratorio.entity.MensajeHl7Log;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface MensajeHl7LogRepository extends JpaRepository<MensajeHl7Log, UUID> {
    List<MensajeHl7Log> findByOrdenLaboratorioId(UUID ordenLaboratorioId);
}

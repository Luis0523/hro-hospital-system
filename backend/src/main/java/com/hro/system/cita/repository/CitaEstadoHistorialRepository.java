package com.hro.system.cita.repository;

import com.hro.system.cita.entity.CitaEstadoHistorial;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CitaEstadoHistorialRepository extends JpaRepository<CitaEstadoHistorial, Long> {
    List<CitaEstadoHistorial> findByCitaIdOrderByFechaCambioDesc(Long citaId);
}

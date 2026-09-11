package com.hro.system.cita.repository;

import com.hro.system.cita.entity.Cita;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CitaRepository extends JpaRepository<Cita, Long> {
    List<Cita> findByPacienteId(Long pacienteId);
    List<Cita> findByCupoDiarioId(Long cupoDiarioId);
    List<Cita> findByEstado(String estado);
}

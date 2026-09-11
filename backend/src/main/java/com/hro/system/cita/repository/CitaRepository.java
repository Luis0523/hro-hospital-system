package com.hro.system.cita.repository;

import com.hro.system.cita.entity.Cita;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface CitaRepository extends JpaRepository<Cita, Long> {
    List<Cita> findByPacienteId(Long pacienteId);
    List<Cita> findByCupoDiarioId(Long cupoDiarioId);
    List<Cita> findByEstado(String estado);

    @Query("SELECT COUNT(c) FROM Cita c JOIN c.cupoDiario cd WHERE cd.fecha = :fecha AND c.estado NOT IN ('cancelada')")
    long contarCitasActivasEnFecha(@Param("fecha") LocalDate fecha);
}

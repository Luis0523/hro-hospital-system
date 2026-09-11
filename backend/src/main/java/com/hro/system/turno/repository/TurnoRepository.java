package com.hro.system.turno.repository;

import com.hro.system.turno.entity.Turno;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface TurnoRepository extends JpaRepository<Turno, Long> {

    Optional<Turno> findByCitaId(Long citaId);
    List<Turno> findByEstado(String estado);

    @Query(value = "SELECT fn_siguiente_turno(:clinicaId, :fecha)", nativeQuery = true)
    Integer obtenerSiguienteTurnoAtomico(@Param("clinicaId") Long clinicaId, @Param("fecha") LocalDate fecha);
}

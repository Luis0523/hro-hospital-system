package com.hro.system.agenda.repository;

import com.hro.system.agenda.entity.CupoDiario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface CupoDiarioRepository extends JpaRepository<CupoDiario, Long> {

    Optional<CupoDiario> findByMedicoSubespecialidadIdAndFecha(Long medicoSubespecialidadId, LocalDate fecha);

    @Query(value = "SELECT fn_incrementar_cupo(:cupoDiarioId)", nativeQuery = true)
    boolean incrementarCupoAtomico(@Param("cupoDiarioId") Long cupoDiarioId);

    @Query(value = "SELECT fn_decrementar_cupo(:cupoDiarioId)", nativeQuery = true)
    boolean decrementarCupoAtomico(@Param("cupoDiarioId") Long cupoDiarioId);

    @Modifying
    @Query(value = """
            INSERT INTO cupo_diario (medico_subespecialidad_id, fecha, capacidad_maxima, cupos_ocupados, creado_en)
            VALUES (:medicoSubespecialidadId, :fecha, :capacidadMaxima, 0, now())
            ON CONFLICT (medico_subespecialidad_id, fecha) DO NOTHING
            """, nativeQuery = true)
    int inicializarCupoSiNoExiste(
            @Param("medicoSubespecialidadId") Long medicoSubespecialidadId,
            @Param("fecha") LocalDate fecha,
            @Param("capacidadMaxima") Integer capacidadMaxima
    );

    List<CupoDiario> findByMedicoSubespecialidad_Subespecialidad_IdAndFechaBetween(Long subespecialidadId, LocalDate desde, LocalDate hasta);

    List<CupoDiario> findByMedicoSubespecialidad_Medico_IdAndFechaBetween(Long medicoId, LocalDate desde, LocalDate hasta);

    List<CupoDiario> findByMedicoSubespecialidadIdAndFechaBetween(Long medicoSubespecialidadId, LocalDate desde, LocalDate hasta);
}

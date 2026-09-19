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
import java.util.UUID;

@Repository
public interface CupoDiarioRepository extends JpaRepository<CupoDiario, UUID> {

    Optional<CupoDiario> findByMedicoSubespecialidadIdAndFecha(UUID medicoSubespecialidadId, LocalDate fecha);

    @Query(value = "SELECT fn_incrementar_cupo(:cupoDiarioId)", nativeQuery = true)
    boolean incrementarCupoAtomico(@Param("cupoDiarioId") UUID cupoDiarioId);

    @Query(value = "SELECT fn_decrementar_cupo(:cupoDiarioId)", nativeQuery = true)
    boolean decrementarCupoAtomico(@Param("cupoDiarioId") UUID cupoDiarioId);

    @Modifying
    @Query(value = """
            INSERT INTO cupo_diario (medico_subespecialidad_id, fecha, capacidad_maxima, cupos_ocupados, creado_en)
            VALUES (:medicoSubespecialidadId, :fecha, :capacidadMaxima, 0, now())
            ON CONFLICT (medico_subespecialidad_id, fecha) DO NOTHING
            """, nativeQuery = true)
    int inicializarCupoSiNoExiste(
            @Param("medicoSubespecialidadId") UUID medicoSubespecialidadId,
            @Param("fecha") LocalDate fecha,
            @Param("capacidadMaxima") Integer capacidadMaxima
    );

    List<CupoDiario> findByMedicoSubespecialidad_Subespecialidad_IdAndFechaBetween(Long subespecialidadId, LocalDate desde, LocalDate hasta);

    List<CupoDiario> findByMedicoSubespecialidad_Medico_IdAndFechaBetween(UUID medicoId, LocalDate desde, LocalDate hasta);

    List<CupoDiario> findByMedicoSubespecialidadIdAndFechaBetween(UUID medicoSubespecialidadId, LocalDate desde, LocalDate hasta);
}

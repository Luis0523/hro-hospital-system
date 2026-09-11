package com.hro.system.agenda.repository;

import com.hro.system.agenda.entity.CupoDiario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Optional;

@Repository
public interface CupoDiarioRepository extends JpaRepository<CupoDiario, Long> {

    Optional<CupoDiario> findByMedicoClinicaIdAndFecha(Long medicoClinicaId, LocalDate fecha);

    @Query(value = "SELECT fn_incrementar_cupo(:cupoDiarioId)", nativeQuery = true)
    boolean incrementarCupoAtomico(@Param("cupoDiarioId") Long cupoDiarioId);

    @Query(value = "SELECT fn_decrementar_cupo(:cupoDiarioId)", nativeQuery = true)
    boolean decrementarCupoAtomico(@Param("cupoDiarioId") Long cupoDiarioId);

    @org.springframework.data.jpa.repository.Modifying
    @Query(value = """
            INSERT INTO cupo_diario (medico_clinica_id, fecha, capacidad_maxima, cupos_ocupados, creado_en)
            VALUES (:medicoClinicaId, :fecha, :capacidadMaxima, 0, now())
            ON CONFLICT (medico_clinica_id, fecha) DO NOTHING
            """, nativeQuery = true)
    int inicializarCupoSiNoExiste(
            @Param("medicoClinicaId") Long medicoClinicaId,
            @Param("fecha") LocalDate fecha,
            @Param("capacidadMaxima") Integer capacidadMaxima
    );

    java.util.List<CupoDiario> findByMedicoClinica_Clinica_IdAndFechaBetween(Long clinicaId, LocalDate desde, LocalDate hasta);

    java.util.List<CupoDiario> findByMedicoClinica_Medico_IdAndFechaBetween(Long medicoId, LocalDate desde, LocalDate hasta);

    java.util.List<CupoDiario> findByMedicoClinicaIdAndFechaBetween(Long medicoClinicaId, LocalDate desde, LocalDate hasta);
}

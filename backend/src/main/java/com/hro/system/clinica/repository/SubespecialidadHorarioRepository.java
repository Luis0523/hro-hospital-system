package com.hro.system.clinica.repository;

import com.hro.system.clinica.entity.SubespecialidadHorario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SubespecialidadHorarioRepository extends JpaRepository<SubespecialidadHorario, UUID> {

    List<SubespecialidadHorario> findBySubespecialidadIdOrderByDiaSemanaAsc(Long subespecialidadId);

    List<SubespecialidadHorario> findBySubespecialidadIdAndActivoTrue(Long subespecialidadId);

    List<SubespecialidadHorario> findByActivoTrue();

    Optional<SubespecialidadHorario> findBySubespecialidadIdAndDiaSemana(Long subespecialidadId, Short diaSemana);

    boolean existsBySubespecialidadIdAndDiaSemana(Long subespecialidadId, Short diaSemana);

    boolean existsBySubespecialidadIdAndDiaSemanaAndIdNot(Long subespecialidadId, Short diaSemana, UUID id);
}

package com.hro.system.medico.repository;

import com.hro.system.medico.entity.MedicoSubespecialidad;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MedicoSubespecialidadRepository extends JpaRepository<MedicoSubespecialidad, UUID> {

    List<MedicoSubespecialidad> findBySubespecialidadIdAndActivoTrue(Long subespecialidadId);

    List<MedicoSubespecialidad> findByMedicoIdAndActivoTrue(UUID medicoId);

    List<MedicoSubespecialidad> findBySubespecialidadId(Long subespecialidadId);

    List<MedicoSubespecialidad> findByMedicoId(UUID medicoId);

    List<MedicoSubespecialidad> findByMedicoIdAndSubespecialidadId(UUID medicoId, Long subespecialidadId);

    List<MedicoSubespecialidad> findByActivoTrue();

    List<MedicoSubespecialidad> findBySubespecialidadIdAndDiaSemanaAndActivoTrue(Long subespecialidadId, Short diaSemana);

    Optional<MedicoSubespecialidad> findByMedicoIdAndSubespecialidadIdAndDiaSemana(UUID medicoId, Long subespecialidadId, Short diaSemana);
}

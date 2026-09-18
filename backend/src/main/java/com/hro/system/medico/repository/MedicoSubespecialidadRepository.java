package com.hro.system.medico.repository;

import com.hro.system.medico.entity.MedicoSubespecialidad;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MedicoSubespecialidadRepository extends JpaRepository<MedicoSubespecialidad, Long> {

    List<MedicoSubespecialidad> findBySubespecialidadIdAndActivoTrue(Long subespecialidadId);

    List<MedicoSubespecialidad> findByMedicoIdAndActivoTrue(Long medicoId);

    List<MedicoSubespecialidad> findBySubespecialidadId(Long subespecialidadId);

    List<MedicoSubespecialidad> findByMedicoId(Long medicoId);

    List<MedicoSubespecialidad> findByMedicoIdAndSubespecialidadId(Long medicoId, Long subespecialidadId);

    List<MedicoSubespecialidad> findByActivoTrue();

    List<MedicoSubespecialidad> findBySubespecialidadIdAndDiaSemanaAndActivoTrue(Long subespecialidadId, Short diaSemana);

    Optional<MedicoSubespecialidad> findByMedicoIdAndSubespecialidadIdAndDiaSemana(Long medicoId, Long subespecialidadId, Short diaSemana);
}

package com.hro.system.medico.repository;

import com.hro.system.medico.entity.MedicoSubespecialidad;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
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

    List<MedicoSubespecialidad> findByActivo(boolean activo);

    List<MedicoSubespecialidad> findBySubespecialidadIdAndDiaSemanaAndActivoTrue(Long subespecialidadId, Short diaSemana);

    List<MedicoSubespecialidad> findByMedicoIdAndDiaSemanaAndActivoTrue(UUID medicoId, Short diaSemana);

    Optional<MedicoSubespecialidad> findByMedicoIdAndSubespecialidadIdAndDiaSemana(UUID medicoId, Long subespecialidadId, Short diaSemana);

    @Query("""
            SELECT ms FROM MedicoSubespecialidad ms
            WHERE (:medicoId IS NULL OR ms.medico.id = :medicoId)
              AND (:subespecialidadId IS NULL OR ms.subespecialidad.id = :subespecialidadId)
              AND (:diaSemana IS NULL OR ms.diaSemana = :diaSemana)
              AND (:activo IS NULL OR ms.activo = :activo)
            ORDER BY ms.diaSemana ASC, ms.horaInicio ASC
            """)
    List<MedicoSubespecialidad> buscarPorFiltros(@Param("medicoId") UUID medicoId,
                                                 @Param("subespecialidadId") Long subespecialidadId,
                                                 @Param("diaSemana") Short diaSemana,
                                                 @Param("activo") Boolean activo);
}

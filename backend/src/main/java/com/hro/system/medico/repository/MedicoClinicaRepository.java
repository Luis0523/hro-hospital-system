package com.hro.system.medico.repository;

import com.hro.system.medico.entity.MedicoClinica;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MedicoClinicaRepository extends JpaRepository<MedicoClinica, Long> {

    List<MedicoClinica> findByClinicaIdAndActivoTrue(Long clinicaId);

    List<MedicoClinica> findByMedicoIdAndActivoTrue(Long medicoId);

    List<MedicoClinica> findByClinicaIdAndDiaSemanaAndActivoTrue(Long clinicaId, Short diaSemana);

    Optional<MedicoClinica> findByMedicoIdAndClinicaIdAndDiaSemana(Long medicoId, Long clinicaId, Short diaSemana);
}

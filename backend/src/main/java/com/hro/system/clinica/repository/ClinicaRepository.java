package com.hro.system.clinica.repository;

import com.hro.system.clinica.entity.Clinica;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ClinicaRepository extends JpaRepository<Clinica, Long> {

    List<Clinica> findByActivoTrue();

    List<Clinica> findBySubespecialidadIdAndActivoTrue(Long subespecialidadId);

    List<Clinica> findBySubespecialidadId(Long subespecialidadId);

    @Query("SELECT c FROM Clinica c JOIN c.subespecialidad s WHERE s.especialidad.id = :especialidadId AND c.activo = true")
    List<Clinica> findByEspecialidadIdAndActivoTrue(@Param("especialidadId") Long especialidadId);
}

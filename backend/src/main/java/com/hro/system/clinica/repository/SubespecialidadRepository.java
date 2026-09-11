package com.hro.system.clinica.repository;

import com.hro.system.clinica.entity.Subespecialidad;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SubespecialidadRepository extends JpaRepository<Subespecialidad, Long> {

    List<Subespecialidad> findByActivoTrue();

    List<Subespecialidad> findByEspecialidadIdAndActivoTrue(Long especialidadId);

    List<Subespecialidad> findByEspecialidadId(Long especialidadId);

    Optional<Subespecialidad> findByEspecialidadIdAndNombreIgnoreCase(Long especialidadId, String nombre);

    boolean existsByEspecialidadIdAndNombreIgnoreCaseAndIdNot(Long especialidadId, String nombre, Long id);
}

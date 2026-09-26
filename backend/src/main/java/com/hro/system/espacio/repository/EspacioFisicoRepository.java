package com.hro.system.espacio.repository;

import com.hro.system.espacio.entity.EspacioFisico;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EspacioFisicoRepository extends JpaRepository<EspacioFisico, UUID> {

    List<EspacioFisico> findByActivoTrue();

    List<EspacioFisico> findByActivo(boolean activo);

    List<EspacioFisico> findByNivelAndActivoTrue(Short nivel);

    List<EspacioFisico> findByNivelAndActivo(Short nivel, boolean activo);

    List<EspacioFisico> findByNivel(Short nivel);

    Optional<EspacioFisico> findByNumero(String numero);
}

package com.hro.system.espacio.repository;

import com.hro.system.espacio.entity.EspacioFisico;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EspacioFisicoRepository extends JpaRepository<EspacioFisico, Long> {

    List<EspacioFisico> findByActivoTrue();

    List<EspacioFisico> findByNivelAndActivoTrue(Short nivel);

    Optional<EspacioFisico> findByNumero(String numero);
}

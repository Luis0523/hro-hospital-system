package com.hro.system.espacio.repository;

import com.hro.system.espacio.entity.PlanoHospital;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PlanoHospitalRepository extends JpaRepository<PlanoHospital, Long> {

    Optional<PlanoHospital> findByNivel(Short nivel);
}

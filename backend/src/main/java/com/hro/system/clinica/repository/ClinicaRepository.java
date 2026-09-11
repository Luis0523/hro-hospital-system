package com.hro.system.clinica.repository;

import com.hro.system.clinica.entity.Clinica;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ClinicaRepository extends JpaRepository<Clinica, Long> {
    List<Clinica> findByActivoTrue();
}

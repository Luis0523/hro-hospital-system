package com.hro.system.archivo.repository;

import com.hro.system.archivo.entity.RegistroCuadernoRojo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RegistroCuadernoRojoRepository extends JpaRepository<RegistroCuadernoRojo, UUID> {

    Optional<RegistroCuadernoRojo> findByFecha(LocalDate fecha);

    List<RegistroCuadernoRojo> findByFechaBetweenOrderByFechaDesc(LocalDate inicio, LocalDate fin);

    List<RegistroCuadernoRojo> findAllByOrderByFechaDesc();
}

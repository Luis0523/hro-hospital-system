package com.hro.system.espacio.repository;

import com.hro.system.espacio.entity.CierreAsignacionDiaria;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;

@Repository
public interface CierreAsignacionDiariaRepository extends JpaRepository<CierreAsignacionDiaria, LocalDate> {
}

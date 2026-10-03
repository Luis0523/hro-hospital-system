package com.hro.system.acceso.repository;

import com.hro.system.acceso.entity.RolPagina;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RolPaginaRepository extends JpaRepository<RolPagina, Long> {

    List<RolPagina> findByActivoTrueOrderByRolAscPaginaAsc();

    List<RolPagina> findByRolOrderByPaginaAsc(String rol);

    long deleteByRol(String rol);
}

package com.hro.system.archivo.repository;

import com.hro.system.archivo.entity.ActaRecepcion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface ActaRecepcionRepository extends JpaRepository<ActaRecepcion, Long>, JpaSpecificationExecutor<ActaRecepcion> {

    long countByNumeroActaStartingWith(String prefijo);
}

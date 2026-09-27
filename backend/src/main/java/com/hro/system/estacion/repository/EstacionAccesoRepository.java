package com.hro.system.estacion.repository;

import com.hro.system.estacion.entity.EstacionAcceso;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EstacionAccesoRepository extends JpaRepository<EstacionAcceso, Long> {

    /** Accesos abiertos (sin salida) de un usuario; se cierran al entrar a otra estación. */
    List<EstacionAcceso> findByUsuarioReferenciaIdAndSalidoEnIsNull(Long usuarioReferenciaId);

    List<EstacionAcceso> findByEstacionIdOrderByEntradoEnDesc(Long estacionId);

    List<EstacionAcceso> findByEstacionIdAndSalidoEnIsNull(Long estacionId);
}

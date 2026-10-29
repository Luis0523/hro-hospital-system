package com.hro.system.archivo.repository;

import com.hro.system.archivo.entity.EstacionEtiquetaArchivo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EstacionEtiquetaArchivoRepository extends JpaRepository<EstacionEtiquetaArchivo, Long> {

    List<EstacionEtiquetaArchivo> findByEstacionIdOrderByOrdenAscIdAsc(Long estacionId);

    Optional<EstacionEtiquetaArchivo> findByEstacionIdAndEtiquetaId(Long estacionId, Long etiquetaId);

    @Query("""
            SELECT a FROM EstacionEtiquetaArchivo a
            JOIN FETCH a.etiqueta e
            WHERE a.estacion.id = :estacionId
              AND a.activo = TRUE
              AND e.activo = TRUE
            ORDER BY a.orden ASC, e.orden ASC, e.id ASC
            """)
    List<EstacionEtiquetaArchivo> listarActivasPorEstacion(@Param("estacionId") Long estacionId);

    long countByEstacionIdAndEtiquetaIdAndActivoTrue(Long estacionId, Long etiquetaId);
}

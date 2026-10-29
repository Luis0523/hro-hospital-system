package com.hro.system.archivo.repository;

import com.hro.system.archivo.entity.EtiquetaArchivo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EtiquetaArchivoRepository extends JpaRepository<EtiquetaArchivo, Long> {

    List<EtiquetaArchivo> findAllByOrderByOrdenAscIdAsc();

    List<EtiquetaArchivo> findByActivoOrderByOrdenAscIdAsc(Boolean activo);

    Optional<EtiquetaArchivo> findByCodigo(String codigo);

    boolean existsByCodigo(String codigo);

    boolean existsByCodigoAndIdNot(String codigo, Long id);
}

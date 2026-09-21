package com.hro.system.archivo.repository;

import com.hro.system.archivo.entity.UbicacionArchivo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UbicacionArchivoRepository extends JpaRepository<UbicacionArchivo, Long> {

    Optional<UbicacionArchivo> findByPasilloAndEstanteAndBalda(String pasillo, String estante, String balda);
}

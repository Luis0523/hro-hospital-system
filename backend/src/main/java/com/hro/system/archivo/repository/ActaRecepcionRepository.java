package com.hro.system.archivo.repository;

import com.hro.system.archivo.entity.ActaRecepcion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface ActaRecepcionRepository extends JpaRepository<ActaRecepcion, Long> {

    long countByNumeroActaStartingWith(String prefijo);

    @Query("""
            SELECT a FROM ActaRecepcion a
            WHERE (:fecha IS NULL OR a.fecha = :fecha)
              AND (:subespecialidadId IS NULL OR a.subespecialidad.id = :subespecialidadId)
            ORDER BY a.creadoEn DESC
            """)
    List<ActaRecepcion> buscar(@Param("fecha") LocalDate fecha,
                               @Param("subespecialidadId") Long subespecialidadId);
}

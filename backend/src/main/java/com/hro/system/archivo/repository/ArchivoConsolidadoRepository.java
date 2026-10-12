package com.hro.system.archivo.repository;

import com.hro.system.carnet.entity.Carnet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

/**
 * Agregados de consolidado de Archivo. La agregación vive en la BD (vistas y
 * funciones de la migración V23), por lo que la aplicación no ejecuta GROUP BY
 * sobre tablas grandes: solo invoca funciones/vistas ya optimizadas por índice.
 */
@Repository
public interface ArchivoConsolidadoRepository extends JpaRepository<Carnet, java.util.UUID> {

    /**
     * Consolidado de un día por especialidad.
     * Columnas: [especialidad_id (Long), especialidad_nombre (String), total (Long)].
     */
    @Query(value = "SELECT * FROM fn_archivo_consolidado_diario(CAST(:fecha AS date))", nativeQuery = true)
    List<Object[]> consolidadoDiario(@Param("fecha") LocalDate fecha);

    /**
     * Consolidado por especialidad y día en un rango.
     * Columnas: [fecha (LocalDate), especialidad_id (Long), especialidad_nombre (String), total (Long)].
     */
    @Query(value = "SELECT * FROM fn_archivo_consolidado_mensual(CAST(:desde AS date), CAST(:hasta AS date))",
            nativeQuery = true)
    List<Object[]> consolidadoMensual(@Param("desde") LocalDate desde, @Param("hasta") LocalDate hasta);

    /**
     * Resumen de un día: [total_carnets (Long), total_depurados (Long)] o vacío.
     */
    @Query(value = "SELECT total_carnets, total_depurados FROM vw_archivo_resumen_diario WHERE fecha = CAST(:fecha AS date)",
            nativeQuery = true)
    List<Object[]> resumenDiario(@Param("fecha") LocalDate fecha);

    /**
     * Resumen por día en un rango: [fecha (LocalDate), total_carnets (Long), total_depurados (Long)].
     */
    @Query(value = """
            SELECT fecha, total_carnets, total_depurados
            FROM vw_archivo_resumen_diario
            WHERE fecha BETWEEN CAST(:desde AS date) AND CAST(:hasta AS date)
            ORDER BY fecha ASC
            """, nativeQuery = true)
    List<Object[]> resumenRango(@Param("desde") LocalDate desde, @Param("hasta") LocalDate hasta);
}

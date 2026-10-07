package com.hro.system.archivo.repository;

import com.hro.system.archivo.entity.ExpedienteCiclo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ExpedienteCicloRepository extends JpaRepository<ExpedienteCiclo, UUID> {

    Optional<ExpedienteCiclo> findByCitaId(Long citaId);

    List<ExpedienteCiclo> findByCitaIdIn(Collection<Long> citaIds);

    List<ExpedienteCiclo> findByExpedienteIdOrderByCreadoEnDesc(UUID expedienteId);

    boolean existsByCitaId(Long citaId);

    /**
     * Ciclos del expediente sin cita asociada (check-in de Fase 1) que siguen abiertos.
     * Se usa para la idempotencia del check-in cuando no hay cita vinculada.
     */
    @Query("""
            SELECT ec FROM ExpedienteCiclo ec
            WHERE ec.expediente.id = :expedienteId
              AND ec.cita IS NULL
              AND ec.estadoActual <> 'archivado'
            ORDER BY ec.creadoEn DESC
            """)
    List<ExpedienteCiclo> buscarCiclosSinCitaActivos(@Param("expedienteId") UUID expedienteId);

    @Query("""
            SELECT ec FROM ExpedienteCiclo ec
              JOIN ec.cita c
            WHERE (:estado IS NULL OR ec.estadoActual = :estado)
            ORDER BY ec.creadoEn ASC
            """)
    List<ExpedienteCiclo> buscarColaSinFecha(@Param("estado") String estado);

    @Query("""
            SELECT ec FROM ExpedienteCiclo ec
              JOIN ec.cita c
              JOIN c.cupoDiario cd
            WHERE (:estado IS NULL OR ec.estadoActual = :estado)
              AND cd.fecha = :fecha
            ORDER BY ec.creadoEn ASC
            """)
    List<ExpedienteCiclo> buscarColaConFecha(@Param("estado") String estado,
                                             @Param("fecha") LocalDate fecha);

    /**
     * Cola de trabajo filtrada por área(s) de atención (subespecialidades de la cita).
     * Solo considera ciclos con cita asociada (los ciclos sin cita de la Fase 1 no
     * pertenecen a un área).
     */
    @Query("""
            SELECT DISTINCT ec FROM ExpedienteCiclo ec
              JOIN ec.cita c
              JOIN c.cupoDiario cd
              JOIN cd.subespecialidadHorario sh
            WHERE (:estado IS NULL OR ec.estadoActual = :estado)
              AND sh.subespecialidad.id IN :areaIds
            ORDER BY ec.creadoEn ASC
            """)
    List<ExpedienteCiclo> buscarColaPorAreaSinFecha(@Param("estado") String estado,
                                                    @Param("areaIds") Collection<Long> areaIds);

    @Query("""
            SELECT DISTINCT ec FROM ExpedienteCiclo ec
              JOIN ec.cita c
              JOIN c.cupoDiario cd
              JOIN cd.subespecialidadHorario sh
            WHERE (:estado IS NULL OR ec.estadoActual = :estado)
              AND cd.fecha = :fecha
              AND sh.subespecialidad.id IN :areaIds
            ORDER BY ec.creadoEn ASC
            """)
    List<ExpedienteCiclo> buscarColaPorAreaConFecha(@Param("estado") String estado,
                                                    @Param("fecha") LocalDate fecha,
                                                    @Param("areaIds") Collection<Long> areaIds);

    /**
     * Ciclos de una fecha en estados de salida (localizados o en tránsito de entrega),
     * con el expediente, paciente y área ya cargados. Base del documento "Salida de EXP".
     */
    @Query("""
            SELECT DISTINCT ec FROM ExpedienteCiclo ec
              JOIN FETCH ec.expediente e
              JOIN FETCH e.paciente
              LEFT JOIN FETCH ec.cita c
              LEFT JOIN FETCH c.cupoDiario cd
              LEFT JOIN FETCH cd.subespecialidadHorario sh
              LEFT JOIN FETCH sh.subespecialidad
            WHERE ec.estadoActual IN :estados
              AND cd.fecha = :fecha
            ORDER BY ec.creadoEn ASC
            """)
    List<ExpedienteCiclo> buscarSalidaPorFecha(@Param("fecha") LocalDate fecha,
                                               @Param("estados") Collection<String> estados);

    @Query("""
            SELECT ec FROM ExpedienteCiclo ec
              JOIN FETCH ec.cita c
              JOIN FETCH c.cupoDiario cd
            WHERE cd.fecha = :fecha
            """)
    List<ExpedienteCiclo> buscarPorFecha(@Param("fecha") LocalDate fecha);

    @Query("""
            SELECT ec.estadoActual, COUNT(ec) FROM ExpedienteCiclo ec
              JOIN ec.cita c
              JOIN c.cupoDiario cd
            WHERE cd.fecha = :fecha
            GROUP BY ec.estadoActual
            """)
    List<Object[]> contarPorEstadoYFecha(@Param("fecha") LocalDate fecha);

    /**
     * Ciclos de un rango de fechas (por fecha de la cita) para el Dashboard de
     * Archivo, opcionalmente filtrados por subespecialidad. Carga expediente,
     * paciente y área (subespecialidad) para evitar N+1.
     */
    @Query("""
            SELECT DISTINCT ec FROM ExpedienteCiclo ec
              LEFT JOIN FETCH ec.expediente e
              LEFT JOIN FETCH e.paciente
              LEFT JOIN FETCH ec.cita c
              LEFT JOIN FETCH c.cupoDiario cd
              LEFT JOIN FETCH cd.subespecialidadHorario sh
              LEFT JOIN FETCH sh.subespecialidad
            WHERE c IS NOT NULL
              AND cd.fecha BETWEEN :desde AND :hasta
              AND (:subespecialidadId IS NULL OR sh.subespecialidad.id = :subespecialidadId)
            """)
    List<ExpedienteCiclo> buscarDashboard(@Param("desde") LocalDate desde,
                                          @Param("hasta") LocalDate hasta,
                                          @Param("subespecialidadId") Long subespecialidadId);
}

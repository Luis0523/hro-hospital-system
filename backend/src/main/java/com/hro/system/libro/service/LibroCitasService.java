package com.hro.system.libro.service;

import com.hro.system.auth.UsuarioContexto;
import com.hro.system.clinica.entity.Subespecialidad;
import com.hro.system.clinica.repository.SubespecialidadRepository;
import com.hro.system.common.ConflictException;
import com.hro.system.common.ResourceNotFoundException;
import com.hro.system.libro.dto.*;
import com.hro.system.libro.entity.LibroCitasDia;
import com.hro.system.libro.entity.LibroCitasEspecialidad;
import com.hro.system.libro.repository.LibroCitasDiaRepository;
import com.hro.system.usuario.entity.UsuarioReferencia;
import com.hro.system.usuario.repository.UsuarioReferenciaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;

/**
 * Digitalización del libro físico de citas: registro diario de contadores y del
 * desglose de expedientes por subespecialidad.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class LibroCitasService {

    private final LibroCitasDiaRepository libroRepository;
    private final SubespecialidadRepository subespecialidadRepository;
    private final UsuarioReferenciaRepository usuarioReferenciaRepository;

    @Transactional
    public LibroCitasDiaResponseDTO crear(LibroCitasDiaRequestDTO dto) {
        if (libroRepository.existsByFecha(dto.getFecha())) {
            throw new ConflictException("Ya existe un registro del libro para la fecha " + dto.getFecha());
        }

        LibroCitasDia libro = LibroCitasDia.builder()
                .fecha(dto.getFecha())
                .egresosHospitalarios(nvl(dto.getEgresosHospitalarios()))
                .sobresEmergencia(nvl(dto.getSobresEmergencia()))
                .sobresSellados(nvl(dto.getSobresSellados()))
                .tia(nvl(dto.getTia()))
                .observaciones(dto.getObservaciones())
                .creadoPor(usuarioActual())
                .build();

        aplicarEspecialidades(libro, dto.getEspecialidades());
        log.info("Libro de citas creado para la fecha {}", libro.getFecha());
        return map(libroRepository.save(libro));
    }

    @Transactional
    public LibroCitasDiaResponseDTO actualizar(Long id, LibroCitasDiaRequestDTO dto) {
        LibroCitasDia libro = buscar(id);

        if (!libro.getFecha().equals(dto.getFecha()) && libroRepository.existsByFecha(dto.getFecha())) {
            throw new ConflictException("Ya existe un registro del libro para la fecha " + dto.getFecha());
        }

        libro.setFecha(dto.getFecha());
        libro.setEgresosHospitalarios(nvl(dto.getEgresosHospitalarios()));
        libro.setSobresEmergencia(nvl(dto.getSobresEmergencia()));
        libro.setSobresSellados(nvl(dto.getSobresSellados()));
        libro.setTia(nvl(dto.getTia()));
        libro.setObservaciones(dto.getObservaciones());
        libro.setActualizadoPor(usuarioActual());
        libro.setActualizadoEn(OffsetDateTime.now());

        // Se eliminan los hijos antes de insertar los nuevos para respetar el UNIQUE
        // (libro_dia_id, subespecialidad_id): el flush intermedio fuerza el DELETE.
        libro.limpiarEspecialidades();
        libroRepository.flush();
        aplicarEspecialidades(libro, dto.getEspecialidades());

        return map(libroRepository.save(libro));
    }

    @Transactional(readOnly = true)
    public LibroCitasDiaResponseDTO obtenerPorFecha(LocalDate fecha) {
        return map(libroRepository.findByFecha(fecha)
                .orElseThrow(() -> new ResourceNotFoundException("LibroCitasDia", "fecha", fecha)));
    }

    @Transactional(readOnly = true)
    public List<LibroCitasDiaResponseDTO> listar(LocalDate inicio, LocalDate fin) {
        return libroRepository.buscarPorRango(inicio, fin).stream().map(this::map).toList();
    }

    /**
     * Expedientes esperados para una fecha, desglosados por subespecialidad.
     * <p>
     * Fase 1: la fuente es el propio libro digitado. Cuando la API de Registro Médico
     * esté disponible, se precargará desde allí sin cambiar el contrato.
     */
    @Transactional(readOnly = true)
    public ExpedientesEsperadosDTO esperados(LocalDate fecha) {
        return libroRepository.findByFecha(fecha)
                .map(libro -> ExpedientesEsperadosDTO.builder()
                        .fecha(libro.getFecha())
                        .fuente("LIBRO")
                        .totalExpedientes(sumarExpedientes(libro))
                        .items(libro.getEspecialidades().stream().map(this::mapEspecialidad).toList())
                        .build())
                .orElseGet(() -> ExpedientesEsperadosDTO.builder()
                        .fecha(fecha)
                        .fuente("LIBRO")
                        .totalExpedientes(0)
                        .items(List.of())
                        .build());
    }

    private void aplicarEspecialidades(LibroCitasDia libro, List<LibroCitasEspecialidadRequestDTO> items) {
        if (items == null) {
            return;
        }
        for (LibroCitasEspecialidadRequestDTO item : items) {
            Subespecialidad subespecialidad = subespecialidadRepository.findById(item.getSubespecialidadId())
                    .orElseThrow(() -> new ResourceNotFoundException("Subespecialidad", "id", item.getSubespecialidadId()));
            libro.agregarEspecialidad(LibroCitasEspecialidad.builder()
                    .subespecialidad(subespecialidad)
                    .cantidadExpedientes(nvl(item.getCantidadExpedientes()))
                    .build());
        }
    }

    private LibroCitasDia buscar(Long id) {
        return libroRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("LibroCitasDia", "id", id));
    }

    private UsuarioReferencia usuarioActual() {
        Long usuarioId = UsuarioContexto.idActual();
        return usuarioReferenciaRepository.findById(usuarioId)
                .orElseThrow(() -> new ResourceNotFoundException("UsuarioReferencia", "id", usuarioId));
    }

    private LibroCitasDiaResponseDTO map(LibroCitasDia libro) {
        return LibroCitasDiaResponseDTO.builder()
                .id(libro.getId())
                .fecha(libro.getFecha())
                .egresosHospitalarios(libro.getEgresosHospitalarios())
                .sobresEmergencia(libro.getSobresEmergencia())
                .sobresSellados(libro.getSobresSellados())
                .tia(libro.getTia())
                .totalExpedientes(sumarExpedientes(libro))
                .observaciones(libro.getObservaciones())
                .creadoPor(libro.getCreadoPor() != null ? libro.getCreadoPor().getNombreMostrar() : null)
                .creadoEn(libro.getCreadoEn())
                .actualizadoEn(libro.getActualizadoEn())
                .especialidades(libro.getEspecialidades().stream().map(this::mapEspecialidad).toList())
                .build();
    }

    private LibroCitasEspecialidadResponseDTO mapEspecialidad(LibroCitasEspecialidad detalle) {
        return LibroCitasEspecialidadResponseDTO.builder()
                .subespecialidadId(detalle.getSubespecialidad().getId())
                .subespecialidadNombre(detalle.getSubespecialidad().getNombre())
                .cantidadExpedientes(detalle.getCantidadExpedientes())
                .build();
    }

    private int sumarExpedientes(LibroCitasDia libro) {
        return libro.getEspecialidades().stream()
                .mapToInt(detalle -> nvl(detalle.getCantidadExpedientes()))
                .sum();
    }

    private static int nvl(Integer valor) {
        return valor != null ? valor : 0;
    }
}

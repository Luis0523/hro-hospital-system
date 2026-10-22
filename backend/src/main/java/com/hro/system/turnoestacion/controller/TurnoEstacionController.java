package com.hro.system.turnoestacion.controller;

import com.hro.system.common.ApiResponse;
import com.hro.system.turnoestacion.dto.*;
import com.hro.system.turnoestacion.service.TurnoEstacionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/turnos-estacion")
@RequiredArgsConstructor
@Tag(name = "Turnos de estación",
        description = "Flujo independiente de turnos de la estación de enfermería: registro, recepción, clínica, llamados y archivo")
public class TurnoEstacionController {

    private final TurnoEstacionService turnoEstacionService;

    @PostMapping
    @PreAuthorize("hasAnyRole('enfermeria', 'jefe_enfermeria', 'administrador')")
    @Operation(summary = "Registrar turno de estación",
            description = "Asigna el número general diario de la estación y el correlativo de la especialidad. No requiere paciente ni expediente. 409 si se agotó el correlativo.")
    public ResponseEntity<ApiResponse<TurnoEstacionResponseDTO>> crear(
            @Valid @RequestBody CrearTurnoEstacionRequestDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(turnoEstacionService.crear(dto), "Turno de estación registrado"));
    }

    @GetMapping
    @Operation(summary = "Listar turnos de estación",
            description = "Listado por fecha (por defecto hoy), estación, especialidad, clínica y estado.")
    public ResponseEntity<ApiResponse<List<TurnoEstacionResponseDTO>>> listar(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha,
            @RequestParam(required = false) Long estacionId,
            @RequestParam(required = false) Long especialidadId,
            @RequestParam(required = false) UUID espacioFisicoId,
            @RequestParam(required = false) String estado) {
        return ResponseEntity.ok(ApiResponse.ok(
                turnoEstacionService.listar(fecha, estacionId, especialidadId, espacioFisicoId, estado),
                "Turnos de estación obtenidos"));
    }

    @GetMapping("/clinicas/resumen")
    @Operation(summary = "Resumen de clínicas para devoluciones",
            description = "Asignados, devueltos y pendientes por clínica en la fecha.")
    public ResponseEntity<ApiResponse<List<ResumenClinicaDTO>>> resumenClinicas(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha,
            @RequestParam(required = false) Long estacionId) {
        return ResponseEntity.ok(ApiResponse.ok(
                turnoEstacionService.resumenClinicas(fecha, estacionId),
                "Resumen de clínicas obtenido"));
    }

    @PostMapping("/clinicas/{espacioFisicoId}/devoluciones")
    @PreAuthorize("hasAnyRole('enfermeria', 'jefe_enfermeria', 'administrador')")
    @Operation(summary = "Registrar devolución por clínica",
            description = "Descuenta un expediente pendiente de la clínica sin asociarlo a un turno.")
    public ResponseEntity<ApiResponse<ResumenClinicaDTO>> registrarDevolucionClinica(
            @PathVariable UUID espacioFisicoId,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha,
            @RequestParam(required = false) Long estacionId) {
        return ResponseEntity.ok(ApiResponse.ok(
                turnoEstacionService.registrarDevolucionClinica(espacioFisicoId, fecha, estacionId),
                "Devolución registrada"));
    }

    @PostMapping("/clinicas/{espacioFisicoId}/devoluciones/deshacer")
    @PreAuthorize("hasAnyRole('enfermeria', 'jefe_enfermeria', 'administrador')")
    @Operation(summary = "Deshacer la última devolución de una clínica")
    public ResponseEntity<ApiResponse<ResumenClinicaDTO>> deshacerDevolucionClinica(
            @PathVariable UUID espacioFisicoId,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha,
            @RequestParam(required = false) Long estacionId) {
        return ResponseEntity.ok(ApiResponse.ok(
                turnoEstacionService.deshacerDevolucionClinica(espacioFisicoId, fecha, estacionId),
                "Devolución deshecha"));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener turno de estación", description = "Detalle del turno con su bitácora de movimientos.")
    public ResponseEntity<ApiResponse<TurnoEstacionResponseDTO>> obtener(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(turnoEstacionService.obtener(id), "Turno de estación obtenido"));
    }

    @PostMapping("/{id}/recibir")
    @PreAuthorize("hasAnyRole('enfermeria', 'jefe_enfermeria', 'administrador')")
    @Operation(summary = "Recibir turno", description = "registrado -> recibido.")
    public ResponseEntity<ApiResponse<TurnoEstacionResponseDTO>> recibir(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(turnoEstacionService.recibir(id), "Paciente recibido"));
    }

    @PostMapping("/{id}/asignar-clinica")
    @PreAuthorize("hasAnyRole('enfermeria', 'jefe_enfermeria', 'administrador')")
    @Operation(summary = "Asignar clínica", description = "recibido -> en_clinica. Valida que la clínica esté asignada a la especialidad en la fecha.")
    public ResponseEntity<ApiResponse<TurnoEstacionResponseDTO>> asignarClinica(
            @PathVariable UUID id, @Valid @RequestBody AsignarClinicaRequestDTO dto) {
        return ResponseEntity.ok(ApiResponse.ok(
                turnoEstacionService.asignarClinica(id, dto), "Clínica asignada"));
    }

    @PutMapping("/{id}/clinica")
    @PreAuthorize("hasAnyRole('enfermeria', 'jefe_enfermeria', 'administrador')")
    @Operation(summary = "Asignar o cambiar clínica sin avanzar de estado",
            description = "Permitido en registrado/recibido. Valida que la clínica esté asignada a la especialidad en la fecha.")
    public ResponseEntity<ApiResponse<TurnoEstacionResponseDTO>> cambiarClinica(
            @PathVariable UUID id, @Valid @RequestBody AsignarClinicaRequestDTO dto) {
        return ResponseEntity.ok(ApiResponse.ok(
                turnoEstacionService.cambiarClinica(id, dto), "Clínica actualizada"));
    }

    @PostMapping("/{id}/vincular-expediente")
    @PreAuthorize("hasAnyRole('medico', 'administrador')")
    @Operation(summary = "Vincular expediente (médico)",
            description = "El médico se identifica con su número de colegiado y la clínica del QR; vincula el expediente y crea el ciclo en Archivo.")
    public ResponseEntity<ApiResponse<TurnoEstacionResponseDTO>> vincularExpediente(
            @PathVariable UUID id, @Valid @RequestBody VincularExpedienteRequestDTO dto) {
        return ResponseEntity.ok(ApiResponse.ok(
                turnoEstacionService.vincularExpediente(id, dto), "Expediente vinculado"));
    }

    @PostMapping("/{id}/llamar")
    @PreAuthorize("hasAnyRole('medico', 'administrador')")
    @Operation(summary = "Llamar paciente", description = "en_clinica/llamado/no_asistio -> llamado. Incrementa el contador de llamados.")
    public ResponseEntity<ApiResponse<TurnoEstacionResponseDTO>> llamar(
            @PathVariable UUID id, @Valid @RequestBody AccionMedicoRequestDTO dto) {
        return ResponseEntity.ok(ApiResponse.ok(turnoEstacionService.llamar(id, dto), "Paciente llamado"));
    }

    @PostMapping("/{id}/no-asistio")
    @PreAuthorize("hasAnyRole('medico', 'administrador')")
    @Operation(summary = "Marcar no asistió", description = "en_clinica/llamado -> no_asistio.")
    public ResponseEntity<ApiResponse<TurnoEstacionResponseDTO>> noAsistio(
            @PathVariable UUID id, @Valid @RequestBody AccionMedicoRequestDTO dto) {
        return ResponseEntity.ok(ApiResponse.ok(
                turnoEstacionService.noAsistio(id, dto), "Paciente marcado como no asistió"));
    }

    @PostMapping("/{id}/atendido")
    @PreAuthorize("hasAnyRole('medico', 'administrador')")
    @Operation(summary = "Marcar atendido", description = "en_clinica/llamado -> atendido.")
    public ResponseEntity<ApiResponse<TurnoEstacionResponseDTO>> atendido(
            @PathVariable UUID id, @Valid @RequestBody AccionMedicoRequestDTO dto) {
        return ResponseEntity.ok(ApiResponse.ok(turnoEstacionService.atendido(id, dto), "Paciente atendido"));
    }

    @PostMapping("/{id}/devolver")
    @PreAuthorize("hasAnyRole('enfermeria', 'jefe_enfermeria', 'archivo', 'administrador')")
    @Operation(summary = "Devolver turno a Archivo",
            description = "atendido/no_asistio/en_clinica/llamado -> devuelto. Refleja el retorno en el ciclo de Archivo.")
    public ResponseEntity<ApiResponse<TurnoEstacionResponseDTO>> devolver(
            @PathVariable UUID id, @RequestBody(required = false) DevolverTurnoRequestDTO dto) {
        return ResponseEntity.ok(ApiResponse.ok(turnoEstacionService.devolver(id, dto), "Turno devuelto"));
    }

    @PostMapping("/{id}/archivar")
    @PreAuthorize("hasAnyRole('archivo', 'administrador')")
    @Operation(summary = "Archivar turno", description = "devuelto -> archivado. Refleja el archivado en el ciclo de Archivo.")
    public ResponseEntity<ApiResponse<TurnoEstacionResponseDTO>> archivar(
            @PathVariable UUID id, @RequestBody(required = false) ArchivarTurnoRequestDTO dto) {
        return ResponseEntity.ok(ApiResponse.ok(turnoEstacionService.archivar(id, dto), "Turno archivado"));
    }

    @PostMapping("/{id}/revertir")
    @PreAuthorize("hasAnyRole('enfermeria', 'jefe_enfermeria', 'administrador')")
    @Operation(summary = "Revertir el último estado",
            description = "Devuelve el turno al estado anterior registrado en la bitácora. No aplica a turnos devueltos o archivados.")
    public ResponseEntity<ApiResponse<TurnoEstacionResponseDTO>> revertir(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(turnoEstacionService.revertir(id), "Estado revertido"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('enfermeria', 'jefe_enfermeria', 'administrador')")
    @Operation(summary = "Eliminar turno erróneo",
            description = "Solo turnos en estado registrado y sin paciente/expediente. Si es el último turno general, borra físicamente y decrementa contadores.")
    public ResponseEntity<ApiResponse<Void>> eliminar(
            @PathVariable UUID id, @RequestBody(required = false) EliminarTurnoRequestDTO dto) {
        turnoEstacionService.eliminar(id, dto);
        return ResponseEntity.ok(ApiResponse.ok(null, "Turno de estación eliminado"));
    }

    @GetMapping("/libro")
    @Operation(summary = "Libro de turnos por especialidad",
            description = "Agrupa los turnos del día por especialidad e incluye el resumen de estados de la estación.")
    public ResponseEntity<ApiResponse<LibroTurnoEstacionResponseDTO>> libro(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha,
            @RequestParam(required = false) Long estacionId) {
        return ResponseEntity.ok(ApiResponse.ok(
                turnoEstacionService.libro(fecha, estacionId), "Libro de turnos obtenido"));
    }
}

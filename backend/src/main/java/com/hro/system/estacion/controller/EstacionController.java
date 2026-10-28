package com.hro.system.estacion.controller;

import com.hro.system.common.ApiResponse;
import com.hro.system.common.EstadoFiltro;
import com.hro.system.estacion.dto.ActualizarEstacionRequestDTO;
import com.hro.system.estacion.dto.AsignarEspecialidadesRequestDTO;
import com.hro.system.estacion.dto.AsignarClinicasFijasRequestDTO;
import com.hro.system.estacion.dto.AsignarSubespecialidadesRequestDTO;
import com.hro.system.estacion.dto.ClinicaFijaEstacionResponseDTO;
import com.hro.system.estacion.dto.ClinicaOrdenDTO;
import com.hro.system.estacion.dto.GuardarOrdenClinicasRequestDTO;
import com.hro.system.estacion.dto.CrearEstacionRequestDTO;
import com.hro.system.estacion.dto.EstacionAccesoResponseDTO;
import com.hro.system.estacion.dto.EstacionResponseDTO;
import com.hro.system.estacion.dto.EspecialidadActivaDTO;
import com.hro.system.estacion.dto.SubespecialidadAsignadaDTO;
import com.hro.system.estacion.service.ClinicaFijaEstacionService;
import com.hro.system.estacion.service.EstacionClinicaOrdenService;
import com.hro.system.estacion.service.EstacionService;
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

@RestController
@RequestMapping("/estaciones")
@RequiredArgsConstructor
@Tag(name = "Estaciones de Enfermería",
        description = "Puestos de enfermería que agrupan subespecialidades. Cada tablero muestra solo su área.")
public class EstacionController {

    private final EstacionService estacionService;
    private final ClinicaFijaEstacionService clinicaFijaService;
    private final EstacionClinicaOrdenService clinicaOrdenService;

    @GetMapping
    @Operation(summary = "Listar estaciones",
            description = "Filtra por estado: activos (por defecto), inactivos o todos. Incluye sus subespecialidades.")
    public ResponseEntity<ApiResponse<List<EstacionResponseDTO>>> listar(
            @RequestParam(required = false) String estado) {
        return ResponseEntity.ok(ApiResponse.ok(
                estacionService.listar(EstadoFiltro.from(estado).aActivo()),
                "Listado de estaciones de enfermería"));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Buscar estación por ID")
    public ResponseEntity<ApiResponse<EstacionResponseDTO>> buscar(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(estacionService.buscarPorId(id), "Estación localizada"));
    }

    @GetMapping("/{id}/subespecialidades")
    @Operation(summary = "Subespecialidades de la estación")
    public ResponseEntity<ApiResponse<List<SubespecialidadAsignadaDTO>>> listarSubespecialidades(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(
                estacionService.listarSubespecialidades(id), "Subespecialidades de la estación"));
    }

    @GetMapping("/{id}/subespecialidades-activas")
    @Operation(summary = "Subespecialidades con horario activo en la fecha",
            description = "Si se omite 'fecha', devuelve todas las asignadas. Con fecha, filtra por el día de la semana activo.")
    public ResponseEntity<ApiResponse<List<SubespecialidadAsignadaDTO>>> listarSubespecialidadesActivas(
            @PathVariable Long id,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha) {
        return ResponseEntity.ok(ApiResponse.ok(
                estacionService.listarSubespecialidadesActivas(id, fecha),
                "Subespecialidades activas de la estación"));
    }

    @GetMapping("/{id}/especialidades-activas")
    @Operation(summary = "Especialidades con atención activa en la fecha",
            description = "Deriva las especialidades (sin duplicar) de las subespecialidades de la estación con horario activo ese día. Sin 'fecha', todas las de la estación.")
    public ResponseEntity<ApiResponse<List<EspecialidadActivaDTO>>> listarEspecialidadesActivas(
            @PathVariable Long id,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha) {
        return ResponseEntity.ok(ApiResponse.ok(
                estacionService.listarEspecialidadesActivas(id, fecha),
                "Especialidades activas de la estación"));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('jefe_enfermeria', 'administrador')")
    @Operation(summary = "Crear estación de enfermería")
    public ResponseEntity<ApiResponse<EstacionResponseDTO>> crear(@Valid @RequestBody CrearEstacionRequestDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(estacionService.crear(dto), "Estación creada exitosamente"));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('jefe_enfermeria', 'administrador')")
    @Operation(summary = "Actualizar estación")
    public ResponseEntity<ApiResponse<EstacionResponseDTO>> actualizar(
            @PathVariable Long id, @Valid @RequestBody ActualizarEstacionRequestDTO dto) {
        return ResponseEntity.ok(ApiResponse.ok(estacionService.actualizar(id, dto), "Estación actualizada"));
    }

    @PutMapping("/{id}/especialidades")
    @PreAuthorize("hasAnyRole('jefe_enfermeria', 'administrador')")
    @Operation(summary = "Asignar especialidades a la estación",
            description = "Reemplaza el conjunto. Cada especialidad se resuelve a su área interna (creada si no existe).")
    public ResponseEntity<ApiResponse<EstacionResponseDTO>> asignarEspecialidades(
            @PathVariable Long id, @Valid @RequestBody AsignarEspecialidadesRequestDTO dto) {
        return ResponseEntity.ok(ApiResponse.ok(
                estacionService.asignarEspecialidades(id, dto.getEspecialidadIds()),
                "Especialidades de la estación actualizadas"));
    }

    @GetMapping("/{id}/clinicas-fijas")
    @Operation(summary = "Clínicas fijas de la estación",
            description = "Clínica estable por especialidad. Si un turno nace con esta configuración, ya lleva clínica asignada.")
    public ResponseEntity<ApiResponse<List<ClinicaFijaEstacionResponseDTO>>> listarClinicasFijas(
            @PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(
                clinicaFijaService.listar(id), "Clínicas fijas de la estación"));
    }

    @GetMapping("/{id}/clinicas-orden")
    @Operation(summary = "Orden de clínicas de la estación",
            description = "Lista las clínicas activas en el orden configurado para la estación. Si se indica nivel, filtra por ese nivel.")
    public ResponseEntity<ApiResponse<List<ClinicaOrdenDTO>>> listarOrdenClinicas(
            @PathVariable Long id,
            @RequestParam(required = false) Short nivel) {
        return ResponseEntity.ok(ApiResponse.ok(
                clinicaOrdenService.listar(id, nivel), "Orden de clínicas de la estación"));
    }

    @PutMapping("/{id}/clinicas-orden")
    @PreAuthorize("hasAnyRole('jefe_enfermeria', 'administrador')")
    @Operation(summary = "Reemplazar el orden de clínicas de la estación",
            description = "Recibe los IDs de las clínicas en el orden deseado.")
    public ResponseEntity<ApiResponse<List<ClinicaOrdenDTO>>> guardarOrdenClinicas(
            @PathVariable Long id, @Valid @RequestBody GuardarOrdenClinicasRequestDTO dto) {
        return ResponseEntity.ok(ApiResponse.ok(
                clinicaOrdenService.reemplazar(id, dto.getEspacioFisicoIds()),
                "Orden de clínicas actualizado"));
    }

    @PutMapping("/{id}/clinicas-fijas")
    @PreAuthorize("hasAnyRole('jefe_enfermeria', 'administrador')")
    @Operation(summary = "Reemplazar las clínicas fijas de la estación")
    public ResponseEntity<ApiResponse<List<ClinicaFijaEstacionResponseDTO>>> guardarClinicasFijas(
            @PathVariable Long id, @Valid @RequestBody AsignarClinicasFijasRequestDTO dto) {
        return ResponseEntity.ok(ApiResponse.ok(
                clinicaFijaService.reemplazar(id, dto), "Clínicas fijas actualizadas"));
    }

    @PutMapping("/{id}/subespecialidades")
    @PreAuthorize("hasAnyRole('jefe_enfermeria', 'administrador')")
    @Operation(summary = "Asignar subespecialidades a la estación",
            description = "Reemplaza el conjunto. Valida pertenencia única (una subespecialidad no puede estar en otra estación).")
    public ResponseEntity<ApiResponse<EstacionResponseDTO>> asignarSubespecialidades(
            @PathVariable Long id, @Valid @RequestBody AsignarSubespecialidadesRequestDTO dto) {
        return ResponseEntity.ok(ApiResponse.ok(
                estacionService.asignarSubespecialidades(id, dto.getSubespecialidadIds()),
                "Subespecialidades de la estación actualizadas"));
    }

    @PatchMapping("/{id}/reactivar")
    @PreAuthorize("hasAnyRole('jefe_enfermeria', 'administrador')")
    @Operation(summary = "Reactivar estación")
    public ResponseEntity<ApiResponse<EstacionResponseDTO>> reactivar(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(estacionService.reactivar(id), "Estación reactivada"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('jefe_enfermeria', 'administrador')")
    @Operation(summary = "Desactivar estación (baja lógica)")
    public ResponseEntity<ApiResponse<EstacionResponseDTO>> desactivar(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(estacionService.desactivar(id), "Estación desactivada"));
    }

    @PostMapping("/{id}/acceso")
    @Operation(summary = "Registrar entrada a la estación",
            description = "Bitácora de rotación: registra al usuario autenticado en la estación y cierra su acceso abierto previo.")
    public ResponseEntity<ApiResponse<EstacionAccesoResponseDTO>> registrarAcceso(@PathVariable Long id) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(estacionService.registrarAcceso(id), "Acceso a la estación registrado"));
    }

    @PatchMapping("/acceso/{accesoId}/salida")
    @Operation(summary = "Registrar salida de la estación")
    public ResponseEntity<ApiResponse<EstacionAccesoResponseDTO>> cerrarAcceso(@PathVariable Long accesoId) {
        return ResponseEntity.ok(ApiResponse.ok(estacionService.cerrarAcceso(accesoId), "Salida registrada"));
    }

    @GetMapping("/{id}/accesos")
    @Operation(summary = "Listar accesos de la estación",
            description = "Historial de rotación de la estación. Con abiertos=true, solo los accesos sin salida.")
    public ResponseEntity<ApiResponse<List<EstacionAccesoResponseDTO>>> listarAccesos(
            @PathVariable Long id,
            @RequestParam(required = false) Boolean abiertos) {
        return ResponseEntity.ok(ApiResponse.ok(
                estacionService.listarAccesos(id, abiertos), "Accesos de la estación"));
    }
}

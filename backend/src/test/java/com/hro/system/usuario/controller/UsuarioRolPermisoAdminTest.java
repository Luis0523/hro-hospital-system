package com.hro.system.usuario.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hro.system.agenda.repository.CupoDiarioRepository;
import com.hro.system.cita.repository.CitaRepository;
import com.hro.system.clinica.entity.Especialidad;
import com.hro.system.clinica.entity.Subespecialidad;
import com.hro.system.clinica.repository.EspecialidadRepository;
import com.hro.system.clinica.repository.SubespecialidadRepository;
import com.hro.system.medico.repository.MedicoRepository;
import com.hro.system.medico.repository.MedicoSubespecialidadRepository;
import com.hro.system.usuario.dto.CrearPermisoRequestDTO;
import com.hro.system.usuario.entity.PermisoSubespecialidad;
import com.hro.system.usuario.entity.UsuarioReferencia;
import com.hro.system.usuario.repository.PermisoSubespecialidadRepository;
import com.hro.system.usuario.repository.UsuarioReferenciaRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class UsuarioRolPermisoAdminTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UsuarioReferenciaRepository usuarioRepository;

    @Autowired
    private PermisoSubespecialidadRepository permisoRepository;

    @Autowired
    private EspecialidadRepository especialidadRepository;

    @Autowired
    private SubespecialidadRepository subespecialidadRepository;

    @Autowired
    private MedicoRepository medicoRepository;

    @Autowired
    private MedicoSubespecialidadRepository medicoSubespecialidadRepository;

    @Autowired
    private CupoDiarioRepository cupoDiarioRepository;

    @Autowired
    private CitaRepository citaRepository;

    private UsuarioReferencia usuario;
    private Subespecialidad subespecialidad;
    private PermisoSubespecialidad permiso;

    @BeforeEach
    void setUp() {
        citaRepository.deleteAll();
        cupoDiarioRepository.deleteAll();
        medicoSubespecialidadRepository.deleteAll();
        permisoRepository.deleteAll();
        subespecialidadRepository.deleteAll();
        especialidadRepository.deleteAll();
        medicoRepository.deleteAll();
        usuarioRepository.deleteAll();

        usuario = usuarioRepository.save(UsuarioReferencia.builder()
                .idExterno("admin-test-01")
                .nombreMostrar("Admin Prueba")
                .rolPrincipal("administrador")
                .activo(true)
                .build());

        Especialidad especialidad = especialidadRepository.save(Especialidad.builder()
                .nombre("Medicina Interna")
                .activo(true)
                .build());

        subespecialidad = subespecialidadRepository.save(Subespecialidad.builder()
                .especialidad(especialidad)
                .nombre("Medicina General")
                .activo(true)
                .build());

        permiso = permisoRepository.save(PermisoSubespecialidad.builder()
                .usuarioReferencia(usuario)
                .subespecialidad(subespecialidad)
                .tipoPermiso("avanzar_turno")
                .activo(true)
                .build());
    }

    // ---------------------------------------------------------------------
    // SCRUM-123 — Usuarios
    // ---------------------------------------------------------------------

    @Test
    @DisplayName("GET /usuarios - Por defecto solo devuelve activos")
    void listarUsuarios_porDefectoActivos() throws Exception {
        usuarioRepository.save(UsuarioReferencia.builder()
                .idExterno("inactivo-01")
                .nombreMostrar("Usuario Inactivo")
                .rolPrincipal("enfermeria")
                .activo(false)
                .build());

        mockMvc.perform(get("/usuarios"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[*].idExterno", hasItem("admin-test-01")))
                .andExpect(jsonPath("$.data[*].idExterno", not(hasItem("inactivo-01"))));
    }

    @Test
    @DisplayName("GET /usuarios?estado=inactivos - Devuelve solo inactivos")
    void listarUsuarios_inactivos() throws Exception {
        usuarioRepository.save(UsuarioReferencia.builder()
                .idExterno("inactivo-01")
                .nombreMostrar("Usuario Inactivo")
                .rolPrincipal("enfermeria")
                .activo(false)
                .build());

        mockMvc.perform(get("/usuarios").param("estado", "inactivos"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].idExterno", is("inactivo-01")));
    }

    @Test
    @DisplayName("GET /usuarios?rol=medico - Filtra por rol")
    void listarUsuarios_filtroRol() throws Exception {
        usuarioRepository.save(UsuarioReferencia.builder()
                .idExterno("medico-01")
                .nombreMostrar("Dr. Médico")
                .rolPrincipal("medico")
                .activo(true)
                .build());

        mockMvc.perform(get("/usuarios").param("rol", "medico"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].rolPrincipal", is("medico")));
    }

    @Test
    @DisplayName("PATCH /usuarios/{id}/desactivar y /activar - Cambia el estado")
    void desactivarYActivarUsuario() throws Exception {
        mockMvc.perform(patch("/usuarios/{id}/desactivar", usuario.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.activo", is(false)));

        mockMvc.perform(patch("/usuarios/{id}/activar", usuario.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.activo", is(true)));
    }

    // ---------------------------------------------------------------------
    // SCRUM-124 — Roles
    // ---------------------------------------------------------------------

    @Test
    @DisplayName("GET /roles - Devuelve el catálogo de roles válidos")
    void listarRoles() throws Exception {
        mockMvc.perform(get("/roles"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasItems("administrador", "medico", "enfermeria", "jefe_enfermeria")));
    }

    @Test
    @DisplayName("PUT /usuarios/{id}/rol - Asigna un rol válido")
    void asignarRol_exito() throws Exception {
        mockMvc.perform(put("/usuarios/{id}/rol", usuario.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("rolPrincipal", "medico"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.rolPrincipal", is("medico")));
    }

    @Test
    @DisplayName("PUT /usuarios/{id}/rol - Rechaza un rol inválido")
    void asignarRol_invalido() throws Exception {
        mockMvc.perform(put("/usuarios/{id}/rol", usuario.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("rolPrincipal", "superadmin"))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("Rol no válido")));
    }

    // ---------------------------------------------------------------------
    // SCRUM-125 — Permisos por subespecialidad
    // ---------------------------------------------------------------------

    @Test
    @DisplayName("GET /usuarios/{id}/permisos - Lista permisos del usuario")
    void listarPermisosPorUsuario() throws Exception {
        mockMvc.perform(get("/usuarios/{id}/permisos", usuario.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].tipoPermiso", is("avanzar_turno")));
    }

    @Test
    @DisplayName("POST /permisos-subespecialidad - Crea una asignación")
    void crearPermiso_exito() throws Exception {
        CrearPermisoRequestDTO req = CrearPermisoRequestDTO.builder()
                .usuarioId(usuario.getId())
                .subespecialidadId(subespecialidad.getId())
                .tipoPermiso("autorizar_cupo")
                .build();

        mockMvc.perform(post("/permisos-subespecialidad")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.tipoPermiso", is("autorizar_cupo")))
                .andExpect(jsonPath("$.data.activo", is(true)));
    }

    @Test
    @DisplayName("POST /permisos-subespecialidad - Rechaza duplicado activo")
    void crearPermiso_duplicadoActivo() throws Exception {
        CrearPermisoRequestDTO req = CrearPermisoRequestDTO.builder()
                .usuarioId(usuario.getId())
                .subespecialidadId(subespecialidad.getId())
                .tipoPermiso("avanzar_turno")
                .build();

        mockMvc.perform(post("/permisos-subespecialidad")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("ya tiene el permiso")));
    }

    @Test
    @DisplayName("POST /permisos-subespecialidad - Reactiva un permiso previamente desactivado")
    void crearPermiso_reactivaExistente() throws Exception {
        mockMvc.perform(patch("/permisos-subespecialidad/{id}/desactivar", permiso.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.activo", is(false)));

        CrearPermisoRequestDTO req = CrearPermisoRequestDTO.builder()
                .usuarioId(usuario.getId())
                .subespecialidadId(subespecialidad.getId())
                .tipoPermiso("avanzar_turno")
                .build();

        mockMvc.perform(post("/permisos-subespecialidad")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.activo", is(true)))
                .andExpect(jsonPath("$.data.id", is(permiso.getId().intValue())));
    }

    @Test
    @DisplayName("GET /permisos-subespecialidad?subespecialidadId=&estado=inactivos - Filtra inactivos")
    void listarPermisos_inactivosPorSubespecialidad() throws Exception {
        permiso.setActivo(false);
        permisoRepository.save(permiso);

        mockMvc.perform(get("/permisos-subespecialidad")
                        .param("subespecialidadId", subespecialidad.getId().toString())
                        .param("estado", "inactivos"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].activo", is(false)));
    }

    @Test
    @DisplayName("PATCH /permisos-subespecialidad/{id}/reactivar - Rechaza si el usuario está inactivo")
    void reactivarPermiso_usuarioInactivo() throws Exception {
        usuario.setActivo(false);
        usuarioRepository.save(usuario);
        permiso.setActivo(false);
        permisoRepository.save(permiso);

        mockMvc.perform(patch("/permisos-subespecialidad/{id}/reactivar", permiso.getId()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("usuario está inactivo")));
    }
}

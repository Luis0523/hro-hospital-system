package com.hro.system.auditoria.controller;

import com.hro.system.auditoria.entity.AuditoriaGeneral;
import com.hro.system.auditoria.repository.AuditoriaGeneralRepository;
import com.hro.system.usuario.entity.UsuarioReferencia;
import com.hro.system.usuario.repository.UsuarioReferenciaRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class AuditoriaAdminTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private AuditoriaGeneralRepository auditoriaRepository;

    @Autowired
    private UsuarioReferenciaRepository usuarioRepository;

    private UsuarioReferencia usuario;
    private static final OffsetDateTime FECHA1 = OffsetDateTime.of(2026, 9, 10, 8, 0, 0, 0, ZoneOffset.UTC);
    private static final OffsetDateTime FECHA2 = OffsetDateTime.of(2026, 9, 15, 9, 0, 0, 0, ZoneOffset.UTC);

    @BeforeEach
    void setUp() {
        auditoriaRepository.deleteAll();
        usuarioRepository.deleteAll();

        usuario = usuarioRepository.save(UsuarioReferencia.builder()
                .idExterno("admin-aud-01")
                .nombreMostrar("Admin Auditoría")
                .rolPrincipal("administrador")
                .activo(true)
                .build());

        auditoriaRepository.save(AuditoriaGeneral.builder()
                .tablaAfectada("especialidad")
                .entidadId("1")
                .accion("crear")
                .usuarioReferencia(usuario)
                .valoresNuevos("{\"nombre\":\"Medicina Interna\"}")
                .fecha(FECHA1)
                .build());

        auditoriaRepository.save(AuditoriaGeneral.builder()
                .tablaAfectada("medico")
                .entidadId("2")
                .accion("actualizar")
                .usuarioReferencia(usuario)
                .valoresNuevos("{\"activo\":true}")
                .fecha(FECHA2)
                .build());
    }

    @Test
    @DisplayName("GET /auditoria - Devuelve DTO paginado sin exponer la entidad JPA")
    void listar_dtoPaginado() throws Exception {
        mockMvc.perform(get("/auditoria").param("usuarioId", usuario.getId().toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content", hasSize(2)))
                .andExpect(jsonPath("$.data.totalElements", is(2)))
                .andExpect(jsonPath("$.data.content[0].usuarioNombre", is("Admin Auditoría")))
                .andExpect(jsonPath("$.data.content[0].usuarioReferencia").doesNotExist());
    }

    @Test
    @DisplayName("GET /auditoria?tabla= - Filtra por tabla")
    void filtrarPorTabla() throws Exception {
        mockMvc.perform(get("/auditoria").param("tabla", "especialidad"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content", hasSize(1)))
                .andExpect(jsonPath("$.data.content[0].tablaAfectada", is("especialidad")));
    }

    @Test
    @DisplayName("GET /auditoria?accion=&usuarioId= - Filtros combinados")
    void filtrarCombinado() throws Exception {
        mockMvc.perform(get("/auditoria")
                        .param("accion", "actualizar")
                        .param("usuarioId", usuario.getId().toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content", hasSize(1)))
                .andExpect(jsonPath("$.data.content[0].accion", is("actualizar")));
    }

    @Test
    @DisplayName("GET /auditoria?fechaInicio=&fechaFin= - Filtra por rango")
    void filtrarPorRango() throws Exception {
        mockMvc.perform(get("/auditoria")
                        .param("fechaInicio", "2026-09-14")
                        .param("fechaFin", "2026-09-16"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content", hasSize(1)))
                .andExpect(jsonPath("$.data.content[0].tablaAfectada", is("medico")));
    }

    @Test
    @DisplayName("GET /auditoria?size=1 - Mantiene la paginación")
    void paginacion() throws Exception {
        mockMvc.perform(get("/auditoria")
                        .param("usuarioId", usuario.getId().toString())
                        .param("size", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content", hasSize(1)))
                .andExpect(jsonPath("$.data.totalElements", is(2)))
                .andExpect(jsonPath("$.data.totalPages", is(2)));
    }

    @Test
    @DisplayName("GET /auditoria - Rechaza con 403 a un rol no autorizado")
    void rechazaNoAdministrador() throws Exception {
        mockMvc.perform(get("/auditoria")
                        .header("X-Usuario-Id", "enf-aud-01")
                        .header("X-Usuario-Rol", "enfermeria"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.codigo", is("ACCESO_DENEGADO")));
    }
}

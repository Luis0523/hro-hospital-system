package com.hro.system.auth;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Verifica la autenticación simulada (mock): resolución de identidad por cabeceras
 * y fallback al usuario por defecto.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class AuthMockTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    @DisplayName("GET /auth/perfil sin cabeceras usa el usuario por defecto (admin-hro-01)")
    void perfilSinCabecerasUsaUsuarioPorDefecto() throws Exception {
        mockMvc.perform(get("/auth/perfil"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.idExterno", is("admin-hro-01")))
                .andExpect(jsonPath("$.data.rolPrincipal", is("administrador")));
    }

    @Test
    @DisplayName("GET /auth/perfil con cabeceras resuelve la identidad simulada indicada")
    void perfilConCabecerasResuelveIdentidad() throws Exception {
        mockMvc.perform(get("/auth/perfil")
                        .header("X-Usuario-Id", "enfermeria-01")
                        .header("X-Usuario-Rol", "enfermeria")
                        .header("X-Usuario-Nombre", "Enfermera de Pruebas"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.idExterno", is("enfermeria-01")))
                .andExpect(jsonPath("$.data.rolPrincipal", is("enfermeria")))
                .andExpect(jsonPath("$.data.nombreMostrar", is("Enfermera de Pruebas")));
    }

    @Test
    @DisplayName("GET /auth/modo reporta el modo mock activo")
    void modoReportaMock() throws Exception {
        mockMvc.perform(get("/auth/modo"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.modo", is("mock")));
    }
}

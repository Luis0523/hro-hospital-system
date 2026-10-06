package com.hro.system.acceso.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hro.system.acceso.repository.RolPaginaRepository;
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

import java.util.List;
import java.util.Map;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class AccesoControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private RolPaginaRepository rolPaginaRepository;

    @BeforeEach
    void setUp() {
        rolPaginaRepository.deleteAllInBatch();
    }

    @Test
    @DisplayName("GET /paginas - Devuelve el catálogo de páginas")
    void catalogo() throws Exception {
        mockMvc.perform(get("/paginas"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(4)))
                .andExpect(jsonPath("$.data[*].clave", hasItems("archivo", "enfermeria", "administracion", "jefe_enfermeria")));
    }

    @Test
    @DisplayName("PUT /roles-paginas/{rol} - Crea/actualiza el mapeo de un rol (incluye roles nuevos)")
    void asignarRolNuevo() throws Exception {
        mockMvc.perform(put("/roles-paginas/tecnico")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("paginas", List.of("archivo", "enfermeria")))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.rol", is("tecnico")))
                .andExpect(jsonPath("$.data.paginas", hasSize(2)));

        mockMvc.perform(get("/roles-paginas"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].rol", is("tecnico")))
                .andExpect(jsonPath("$.data[0].paginas", hasSize(2)));
    }

    @Test
    @DisplayName("PUT /roles-paginas/{rol} - Reemplaza el mapeo previo")
    void reemplazaMapeo() throws Exception {
        mockMvc.perform(put("/roles-paginas/enfermeria")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of("paginas", List.of("enfermeria")))));

        mockMvc.perform(put("/roles-paginas/enfermeria")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("paginas", List.of("enfermeria", "archivo")))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.paginas", hasSize(2)));

        mockMvc.perform(get("/roles-paginas"))
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].paginas", hasSize(2)));
    }

    @Test
    @DisplayName("PUT /roles-paginas/{rol} - Rechaza páginas no válidas")
    void paginaInvalida() throws Exception {
        mockMvc.perform(put("/roles-paginas/tecnico")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("paginas", List.of("archivo", "no_existe")))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }
}

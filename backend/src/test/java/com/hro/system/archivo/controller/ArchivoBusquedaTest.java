package com.hro.system.archivo.controller;

import com.hro.system.archivo.entity.Expediente;
import com.hro.system.archivo.repository.ExpedienteCicloRepository;
import com.hro.system.archivo.repository.ExpedienteMovimientoRepository;
import com.hro.system.archivo.repository.ExpedienteRepository;
import com.hro.system.paciente.entity.Paciente;
import com.hro.system.paciente.repository.PacienteRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class ArchivoBusquedaTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ExpedienteRepository expedienteRepository;

    @Autowired
    private ExpedienteCicloRepository expedienteCicloRepository;

    @Autowired
    private ExpedienteMovimientoRepository expedienteMovimientoRepository;

    @Autowired
    private PacienteRepository pacienteRepository;

    private Expediente expediente;

    @BeforeEach
    void setUp() {
        expedienteMovimientoRepository.deleteAll();
        expedienteCicloRepository.deleteAll();
        expedienteRepository.deleteAll();
        pacienteRepository.deleteAll();

        Paciente paciente = pacienteRepository.save(Paciente.builder()
                .dpi("2984123450901")
                .nombres("Juan")
                .apellidos("López")
                .fechaNacimiento(LocalDate.of(1985, 1, 1))
                .sexo("M")
                .numeroExpediente("EXP-001234")
                .build());

        expediente = expedienteRepository.save(Expediente.builder()
                .paciente(paciente)
                .numeroExpediente("EXP-001234")
                .activo(true)
                .build());
    }

    @Test
    @DisplayName("GET /expedientes/buscar?codigo=UUID - Encuentra por código QR")
    void buscarPorCodigoUuid() throws Exception {
        mockMvc.perform(get("/expedientes/buscar").param("codigo", expediente.getId().toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content", hasSize(1)))
                .andExpect(jsonPath("$.data.content[0].id", is(expediente.getId().toString())))
                .andExpect(jsonPath("$.data.content[0].numeroExpediente", is("EXP-001234")));
    }

    @Test
    @DisplayName("GET /expedientes/buscar?codigo=numero - Encuentra por código de barras")
    void buscarPorCodigoNumero() throws Exception {
        mockMvc.perform(get("/expedientes/buscar").param("codigo", "EXP-001234"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content", hasSize(1)))
                .andExpect(jsonPath("$.data.content[0].id", is(expediente.getId().toString())));
    }

    @Test
    @DisplayName("GET /expedientes/buscar?codigo=inexistente - Responde 404")
    void buscarPorCodigoInexistente() throws Exception {
        mockMvc.perform(get("/expedientes/buscar").param("codigo", "NO-EXISTE-999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success", is(false)));
    }
}

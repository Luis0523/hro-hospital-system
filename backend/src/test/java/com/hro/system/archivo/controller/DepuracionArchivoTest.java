package com.hro.system.archivo.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hro.system.archivo.dto.DepurarExpedienteRequestDTO;
import com.hro.system.archivo.entity.Expediente;
import com.hro.system.archivo.repository.ExpedienteRepository;
import com.hro.system.paciente.entity.Paciente;
import com.hro.system.paciente.repository.PacienteRepository;
import com.hro.system.usuario.entity.UsuarioReferencia;
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
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import java.time.LocalDate;
import java.util.UUID;

import static org.hamcrest.Matchers.hasItem;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Depuración de expedientes (baja lógica): alta, señal en la búsqueda,
 * duplicado (409), bitácora del día y no existente (404).
 */
@SpringBootTest
@ActiveProfiles("test-postgres")
@AutoConfigureMockMvc
class DepuracionArchivoTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private ExpedienteRepository expedienteRepository;

    @Autowired
    private PacienteRepository pacienteRepository;

    @Autowired
    private UsuarioReferenciaRepository usuarioReferenciaRepository;

    private UsuarioReferencia usuario;
    private String numeroExpediente;

    @BeforeEach
    void setUp() {
        String suffix = UUID.randomUUID().toString().substring(0, 8);

        usuario = usuarioReferenciaRepository.save(UsuarioReferencia.builder()
                .idExterno("archivo-dep-" + suffix)
                .nombreMostrar("Operador Depuración " + suffix)
                .rolPrincipal("archivo")
                .activo(true)
                .build());

        Paciente paciente = pacienteRepository.save(Paciente.builder()
                .dpi("DPI-DEP-" + suffix)
                .nombres("Depuración " + suffix)
                .apellidos("Prueba")
                .fechaNacimiento(LocalDate.of(1970, 1, 1))
                .sexo("M")
                .numeroExpediente("EXP-DEP-" + suffix)
                .build());

        numeroExpediente = "EXP-DEP-" + suffix;
        expedienteRepository.save(Expediente.builder()
                .paciente(paciente)
                .numeroExpediente(numeroExpediente)
                .activo(true)
                .build());
    }

    private MockHttpServletRequestBuilder auth(MockHttpServletRequestBuilder builder) {
        return builder
                .header("X-Usuario-Id", usuario.getIdExterno())
                .header("X-Usuario-Rol", "archivo")
                .header("X-Usuario-Nombre", usuario.getNombreMostrar());
    }

    @Test
    @DisplayName("Depura un expediente, lo lista y lo señala en la búsqueda")
    void depurarYListar() throws Exception {
        DepurarExpedienteRequestDTO dto = new DepurarExpedienteRequestDTO();
        dto.setNumeroExpediente(numeroExpediente);
        dto.setMotivo("No se localiza tras revisión de estantes");

        mockMvc.perform(auth(post("/expedientes/depuracion"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.numeroExpediente").value(numeroExpediente))
                .andExpect(jsonPath("$.data.pacienteNombre").isNotEmpty());

        // La búsqueda debe señalar que el expediente ya no existe.
        mockMvc.perform(auth(get("/expedientes/buscar").param("codigo", numeroExpediente)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[0].depurado").value(true));

        // Bitácora del día.
        mockMvc.perform(auth(get("/expedientes/depuracion")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[*].numeroExpediente", hasItem(numeroExpediente)));
    }

    @Test
    @DisplayName("Depurar dos veces el mismo expediente responde 409")
    void depurarDuplicado() throws Exception {
        DepurarExpedienteRequestDTO dto = new DepurarExpedienteRequestDTO();
        dto.setNumeroExpediente(numeroExpediente);

        mockMvc.perform(auth(post("/expedientes/depuracion"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated());

        mockMvc.perform(auth(post("/expedientes/depuracion"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("Depurar un expediente inexistente responde 404")
    void depurarInexistente() throws Exception {
        DepurarExpedienteRequestDTO dto = new DepurarExpedienteRequestDTO();
        dto.setNumeroExpediente("EXP-NO-EXISTE-" + UUID.randomUUID());

        mockMvc.perform(auth(post("/expedientes/depuracion"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isNotFound());
    }
}

package com.hro.system.archivo.controller;

import com.hro.system.archivo.entity.SalidaEnfermeriaArchivo;
import com.hro.system.archivo.repository.SalidaEnfermeriaArchivoRepository;
import com.hro.system.espacio.entity.EspacioFisico;
import com.hro.system.espacio.repository.EspacioFisicoRepository;
import com.hro.system.estacion.entity.EstacionEnfermeria;
import com.hro.system.estacion.repository.EstacionEnfermeriaRepository;
import com.hro.system.integracion.dto.PacienteHroDTO;
import com.hro.system.integracion.service.ExpedienteHroService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@ActiveProfiles("test-postgres")
@AutoConfigureMockMvc
class SalidaEnfermeriaArchivoTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private EstacionEnfermeriaRepository estacionRepository;
    @Autowired private EspacioFisicoRepository espacioFisicoRepository;
    @Autowired private SalidaEnfermeriaArchivoRepository salidaRepository;
    @MockBean private ExpedienteHroService expedienteHroService;

    private EstacionEnfermeria estacion;
    private EspacioFisico clinica;
    private LocalDate fecha;

    @BeforeEach
    void setUp() {
        String suffix = UUID.randomUUID().toString().substring(0, 6);
        estacion = estacionRepository.save(EstacionEnfermeria.builder()
                .codigo("SEA-" + suffix)
                .nombre("Estación " + suffix)
                .activo(true)
                .build());
        clinica = espacioFisicoRepository.save(EspacioFisico.builder()
                .numero("SEA-" + suffix)
                .nivel((short) 1)
                .nombre("Clínica " + suffix)
                .activo(true)
                .build());
        fecha = LocalDate.of(2033, 4, 10 + (int) (Math.random() * 15));
        when(expedienteHroService.consultar(anyString())).thenAnswer(inv ->
                PacienteHroDTO.builder()
                        .numeroExpediente(inv.getArgument(0))
                        .nombreCompleto("Paciente de Prueba")
                        .build());
    }

    private String body(String numero, String tipo) {
        return "{\"numeroExpediente\":\"" + numero + "\",\"estacionId\":" + estacion.getId()
                + ",\"fecha\":\"" + fecha + "\",\"tipo\":\"" + tipo
                + "\",\"primeraVez\":true"
                + (tipo.equals("personal") ? ",\"clinicaPersonalId\":\"" + clinica.getId() + "\"" : "")
                + "}";
    }

    @Test
    @DisplayName("Registra salida normal y personal, lista y evita duplicados")
    void registraListaYDuplicado() throws Exception {
        String normal = "8" + (10000 + (int) (Math.random() * 80000));
        String personal = "7" + (10000 + (int) (Math.random() * 80000));

        mockMvc.perform(post("/salidas-enfermeria-archivo")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-Usuario-Id", "enf-test-salida")
                        .header("X-Usuario-Rol", "enfermeria")
                        .header("X-Usuario-Nombre", "Enfermería")
                        .content(body(normal, "normal")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.tipo").value("normal"))
                .andExpect(jsonPath("$.data.primeraVez").value(true))
                .andExpect(jsonPath("$.data.pacienteNombre").value("Paciente de Prueba"));

        mockMvc.perform(post("/salidas-enfermeria-archivo")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-Usuario-Id", "enf-test-salida")
                        .header("X-Usuario-Rol", "enfermeria")
                        .header("X-Usuario-Nombre", "Enfermería")
                        .content(body(personal, "personal")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.tipo").value("personal"))
                .andExpect(jsonPath("$.data.clinicaPersonalId").value(clinica.getId().toString()));

        mockMvc.perform(get("/salidas-enfermeria-archivo")
                        .param("fecha", fecha.toString())
                        .param("estacionId", String.valueOf(estacion.getId())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(2));

        mockMvc.perform(post("/salidas-enfermeria-archivo")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-Usuario-Id", "enf-test-salida")
                        .header("X-Usuario-Rol", "enfermeria")
                        .header("X-Usuario-Nombre", "Enfermería")
                        .content(body(normal, "normal")))
                .andExpect(status().isConflict());

        mockMvc.perform(get("/salidas-enfermeria-archivo/pdf")
                        .header("X-Usuario-Id", "enf-test-salida")
                        .header("X-Usuario-Rol", "enfermeria")
                        .header("X-Usuario-Nombre", "Enfermería")
                        .param("fecha", fecha.toString())
                        .param("estacionId", String.valueOf(estacion.getId())))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_PDF));
    }

    @Test
    @DisplayName("Actualiza y elimina una salida registrada")
    void actualizaYElimina() throws Exception {
        String numero = "5" + (10000 + (int) (Math.random() * 80000));
        mockMvc.perform(post("/salidas-enfermeria-archivo")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-Usuario-Id", "enf-test-salida")
                        .header("X-Usuario-Rol", "enfermeria")
                        .header("X-Usuario-Nombre", "Enfermería")
                        .content(body(numero, "normal")))
                .andExpect(status().isOk());

        SalidaEnfermeriaArchivo salida = salidaRepository
                .findByFechaAndEstacionIdAndNumeroExpediente(fecha, estacion.getId(), numero)
                .orElseThrow();

        String nuevoNumero = "4" + (10000 + (int) (Math.random() * 80000));
        mockMvc.perform(put("/salidas-enfermeria-archivo/{id}", salida.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-Usuario-Id", "enf-test-salida")
                        .header("X-Usuario-Rol", "enfermeria")
                        .header("X-Usuario-Nombre", "Enfermería")
                        .content("{\"numeroExpediente\":\"" + nuevoNumero
                                + "\",\"tipo\":\"personal\",\"primeraVez\":false"
                                + ",\"clinicaPersonalId\":\"" + clinica.getId() + "\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.numeroExpediente").value(nuevoNumero))
                .andExpect(jsonPath("$.data.tipo").value("personal"));

        mockMvc.perform(delete("/salidas-enfermeria-archivo/{id}", salida.getId())
                        .header("X-Usuario-Id", "enf-test-salida")
                        .header("X-Usuario-Rol", "enfermeria")
                        .header("X-Usuario-Nombre", "Enfermería"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Registra con nombre manual sin consultar el HRO")
    void registraConNombreManual() throws Exception {
        String numero = "9" + (10000 + (int) (Math.random() * 80000));
        String nombreManual = "Paciente Antiguo Sin Coincidencia";

        mockMvc.perform(post("/salidas-enfermeria-archivo")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-Usuario-Id", "enf-test-salida")
                        .header("X-Usuario-Rol", "enfermeria")
                        .header("X-Usuario-Nombre", "Enfermería")
                        .content("{\"numeroExpediente\":\"" + numero + "\",\"estacionId\":"
                                + estacion.getId() + ",\"fecha\":\"" + fecha
                                + "\",\"tipo\":\"normal\",\"pacienteNombre\":\"" + nombreManual + "\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.pacienteNombre").value(nombreManual));

        verifyNoInteractions(expedienteHroService);
    }

    @Test
    @DisplayName("Personal exige clínica")
    void personalExigeClinica() throws Exception {
        String numero = "6" + (10000 + (int) (Math.random() * 80000));
        mockMvc.perform(post("/salidas-enfermeria-archivo")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-Usuario-Id", "enf-test-salida")
                        .header("X-Usuario-Rol", "enfermeria")
                        .header("X-Usuario-Nombre", "Enfermería")
                        .content("{\"numeroExpediente\":\"" + numero + "\",\"estacionId\":"
                                + estacion.getId() + ",\"fecha\":\"" + fecha
                                + "\",\"tipo\":\"personal\"}"))
                .andExpect(status().isBadRequest());
    }
}

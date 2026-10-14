package com.hro.system.carnet.controller;

import com.hro.system.carnet.entity.Carnet;
import com.hro.system.carnet.repository.CarnetRepository;
import com.hro.system.clinica.entity.Especialidad;
import com.hro.system.clinica.repository.EspecialidadRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Circuito de estados del carnet:
 * registrado -> salida_archivo -> salida_enfermeria -> resguardado,
 * la rama no_localizado y la búsqueda por expediente.
 */
@SpringBootTest
@ActiveProfiles("test-postgres")
@AutoConfigureMockMvc
class CarnetCircuitoTest {

    private static final ZoneId GT = ZoneId.of("America/Guatemala");

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private CarnetRepository carnetRepository;

    @Autowired
    private EspecialidadRepository especialidadRepository;

    private Especialidad nuevaEspecialidad() {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        return especialidadRepository.save(Especialidad.builder()
                .nombre("Circuito " + suffix)
                .abreviatura("C" + suffix.substring(0, 3).toUpperCase())
                .activo(true)
                .build());
    }

    private Carnet insertarCarnet(Especialidad especialidad) {
        LocalDate hoy = LocalDate.now(GT);
        int correlativo = carnetRepository.obtenerSiguienteCorrelativo(hoy, especialidad.getId());
        OffsetDateTime ahora = OffsetDateTime.now();
        return carnetRepository.save(Carnet.builder()
                .fecha(hoy)
                .correlativo(correlativo)
                .especialidad(especialidad)
                .numeroExpediente("C" + UUID.randomUUID().toString().substring(0, 10))
                .pacienteNombre("Paciente de prueba")
                .estado("registrado")
                .registradoEn(ahora)
                .creadoEn(ahora)
                .actualizadoEn(ahora)
                .build());
    }

    private MockHttpServletRequestBuilder conRol(MockHttpServletRequestBuilder builder, String rol, String usuario) {
        return builder
                .header("X-Usuario-Id", usuario)
                .header("X-Usuario-Rol", rol)
                .header("X-Usuario-Nombre", "Usuario de prueba");
    }

    private void transicion(UUID id, String accion, String rol, String usuario, String estadoEsperado) throws Exception {
        mockMvc.perform(conRol(post("/carnets/" + id + "/" + accion), rol, usuario))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.estado").value(estadoEsperado));
    }

    @Test
    @DisplayName("Recorre el circuito completo: salida de archivo, salida de enfermería, resguardado")
    void circuitoCompleto() throws Exception {
        Carnet carnet = insertarCarnet(nuevaEspecialidad());

        transicion(carnet.getId(), "salida-archivo", "archivo", "arch-test-1", "salida_archivo");
        transicion(carnet.getId(), "salida-enfermeria", "enfermeria", "enf-test-1", "salida_enfermeria");
        transicion(carnet.getId(), "resguardar", "archivo", "arch-test-1", "resguardado");
    }

    @Test
    @DisplayName("Marca 'no localizado' desde registrado y luego permite la salida de archivo")
    void noLocalizadoYSalida() throws Exception {
        Carnet carnet = insertarCarnet(nuevaEspecialidad());

        mockMvc.perform(post("/carnets/" + carnet.getId() + "/no-localizado")
                        .header("X-Usuario-Id", "arch-test-2")
                        .header("X-Usuario-Rol", "archivo")
                        .header("X-Usuario-Nombre", "Archivo")
                        .contentType("application/json")
                        .content("{\"observacion\":\"No se ubica en la estantería\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.estado").value("no_localizado"));

        transicion(carnet.getId(), "salida-archivo", "archivo", "arch-test-2", "salida_archivo");
    }

    @Test
    @DisplayName("No localizado sin observación es rechazado")
    void noLocalizadoSinObservacion() throws Exception {
        Carnet carnet = insertarCarnet(nuevaEspecialidad());

        mockMvc.perform(post("/carnets/" + carnet.getId() + "/no-localizado")
                        .header("X-Usuario-Id", "arch-test-3")
                        .header("X-Usuario-Rol", "archivo")
                        .header("X-Usuario-Nombre", "Archivo"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Enfermería no puede registrar la salida de archivo")
    void rolIncorrectoEnSalidaArchivo() throws Exception {
        Carnet carnet = insertarCarnet(nuevaEspecialidad());

        mockMvc.perform(post("/carnets/" + carnet.getId() + "/salida-archivo")
                        .header("X-Usuario-Id", "enf-test-3")
                        .header("X-Usuario-Rol", "enfermeria")
                        .header("X-Usuario-Nombre", "Enfermería"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Busca el carnet por expediente para ver su trazabilidad; 404 si no existe")
    void buscarPorExpediente() throws Exception {
        Carnet carnet = insertarCarnet(nuevaEspecialidad());

        mockMvc.perform(get("/carnets/expediente/" + carnet.getNumeroExpediente()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.numeroExpediente").value(carnet.getNumeroExpediente()))
                .andExpect(jsonPath("$.data.estado").value("registrado"));

        mockMvc.perform(get("/carnets/expediente/" + UUID.randomUUID().toString().substring(0, 10)))
                .andExpect(status().isNotFound());
    }
}

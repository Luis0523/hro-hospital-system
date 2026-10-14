package com.hro.system.carnet.controller;

import com.hro.system.carnet.entity.Carnet;
import com.hro.system.carnet.repository.CarnetRepository;
import com.hro.system.clinica.entity.Especialidad;
import com.hro.system.clinica.repository.EspecialidadRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Corrección de especialidad de un carnet del día. Usa especialidades nuevas por
 * prueba (ellos aíslan el contador diario por especialidad) y carnets con fechas
 * de registro futuras para que sean determinísticamente los más recientes.
 */
@SpringBootTest
@ActiveProfiles("test-postgres")
@AutoConfigureMockMvc
class CarnetCorreccionTest {

    private static final ZoneId GT = ZoneId.of("America/Guatemala");

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private CarnetRepository carnetRepository;

    @Autowired
    private EspecialidadRepository especialidadRepository;

    @Autowired
    private JdbcTemplate jdbc;

    @BeforeEach
    void limpiarCarnetsDeHoy() {
        // Aísla la "ventana de recientes de hoy" (el top-2 es global del día).
        LocalDate hoy = LocalDate.now(GT);
        jdbc.update("DELETE FROM carnet_movimiento WHERE carnet_id IN (SELECT id FROM carnet WHERE fecha = ?)", hoy);
        jdbc.update("DELETE FROM carnet WHERE fecha = ?", hoy);
        jdbc.update("DELETE FROM contador_carnet_fecha WHERE fecha = ?", hoy);
    }

    private Especialidad nuevaEspecialidad(String etiqueta) {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        return especialidadRepository.save(Especialidad.builder()
                .nombre(etiqueta + " " + suffix)
                .abreviatura("T" + suffix.substring(0, 3).toUpperCase())
                .activo(true)
                .build());
    }

    private Carnet insertarCarnet(Especialidad especialidad, LocalDate fecha, OffsetDateTime registradoEn) {
        int correlativo = carnetRepository.obtenerSiguienteCorrelativo(fecha, especialidad.getId());
        return carnetRepository.save(Carnet.builder()
                .fecha(fecha)
                .correlativo(correlativo)
                .especialidad(especialidad)
                .numeroExpediente("E" + UUID.randomUUID().toString().substring(0, 10))
                .pacienteNombre("Paciente de prueba")
                .estado("registrado")
                .registradoEn(registradoEn)
                .creadoEn(registradoEn)
                .actualizadoEn(registradoEn)
                .build());
    }

    private int contador(LocalDate fecha, Long especialidadId) {
        Integer valor = jdbc.queryForObject(
                "SELECT correlativo_actual FROM contador_carnet_fecha WHERE fecha = ? AND especialidad_id = ?",
                Integer.class, fecha, especialidadId);
        return valor != null ? valor : 0;
    }

    private String corregir(UUID carnetId, Long especialidadDestino, String rol, String usuario) throws Exception {
        String body = "{\"especialidadId\":" + especialidadDestino + ",\"motivo\":\"Corrección de prueba\"}";
        return mockMvc.perform(post("/carnets/" + carnetId + "/corregir-especialidad")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-Usuario-Id", usuario)
                        .header("X-Usuario-Rol", rol)
                        .header("X-Usuario-Nombre", "Usuario de prueba")
                        .content(body))
                .andReturn().getResponse().getContentAsString();
    }

    @Test
    @DisplayName("Enfermería corrige la cola: baja el contador origen y asigna correlativo en destino")
    void enfermeriaCorrigeCola() throws Exception {
        LocalDate hoy = LocalDate.now(GT);
        Especialidad origen = nuevaEspecialidad("CorreccionOrigenA");
        Especialidad destino = nuevaEspecialidad("CorreccionDestinoA");
        Carnet carnet = insertarCarnet(origen, hoy, OffsetDateTime.now().plusYears(1));
        assertThat(contador(hoy, origen.getId())).isEqualTo(1);

        mockMvc.perform(post("/carnets/" + carnet.getId() + "/corregir-especialidad")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-Usuario-Id", "enf-test-cola")
                        .header("X-Usuario-Rol", "enfermeria")
                        .header("X-Usuario-Nombre", "Enfermería Prueba")
                        .content("{\"especialidadId\":" + destino.getId() + ",\"motivo\":\"Especialidad equivocada\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.especialidadId").value(destino.getId()))
                .andExpect(jsonPath("$.data.correlativo").value(1));

        // La cola del origen se cierra (vuelve a 0) y el destino arranca en 1.
        assertThat(contador(hoy, origen.getId())).isEqualTo(0);
        assertThat(contador(hoy, destino.getId())).isEqualTo(1);
    }

    @Test
    @DisplayName("Si el carnet no era la cola, se deja hueco sin tocar el contador origen")
    void noColaDejaHueco() throws Exception {
        LocalDate hoy = LocalDate.now(GT);
        Especialidad origen = nuevaEspecialidad("CorreccionOrigenB");
        Especialidad destino = nuevaEspecialidad("CorreccionDestinoB");
        OffsetDateTime base = OffsetDateTime.now().plusYears(1);
        Carnet noCola = insertarCarnet(origen, hoy, base);
        insertarCarnet(origen, hoy, base.plusMinutes(1)); // queda después en el mismo origen
        assertThat(contador(hoy, origen.getId())).isEqualTo(2);

        // Un supervisor puede corregir cualquiera de hoy (aquí el que no es la cola).
        String respuesta = corregir(noCola.getId(), destino.getId(), "administrador", "admin-test-hueco");
        assertThat(respuesta).contains("\"success\":true");

        // El origen conserva su contador (hueco); el destino recibe correlativo 1.
        assertThat(contador(hoy, origen.getId())).isEqualTo(2);
        assertThat(contador(hoy, destino.getId())).isEqualTo(1);
    }

    @Test
    @DisplayName("Enfermería no puede corregir un carnet que no está entre los 2 más recientes")
    void enfermeriaNoPuedeCorregirNoReciente() throws Exception {
        LocalDate hoy = LocalDate.now(GT);
        Especialidad origen = nuevaEspecialidad("CorreccionOrigenC");
        Especialidad destino = nuevaEspecialidad("CorreccionDestinoC");
        OffsetDateTime base = OffsetDateTime.now().plusYears(1);
        Carnet antiguo = insertarCarnet(origen, hoy, base);
        insertarCarnet(origen, hoy, base.plusMinutes(1));
        insertarCarnet(origen, hoy, base.plusMinutes(2));

        mockMvc.perform(post("/carnets/" + antiguo.getId() + "/corregir-especialidad")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-Usuario-Id", "enf-test-no-reciente")
                        .header("X-Usuario-Rol", "enfermeria")
                        .header("X-Usuario-Nombre", "Enfermería Prueba")
                        .content("{\"especialidadId\":" + destino.getId() + ",\"motivo\":\"x\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("No se pueden corregir carnets de una fecha distinta a hoy")
    void noCorrigeFechaPasada() throws Exception {
        LocalDate ayer = LocalDate.now(GT).minusDays(1);
        Especialidad origen = nuevaEspecialidad("CorreccionOrigenD");
        Especialidad destino = nuevaEspecialidad("CorreccionDestinoD");
        Carnet carnet = insertarCarnet(origen, ayer, OffsetDateTime.now());

        mockMvc.perform(post("/carnets/" + carnet.getId() + "/corregir-especialidad")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-Usuario-Id", "admin-test-fecha")
                        .header("X-Usuario-Rol", "administrador")
                        .header("X-Usuario-Nombre", "Admin Prueba")
                        .content("{\"especialidadId\":" + destino.getId() + ",\"motivo\":\"x\"}"))
                .andExpect(status().isBadRequest());
    }
}

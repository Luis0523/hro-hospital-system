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
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Eliminación física de carnets: cierra el contador si era la cola, deja hueco
 * si no, respeta permisos y expone las etiquetas (prioritario/privado libertad).
 */
@SpringBootTest
@ActiveProfiles("test-postgres")
@AutoConfigureMockMvc
class CarnetEliminarTest {

    private static final ZoneId GT = ZoneId.of("America/Guatemala");

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private CarnetRepository carnetRepository;
    @Autowired
    private EspecialidadRepository especialidadRepository;
    @Autowired
    private JdbcTemplate jdbc;

    private Especialidad especialidad;

    @BeforeEach
    void setUp() {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        especialidad = especialidadRepository.save(Especialidad.builder()
                .nombre("Eliminar " + suffix)
                .abreviatura("E" + suffix.substring(0, 3).toUpperCase())
                .activo(true)
                .build());
    }

    private Carnet insertar(boolean prioritario) {
        LocalDate hoy = LocalDate.now(GT);
        int correlativo = carnetRepository.obtenerSiguienteCorrelativo(hoy, especialidad.getId());
        OffsetDateTime ahora = OffsetDateTime.now().plusMinutes(30);
        return carnetRepository.save(Carnet.builder()
                .fecha(hoy)
                .correlativo(correlativo)
                .especialidad(especialidad)
                .numeroExpediente("E" + UUID.randomUUID().toString().substring(0, 10))
                .pacienteNombre("Paciente de prueba")
                .prioritario(prioritario)
                .privadoLibertad(false)
                .estado("registrado")
                .registradoEn(ahora)
                .creadoEn(ahora)
                .actualizadoEn(ahora)
                .build());
    }

    private int contador() {
        Integer valor = jdbc.queryForObject(
                "SELECT correlativo_actual FROM contador_carnet_fecha WHERE fecha = ? AND especialidad_id = ?",
                Integer.class, LocalDate.now(GT), especialidad.getId());
        return valor != null ? valor : 0;
    }

    @Test
    @DisplayName("Eliminar la cola baja el contador (MI-3 -> MI-2)")
    void eliminaCola() throws Exception {
        insertar(false);
        insertar(false);
        Carnet tercero = insertar(false);
        assertThat(contador()).isEqualTo(3);

        mockMvc.perform(delete("/carnets/" + tercero.getId())
                        .header("X-Usuario-Id", "admin-del-cola")
                        .header("X-Usuario-Rol", "administrador")
                        .header("X-Usuario-Nombre", "Admin"))
                .andExpect(status().isOk());

        assertThat(carnetRepository.findById(tercero.getId())).isEmpty();
        assertThat(contador()).isEqualTo(2);
    }

    @Test
    @DisplayName("Eliminar uno que no es la cola deja hueco (contador no baja)")
    void eliminaNoCola() throws Exception {
        Carnet primero = insertar(false);
        insertar(false);
        insertar(false);
        assertThat(contador()).isEqualTo(3);

        mockMvc.perform(delete("/carnets/" + primero.getId())
                        .header("X-Usuario-Id", "admin-del-hueco")
                        .header("X-Usuario-Rol", "administrador")
                        .header("X-Usuario-Nombre", "Admin"))
                .andExpect(status().isOk());

        assertThat(contador()).isEqualTo(3);
    }

    @Test
    @DisplayName("Enfermería no puede eliminar un carnet que no es de los 2 más recientes")
    void enfermeriaNoEliminaNoReciente() throws Exception {
        Carnet antiguo = insertar(false);
        insertar(false);
        insertar(false);

        mockMvc.perform(delete("/carnets/" + antiguo.getId())
                        .header("X-Usuario-Id", "enf-del")
                        .header("X-Usuario-Rol", "enfermeria")
                        .header("X-Usuario-Nombre", "Enfermería"))
                .andExpect(status().isForbidden());

        assertThat(carnetRepository.findById(antiguo.getId())).isPresent();
    }

    @Test
    @DisplayName("Expone las etiquetas prioritario/privado de libertad")
    void exponeEtiquetas() throws Exception {
        Carnet carnet = insertar(true);
        mockMvc.perform(get("/carnets/" + carnet.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.prioritario").value(true))
                .andExpect(jsonPath("$.data.privadoLibertad").value(false));
    }
}

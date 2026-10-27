package com.hro.system.archivo.controller;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Cuaderno Rojo: un registro por fecha, guardar actualiza (no duplica) y el
 * listado se puede filtrar por año/mes.
 */
@SpringBootTest
@AutoConfigureMockMvc
class CuadernoRojoTest {

    @Autowired
    private MockMvc mockMvc;

    private static final LocalDate FECHA = LocalDate.of(2033, 5, 12);

    private static String body(int egresos, int emergencia, int sellados, int tia) {
        return "{\"egresosHospitalarios\":" + egresos
                + ",\"sobresEmergencia\":" + emergencia
                + ",\"sobresSellados\":" + sellados
                + ",\"tia\":" + tia + "}";
    }

    @Test
    @DisplayName("Guarda un día y lo devuelve al consultarlo")
    void guardaYConsulta() throws Exception {
        mockMvc.perform(put("/cuaderno-rojo/" + FECHA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-Usuario-Id", "arch-test-cuaderno")
                        .header("X-Usuario-Rol", "archivo")
                        .header("X-Usuario-Nombre", "Archivo")
                        .content(body(3, 4, 5, 6)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.fecha").value(FECHA.toString()))
                .andExpect(jsonPath("$.data.egresosHospitalarios").value(3))
                .andExpect(jsonPath("$.data.sobresEmergencia").value(4))
                .andExpect(jsonPath("$.data.sobresSellados").value(5))
                .andExpect(jsonPath("$.data.tia").value(6));

        mockMvc.perform(get("/cuaderno-rojo/" + FECHA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.egresosHospitalarios").value(3))
                .andExpect(jsonPath("$.data.tia").value(6));
    }

    @Test
    @DisplayName("Guardar la misma fecha actualiza y no crea duplicados")
    void actualizaSinDuplicar() throws Exception {
        mockMvc.perform(put("/cuaderno-rojo/" + FECHA)
                .contentType(MediaType.APPLICATION_JSON)
                .header("X-Usuario-Rol", "archivo")
                .content(body(1, 1, 1, 1)));
        mockMvc.perform(put("/cuaderno-rojo/" + FECHA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-Usuario-Rol", "archivo")
                        .content(body(9, 8, 7, 6)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.egresosHospitalarios").value(9));

        mockMvc.perform(get("/cuaderno-rojo").param("anio", "2033").param("mes", "5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(1))
                .andExpect(jsonPath("$.data[0].egresosHospitalarios").value(9));
    }

    @Test
    @DisplayName("Una fecha sin registro responde sin datos")
    void sinRegistro() throws Exception {
        mockMvc.perform(get("/cuaderno-rojo/2040-01-01"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").doesNotExist());
    }

    @Test
    @DisplayName("Rechaza cantidades negativas")
    void rechazaNegativos() throws Exception {
        mockMvc.perform(put("/cuaderno-rojo/" + FECHA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-Usuario-Rol", "archivo")
                        .content(body(-1, 0, 0, 0)))
                .andExpect(status().isBadRequest());
    }
}

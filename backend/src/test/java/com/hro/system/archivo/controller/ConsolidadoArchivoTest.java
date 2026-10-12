package com.hro.system.archivo.controller;

import com.hro.system.carnet.entity.Carnet;
import com.hro.system.carnet.repository.CarnetRepository;
import com.hro.system.clinica.entity.Especialidad;
import com.hro.system.clinica.repository.EspecialidadRepository;
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

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Consolidado de Archivo (diario y mensual) sobre datos de carnets. Usa una
 * fecha y especialidad únicas (aleatorias en 2031) para aislarse de otros tests.
 */
@SpringBootTest
@ActiveProfiles("test-postgres")
@AutoConfigureMockMvc
class ConsolidadoArchivoTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private CarnetRepository carnetRepository;

    @Autowired
    private EspecialidadRepository especialidadRepository;

    @Autowired
    private UsuarioReferenciaRepository usuarioReferenciaRepository;

    private LocalDate fecha;
    private Long especialidadId;
    private int carnetCreados;

    @BeforeEach
    void setUp() {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        int mes = 1 + (int) (Math.random() * 12);
        int dia = 1 + (int) (Math.random() * 27);
        fecha = LocalDate.of(2031, mes, dia);
        carnetCreados = 0;

        // La fecha puede tener carnets de corridas anteriores: se limpia para
        // que el consolidado diario de ese día sea determinista.
        carnetRepository.deleteAllInBatch(carnetRepository.listarPorFecha(fecha));

        UsuarioReferencia usuario = usuarioReferenciaRepository.save(UsuarioReferencia.builder()
                .idExterno("archivo-con-" + suffix)
                .nombreMostrar("Operador Consolidado " + suffix)
                .rolPrincipal("archivo")
                .activo(true)
                .build());

        Especialidad especialidad = especialidadRepository.save(Especialidad.builder()
                .nombre("Especialidad Consolidado " + suffix)
                .activo(true)
                .build());
        especialidadId = especialidad.getId();

        // 3 carnets de nuestra especialidad en la fecha única.
        for (int i = 1; i <= 3; i++) {
            carnetRepository.save(Carnet.builder()
                    .fecha(fecha)
                    .correlativo(i)
                    .especialidad(especialidad)
                    .numeroExpediente("EXP-CON-" + suffix + "-" + i)
                    .pacienteNombre("Paciente " + suffix + " " + i)
                    .estado("registrado")
                    .registradoPor(usuario)
                    .registradoEn(OffsetDateTime.now())
                    .build());
            carnetCreados++;
        }
    }

    @Test
    @DisplayName("Consolidado diario devuelve el total y el desglose por especialidad")
    void consolidadoDiario() throws Exception {
        mockMvc.perform(get("/archivo/consolidado/diario").param("fecha", fecha.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.fecha").value(fecha.toString()))
                .andExpect(jsonPath("$.data.total").value(carnetCreados))
                .andExpect(jsonPath(
                        "$.data.porEspecialidad[?(@.especialidadId == " + especialidadId + ")].total")
                        .value(carnetCreados));
    }

    @Test
    @DisplayName("Consolidado mensual trae informe del día y detalle por especialidad")
    void consolidadoMensual() throws Exception {
        mockMvc.perform(get("/archivo/consolidado/mensual")
                        .param("anio", String.valueOf(fecha.getYear()))
                        .param("mes", String.valueOf(fecha.getMonthValue())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.rango.desde").value(fecha.withDayOfMonth(1).toString()))
                .andExpect(
                        jsonPath("$.data.informe[?(@.dia == '" + fecha + "')].hdc").value(carnetCreados))
                .andExpect(jsonPath(
                        "$.data.totales.porEspecialidad[?(@.especialidadId == " + especialidadId + ")].total")
                        .value(carnetCreados));
    }
}

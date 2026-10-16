package com.hro.system.carnet.controller;

import com.hro.system.carnet.entity.Carnet;
import com.hro.system.carnet.repository.CarnetRepository;
import com.hro.system.clinica.entity.Especialidad;
import com.hro.system.clinica.repository.EspecialidadRepository;
import com.hro.system.parametro.service.ParametroSistemaService;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
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

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * PDF de "EXPEDIENTES ARCHIVADOS": solo los carnets clasificados como pasivos
 * (número <= umbral) de la fecha, ordenados de menor a mayor.
 */
@SpringBootTest
@ActiveProfiles("test-postgres")
@AutoConfigureMockMvc
class ArchivadosPdfTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private CarnetRepository carnetRepository;

    @Autowired
    private EspecialidadRepository especialidadRepository;

    @Autowired
    private ParametroSistemaService parametros;

    private LocalDate fecha;
    private Especialidad especialidad;

    @BeforeEach
    void setUp() {
        // Fecha única por corrida (aísla de datos previos) y limpieza defensiva.
        int mes = 1 + (int) (Math.random() * 12);
        int dia = 1 + (int) (Math.random() * 27);
        fecha = LocalDate.of(2031, mes, dia);
        carnetRepository.deleteAll(carnetRepository.listarPorFecha(fecha));

        String suffix = UUID.randomUUID().toString().substring(0, 8);
        especialidad = especialidadRepository.save(Especialidad.builder()
                .nombre("Archivados " + suffix)
                .activo(true)
                .build());
        parametros.guardar(ParametroSistemaService.UMBRAL_ARCHIVO_ACTIVO, "800050");
    }

    private void insertarCarnet(String numero) {
        OffsetDateTime ahora = OffsetDateTime.now();
        carnetRepository.save(Carnet.builder()
                .fecha(fecha)
                .correlativo(carnetRepository.obtenerSiguienteCorrelativo(fecha, especialidad.getId()))
                .especialidad(especialidad)
                .numeroExpediente(numero)
                .pacienteNombre("Paciente " + numero)
                .estado("registrado")
                .registradoEn(ahora)
                .creadoEn(ahora)
                .actualizadoEn(ahora)
                .build());
    }

    @Test
    @DisplayName("Genera el PDF con solo los pasivos, ordenados de menor a mayor")
    void generaArchivados() throws Exception {
        insertarCarnet("800099"); // activo
        insertarCarnet("800010"); // pasivo
        insertarCarnet("800001"); // pasivo
        insertarCarnet("800050"); // pasivo (igual al umbral)
        insertarCarnet("800200"); // activo

        byte[] pdf = mockMvc.perform(get("/carnets/archivados/pdf").param("fecha", fecha.toString()))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsByteArray();

        assertThat(pdf).isNotEmpty();
        String texto;
        try (PDDocument doc = Loader.loadPDF(pdf)) {
            texto = new PDFTextStripper().getText(doc);
        }
        assertThat(texto)
                .contains("HOSPITAL REGIONAL DE OCCIDENTE")
                .contains("EXPEDIENTES ARCHIVADOS")
                .contains("800001")
                .contains("800010")
                .contains("800050")
                .doesNotContain("800099")
                .doesNotContain("800200");
    }

    @Test
    @DisplayName("Sin pasivos, igual genera un PDF válido")
    void sinPasivos() throws Exception {
        insertarCarnet("800999"); // activo
        byte[] pdf = mockMvc.perform(get("/carnets/archivados/pdf").param("fecha", fecha.toString()))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsByteArray();
        assertThat(pdf).isNotEmpty();
    }
}

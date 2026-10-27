package com.hro.system.carnet.controller;

import com.hro.system.archivo.entity.SalidaArchivoHospital;
import com.hro.system.archivo.repository.SalidaArchivoHospitalRepository;
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

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * PDF de "EXPEDIENTES ARCHIVADOS": solo las salidas de archivo consultadas al
 * hospital clasificadas como pasivas (número <= umbral) de la fecha, ordenadas
 * de menor a mayor.
 */
@SpringBootTest
@ActiveProfiles("test-postgres")
@AutoConfigureMockMvc
class ArchivadosPdfTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private SalidaArchivoHospitalRepository salidaRepository;

    @Autowired
    private ParametroSistemaService parametros;

    private LocalDate fecha;

    @BeforeEach
    void setUp() {
        // Fecha única por corrida (aísla de datos previos) y limpieza defensiva.
        int mes = 1 + (int) (Math.random() * 12);
        int dia = 1 + (int) (Math.random() * 27);
        fecha = LocalDate.of(2031, mes, dia);
        salidaRepository.deleteAll(salidaRepository.findByFechaOrderByRegistradoEnDesc(fecha));
        parametros.guardar(ParametroSistemaService.UMBRAL_ARCHIVO_ACTIVO, "800050");
    }

    private void insertarCarnet(String numero) {
        salidaRepository.save(SalidaArchivoHospital.builder()
                .fecha(fecha)
                .numeroExpediente(numero)
                .pacienteNombre("Paciente " + numero)
                .registradoEn(OffsetDateTime.now())
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

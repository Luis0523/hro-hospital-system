package com.hro.system.reporte;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/** Pruebas unitarias de la plantilla reutilizable "EXPEDIENTES ARCHIVADOS" (sin contexto Spring). */
class PlantillaExpedientesArchivadosTest {

    private final PlantillaExpedientesArchivados plantilla = new PlantillaExpedientesArchivados();
    private static final LocalDate FECHA = LocalDate.of(2026, 10, 13);

    private List<PlantillaExpedientesArchivados.Item> items(int cantidad) {
        List<PlantillaExpedientesArchivados.Item> lista = new ArrayList<>();
        for (int i = 1; i <= cantidad; i++) {
            lista.add(new PlantillaExpedientesArchivados.Item(i, String.valueOf(800000 + i - 1), FECHA));
        }
        return lista;
    }

    private static String texto(byte[] pdf) throws IOException {
        try (PDDocument doc = Loader.loadPDF(pdf)) {
            return new PDFTextStripper().getText(doc);
        }
    }

    private static int paginas(byte[] pdf) throws IOException {
        try (PDDocument doc = Loader.loadPDF(pdf)) {
            return doc.getNumberOfPages();
        }
    }

    @Test
    @DisplayName("genera un PDF válido con encabezado, título y total")
    void generaEncabezado() throws IOException {
        byte[] pdf = plantilla.generar(null, items(10), null, OffsetDateTime.now());
        assertThat(pdf).isNotEmpty();
        assertThat(texto(pdf))
                .contains("HOSPITAL REGIONAL DE OCCIDENTE")
                .contains("EXPEDIENTES ARCHIVADOS")
                .contains("Total: 10")
                .contains("800000");
    }

    @Test
    @DisplayName("incluye las firmas provistas")
    void incluyeFirmas() throws IOException {
        var firmantes = List.of(
                new PlantillaExpedientesArchivados.Firmante("Encargado de Archivo", "Archivo / Registro Médico", "Nombre y firma"),
                new PlantillaExpedientesArchivados.Firmante("Jefe de Registro Médico", "Registro Médico", "Nombre y firma"));
        byte[] pdf = plantilla.generar("CONTROL", items(3), firmantes, OffsetDateTime.now());
        assertThat(texto(pdf))
                .contains("Encargado de Archivo")
                .contains("Archivo / Registro Médico")
                .contains("Jefe de Registro Médico")
                .contains("Registro Médico");
    }

    @Test
    @DisplayName("pagina: cabe en una hoja en la capacidad de la última página y desborda en +1")
    void unaPagina() throws IOException {
        int capUltima = PlantillaExpedientesArchivados.capacidadUltima();
        assertThat(paginas(plantilla.generar(null, items(capUltima), null, OffsetDateTime.now())))
                .isEqualTo(1);
        assertThat(paginas(plantilla.generar(null, items(capUltima + 1), null, OffsetDateTime.now())))
                .isEqualTo(2);
    }

    @Test
    @DisplayName("pagina: 0 expedientes produce un PDF de una hoja")
    void vacio() throws IOException {
        byte[] pdf = plantilla.generar(null, List.of(), null, OffsetDateTime.now());
        assertThat(pdf).isNotEmpty();
        assertThat(paginas(pdf)).isEqualTo(1);
    }

    @Test
    @DisplayName("reparto balanceado de la última página")
    void repartoBalanceado() {
        assertThat(PlantillaExpedientesArchivados.distribuirUltimaPaginaBalanceada(0))
                .containsExactly(0, 0, 0);
        assertThat(PlantillaExpedientesArchivados.distribuirUltimaPaginaBalanceada(3))
                .containsExactly(1, 1, 1);
        assertThat(PlantillaExpedientesArchivados.distribuirUltimaPaginaBalanceada(10))
                .containsExactly(4, 3, 3);
    }

    @Test
    @DisplayName("pagina: reparte en varias hojas y repite el encabezado")
    void variasPaginas() throws IOException {
        byte[] pdf = plantilla.generar(null, items(400), null, OffsetDateTime.now());
        int n = paginas(pdf);
        assertThat(n).isGreaterThan(1);
        // El encabezado aparece en cada página.
        long ocurrencias = texto(pdf).lines()
                .filter((l) -> l.contains("HOSPITAL REGIONAL DE OCCIDENTE"))
                .count();
        assertThat(ocurrencias).isGreaterThanOrEqualTo(n);
    }
}

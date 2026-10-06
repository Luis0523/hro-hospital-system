package com.hro.system.integracion.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hro.system.common.ResourceNotFoundException;
import com.hro.system.integracion.config.IntegracionExpedientesProperties;
import com.hro.system.integracion.dto.PacienteHroDTO;
import com.hro.system.integracion.entity.IntegracionHroLog;
import com.hro.system.integracion.exception.IntegracionHroException;
import com.hro.system.integracion.repository.IntegracionHroLogRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withServerError;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withStatus;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

class ExpedienteHroServiceTest {

    private static final String FHIR_JSON = """
            {
              "resourceType": "Patient",
              "id": "837871",
              "name": [ { "use": "official", "family": "AJUCUM CUA", "given": ["ADOLFO", "MARTIN"] } ],
              "identifier": [ { "system": "http://hro.gob.gt/historia-clinica", "value": "837871" } ]
            }
            """;

    private IntegracionHroLogRepository logRepository;
    private MockRestServiceServer server;
    private ExpedienteHroService service;

    @BeforeEach
    void setUp() {
        logRepository = mock(IntegracionHroLogRepository.class);

        IntegracionExpedientesProperties props = new IntegracionExpedientesProperties();
        props.setUrl("https://api.test/fhir/Patient/");
        props.setUsername("usuario");
        props.setPassword("clave");

        RestClient.Builder builder = RestClient.builder();
        server = MockRestServiceServer.bindTo(builder).build();
        service = new ExpedienteHroService(props, logRepository, new ObjectMapper(), builder);
    }

    @Test
    @DisplayName("Consulta el API y devuelve el nombre normalizado")
    void consultaYNormaliza() {
        server.expect(requestTo("https://api.test/fhir/Patient/837871"))
                .andExpect(method(HttpMethod.GET))
                .andRespond(withSuccess(FHIR_JSON, MediaType.APPLICATION_JSON));

        PacienteHroDTO dto = service.consultar("837871");

        assertEquals("837871", dto.getNumeroExpediente());
        assertEquals("Adolfo Martin Ajucum Cua", dto.getNombreCompleto());
        server.verify();

        ArgumentCaptor<IntegracionHroLog> captor = ArgumentCaptor.forClass(IntegracionHroLog.class);
        verify(logRepository).save(captor.capture());
        assertEquals("837871", captor.getValue().getNumeroExpediente());
        assertEquals(Boolean.TRUE, captor.getValue().getExitoso());
    }

    @Test
    @DisplayName("404 del API se traduce a no encontrado y deja log")
    void noEncontrado() {
        server.expect(requestTo("https://api.test/fhir/Patient/0000-00"))
                .andRespond(withStatus(HttpStatus.NOT_FOUND));

        assertThrows(ResourceNotFoundException.class, () -> service.consultar("0000-00"));

        ArgumentCaptor<IntegracionHroLog> captor = ArgumentCaptor.forClass(IntegracionHroLog.class);
        verify(logRepository).save(captor.capture());
        assertEquals(Boolean.FALSE, captor.getValue().getExitoso());
    }

    @Test
    @DisplayName("Error 5xx del API se traduce a error de integración")
    void errorServidor() {
        server.expect(requestTo("https://api.test/fhir/Patient/837871"))
                .andRespond(withServerError());

        assertThrows(IntegracionHroException.class, () -> service.consultar("837871"));
        verify(logRepository).save(any());
    }

    @Test
    @DisplayName("Normalizacion Title Case")
    void normalizacion() {
        assertEquals("Adolfo Martin Ajucum Cua", ExpedienteHroService.normalizar("ADOLFO MARTIN AJUCUM CUA"));
        assertEquals("Maria De La Cruz", ExpedienteHroService.normalizar("MARIA   DE LA CRUZ"));
    }
}

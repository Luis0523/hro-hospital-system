package com.hro.system.integracion.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hro.system.auth.UsuarioContexto;
import com.hro.system.auth.dto.IdentidadUsuario;
import com.hro.system.common.BusinessException;
import com.hro.system.common.ResourceNotFoundException;
import com.hro.system.integracion.config.IntegracionExpedientesProperties;
import com.hro.system.integracion.dto.PacienteHroDTO;
import com.hro.system.integracion.entity.IntegracionHroLog;
import com.hro.system.integracion.exception.IntegracionHroException;
import com.hro.system.integracion.repository.IntegracionHroLogRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import java.nio.charset.StandardCharsets;
import java.time.OffsetDateTime;
import java.util.Arrays;
import java.util.Base64;
import java.util.stream.Collectors;

/**
 * Consulta el API externo del hospital (FHIR Patient) por número de expediente y devuelve
 * únicamente el número de expediente y el nombre completo del paciente.
 * <p>
 * Toda llamada queda registrada en {@code integracion_hro_log} con la respuesta cruda.
 */
@Slf4j
@Service
public class ExpedienteHroService {

    private final IntegracionExpedientesProperties properties;
    private final IntegracionHroLogRepository logRepository;
    private final ObjectMapper objectMapper;
    private final RestClient restClient;

    public ExpedienteHroService(IntegracionExpedientesProperties properties,
                                IntegracionHroLogRepository logRepository,
                                ObjectMapper objectMapper,
                                RestClient.Builder restClientBuilder) {
        this.properties = properties;
        this.logRepository = logRepository;
        this.objectMapper = objectMapper;
        this.restClient = construirCliente(restClientBuilder);
    }

    private RestClient construirCliente(RestClient.Builder builder) {
        RestClient.Builder b = builder.clone()
                .defaultHeader(HttpHeaders.ACCEPT, "application/fhir+json");
        if (properties.getUsername() != null && !properties.getUsername().isBlank()) {
            String credenciales = properties.getUsername() + ":" + properties.getPassword();
            String basic = Base64.getEncoder().encodeToString(credenciales.getBytes(StandardCharsets.UTF_8));
            b = b.defaultHeader(HttpHeaders.AUTHORIZATION, "Basic " + basic);
        }
        if (properties.getUrl() != null && !properties.getUrl().isBlank()) {
            b = b.baseUrl(properties.getUrl());
        }
        return b.build();
    }

    public PacienteHroDTO consultar(String numeroExpediente) {
        if (properties.getUrl() == null || properties.getUrl().isBlank()) {
            throw new BusinessException("La integración con el API de expedientes no está configurada");
        }
        String expediente = (numeroExpediente != null) ? numeroExpediente.trim() : "";
        if (expediente.isBlank()) {
            throw new BusinessException("El número de expediente es obligatorio");
        }

        long inicio = System.currentTimeMillis();
        String urlCompleta = properties.getUrl() + expediente;
        Integer estado = null;
        String cuerpo = null;
        String error = null;
        boolean exito = false;
        PacienteHroDTO resultado = null;

        try {
            ResponseEntity<String> respuesta = restClient.get()
                    .uri(expediente)
                    .retrieve()
                    .toEntity(String.class);
            estado = respuesta.getStatusCode().value();
            cuerpo = respuesta.getBody();
            exito = respuesta.getStatusCode().is2xxSuccessful();
            if (exito) {
                resultado = parsear(expediente, cuerpo);
            } else {
                error = "Respuesta no exitosa del API (HTTP " + estado + ")";
            }
        } catch (RestClientResponseException e) {
            estado = e.getStatusCode().value();
            cuerpo = e.getResponseBodyAsString();
            error = "HTTP " + estado + " del API del hospital";
        } catch (ResourceAccessException e) {
            error = "No se pudo contactar el API del hospital: " + e.getMessage();
        } catch (IntegracionHroException e) {
            error = e.getMessage();
        } catch (Exception e) {
            error = "Error consultando el API del hospital: " + e.getMessage();
        } finally {
            registrarLog(expediente, urlCompleta, estado, exito,
                    System.currentTimeMillis() - inicio, cuerpo, error);
        }

        if (resultado != null) {
            return resultado;
        }
        if (estado != null && estado == 404) {
            throw new ResourceNotFoundException("Paciente", "numeroExpediente", expediente);
        }
        throw new IntegracionHroException(error != null ? error : "No se pudo consultar el expediente en el API del hospital");
    }

    private PacienteHroDTO parsear(String expediente, String cuerpo) {
        try {
            JsonNode root = objectMapper.readTree((cuerpo == null || cuerpo.isBlank()) ? "{}" : cuerpo);
            return PacienteHroDTO.builder()
                    .numeroExpediente(expediente)
                    .nombreCompleto(normalizar(extraerNombre(root)))
                    .build();
        } catch (Exception e) {
            throw new IntegracionHroException("No se pudo interpretar la respuesta del API: " + e.getMessage());
        }
    }

    private String extraerNombre(JsonNode root) {
        JsonNode nombre = root.path("name").path(0);
        if (nombre.isMissingNode()) {
            return "";
        }
        StringBuilder sb = new StringBuilder();
        JsonNode given = nombre.path("given");
        if (given.isArray()) {
            given.forEach(parte -> sb.append(parte.asText()).append(' '));
        }
        JsonNode family = nombre.path("family");
        if (!family.isMissingNode()) {
            sb.append(family.asText());
        }
        return sb.toString().trim();
    }

    /** Normaliza a Title Case: "ADOLFO MARTIN AJUCUM CUA" → "Adolfo Martin Ajucum Cua". */
    static String normalizar(String texto) {
        if (texto == null || texto.isBlank()) {
            return texto;
        }
        return Arrays.stream(texto.trim().split("\\s+"))
                .filter(palabra -> !palabra.isBlank())
                .map(palabra -> palabra.substring(0, 1).toUpperCase() + palabra.substring(1).toLowerCase())
                .collect(Collectors.joining(" "));
    }

    private void registrarLog(String expediente, String url, Integer estado, boolean exito,
                              long duracionMs, String respuesta, String error) {
        try {
            logRepository.save(IntegracionHroLog.builder()
                    .numeroExpediente(expediente)
                    .url(url)
                    .metodo("GET")
                    .estadoHttp(estado)
                    .exitoso(exito)
                    .duracionMs(duracionMs)
                    .respuesta(respuesta)
                    .error(error)
                    .usuarioReferenciaId(UsuarioContexto.actual().map(IdentidadUsuario::id).orElse(null))
                    .fecha(OffsetDateTime.now())
                    .build());
        } catch (Exception e) {
            log.warn("No se pudo registrar el log de integración HRO: {}", e.getMessage());
        }
    }
}

package com.hro.system.integracion.config;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.web.client.RestClientCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.JdkClientHttpRequestFactory;

import java.net.http.HttpClient;
import java.time.Duration;

/**
 * Configura los timeouts de conexión/lectura del cliente HTTP de integración.
 */
@Configuration
@RequiredArgsConstructor
public class IntegracionHttpConfig {

    private final IntegracionExpedientesProperties properties;

    @Bean
    public RestClientCustomizer integracionRestClientCustomizer() {
        return builder -> {
            HttpClient httpClient = HttpClient.newBuilder()
                    .connectTimeout(Duration.ofMillis(properties.getTimeoutMs()))
                    .build();
            JdkClientHttpRequestFactory factory = new JdkClientHttpRequestFactory(httpClient);
            factory.setReadTimeout(Duration.ofMillis(properties.getTimeoutMs()));
            builder.requestFactory(factory);
        };
    }
}

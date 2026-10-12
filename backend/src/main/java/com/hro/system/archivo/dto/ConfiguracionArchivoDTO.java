package com.hro.system.archivo.dto;

/**
 * Configuración de la Estación de Archivo: número de expediente umbral que
 * separa ARCHIVO ACTIVO (mayor al umbral) de ARCHIVO PASIVO (menor o igual).
 */
public record ConfiguracionArchivoDTO(Long umbralActivo) {
}

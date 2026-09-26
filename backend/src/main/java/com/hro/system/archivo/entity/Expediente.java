package com.hro.system.archivo.entity;

import com.hro.system.paciente.entity.Paciente;
import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * El expediente físico como objeto: existe una sola vez por paciente.
 * La PK es UUID para poder imprimirse/escancearse como código de barras o QR.
 */
@Entity
@Table(name = "expediente")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Expediente {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "paciente_id", nullable = false, unique = true)
    private Paciente paciente;

    @Column(name = "numero_expediente", nullable = false, unique = true, length = 30)
    private String numeroExpediente;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ubicacion_base_id")
    private UbicacionArchivo ubicacionBase;

    @Column(name = "activo", nullable = false)
    @Builder.Default
    private Boolean activo = true;

    @Column(name = "creado_en", nullable = false, updatable = false)
    @Builder.Default
    private OffsetDateTime creadoEn = OffsetDateTime.now();
}

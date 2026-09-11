package com.hro.system.usuario.repository;

import com.hro.system.usuario.entity.PermisoClinica;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PermisoClinicaRepository extends JpaRepository<PermisoClinica, Long> {

    List<PermisoClinica> findByUsuarioReferenciaId(Long usuarioReferenciaId);

    Optional<PermisoClinica> findByUsuarioReferenciaIdAndClinicaIdAndTipoPermiso(
            Long usuarioReferenciaId, Long clinicaId, String tipoPermiso);
}

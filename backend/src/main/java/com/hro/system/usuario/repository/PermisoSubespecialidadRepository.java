package com.hro.system.usuario.repository;

import com.hro.system.usuario.entity.PermisoSubespecialidad;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PermisoSubespecialidadRepository extends JpaRepository<PermisoSubespecialidad, Long> {

    List<PermisoSubespecialidad> findByUsuarioReferenciaId(Long usuarioReferenciaId);

    Optional<PermisoSubespecialidad> findByUsuarioReferenciaIdAndSubespecialidadIdAndTipoPermiso(
            Long usuarioReferenciaId, Long subespecialidadId, String tipoPermiso);
}

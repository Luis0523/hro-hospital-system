-- V37: nueva etiqueta de salida de Enfermería a Archivo.
ALTER TABLE salida_enfermeria_archivo
    DROP CONSTRAINT IF EXISTS ck_salida_enf_tipo;

ALTER TABLE salida_enfermeria_archivo
    ADD CONSTRAINT ck_salida_enf_tipo
    CHECK (tipo IN ('normal', 'privado_libertad', 'personal', 'presentacion', 'clinica_mujer'));

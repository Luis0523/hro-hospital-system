-- =====================================================================
-- SEEDS: Pacientes de Prueba - Hospital Regional de Occidente (HRO)
-- =====================================================================

INSERT INTO paciente (dpi, nombres, apellidos, fecha_nacimiento, sexo, telefono, direccion, numero_expediente)
VALUES
    ('2984123450901', 'Juan Carlos', 'López Morales', '1985-04-12', 'M', '50255551234', 'Zona 1, Quetzaltenango', 'EXP-2024-001'),
    ('1823948570901', 'María Elena', 'Gómez Sac', '1992-08-23', 'F', '50244445678', 'Zona 3, Quetzaltenango', 'EXP-2024-002'),
    ('2567891230801', 'Pedro Antonio', 'Citalán Pérez', '1958-11-05', 'M', '50277778910', 'Cantel, Quetzaltenango', 'EXP-2023-8941'),
    ('3012456780901', 'Ana Sofía', 'Méndez Castillo', '2001-02-18', 'F', '50233334455', 'Salcajá, Quetzaltenango', 'EXP-2024-003'),
    ('1945678901201', 'Carlos Enrique', 'Oroxom Vásquez', '1974-06-30', 'M', '50255559988', 'San Mateo, Quetzaltenango', 'EXP-2024-004'),
    ('2789123450901', 'Silvia Patricia', 'De León Fuentes', '1965-09-14', 'F', '50244441122', 'La Esperanza, Quetzaltenango', 'EXP-2022-5412'),
    ('3123456780901', 'José David', 'Alvarado Tzoc', '1998-12-01', 'M', '50255557766', 'Olintepeque, Quetzaltenango', 'EXP-2024-005'),
    ('2234567890901', 'Rosa Amalia', 'Rodas Chojolán', '1952-03-25', 'F', '50277773344', 'Zona 5, Quetzaltenango', 'EXP-2021-1209'),
    ('2890123450901', 'Francisco Javier', 'Guzmán Estrada', '1988-07-19', 'M', '50233338899', 'Almolonga, Quetzaltenango', 'EXP-2024-006'),
    ('3245678900901', 'Glendy Marisol', 'Xicay Batz', '2003-10-08', 'F', '50244446677', 'Zunil, Quetzaltenango', NULL)
ON CONFLICT (dpi) DO NOTHING;

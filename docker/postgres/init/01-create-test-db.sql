-- Base de datos dedicada para las pruebas de integración que dependen de
-- funciones/triggers de PostgreSQL (perfil Spring `test-postgres`).
-- Se crea automáticamente en la primera inicialización del contenedor Postgres.
-- Así las pruebas NUNCA escriben en la base de desarrollo/producción (hro_db).
SELECT 'CREATE DATABASE hro_db_test'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'hro_db_test')\gexec

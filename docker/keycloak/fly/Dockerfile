FROM quay.io/keycloak/keycloak:25.0

# Realm de pruebas del SIGHO (HRO). Se importa al arrancar (--import-realm).
COPY realm-hro.json /opt/keycloak/data/import/realm-hro.json

ENV KC_HEALTH_ENABLED=true

ENTRYPOINT ["/opt/keycloak/bin/kc.sh"]
CMD ["start-dev", "--import-realm"]

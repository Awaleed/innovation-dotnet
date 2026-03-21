#!/bin/bash
set -e

# Innovation Platform — First-Run Setup
# Generates .env from .env.example with random passwords,
# then injects the LDAP password into the Keycloak realm JSON.

if [ -f .env ]; then
    echo ".env already exists. Delete it first if you want to regenerate."
    exit 1
fi

if [ ! -f .env.example ]; then
    echo ".env.example not found. Run this script from the docker-compose directory."
    exit 1
fi

generate_password() {
    openssl rand -base64 24 | tr -d '/+=' | head -c 24
}

cp .env.example .env

# Generate random passwords
PG_PWD=$(generate_password)
REDIS_PWD=$(generate_password)
KC_PWD=$(generate_password)
LDAP_PWD=$(generate_password)

sed -i "s|POSTGRES_PASSWORD=CHANGE_ME|POSTGRES_PASSWORD=$PG_PWD|" .env
sed -i "s|REDIS_PASSWORD=CHANGE_ME|REDIS_PASSWORD=$REDIS_PWD|" .env
sed -i "s|KEYCLOAK_PASSWORD=CHANGE_ME|KEYCLOAK_PASSWORD=$KC_PWD|" .env
sed -i "s|LDAP_ADMIN_PASSWORD=CHANGE_ME|LDAP_ADMIN_PASSWORD=$LDAP_PWD|" .env

# Inject LDAP password into Keycloak realm JSON (bindCredential)
for f in keycloak/realms/*.json; do
    if [ -f "$f" ]; then
        sed -i "s|\"adminpassword\"|\"$LDAP_PWD\"|g" "$f"
    fi
done

echo ""
echo "=== Setup complete ==="
echo ""
echo "Generated .env with random passwords."
echo "Keycloak realm updated with matching LDAP credentials."
echo ""
echo "IMPORTANT: Edit .env and set your DOMAIN and AUTH_DOMAIN:"
echo "  nano .env"
echo ""
echo "Then start the platform:"
echo "  docker compose up -d"
echo ""
echo "Access:"
echo "  App:       https://\$DOMAIN"
echo "  Keycloak:  https://\$AUTH_DOMAIN"
echo "  Dashboard: http://localhost:18888"

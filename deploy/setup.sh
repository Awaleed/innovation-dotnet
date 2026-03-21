#!/bin/bash
set -e

# Innovation Platform — First-Run Setup
# Generates .env with random passwords from .env.example

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

generate_secret() {
    openssl rand -hex 32
}

cp .env.example .env

# Generate random passwords
sed -i "s|POSTGRES_PASSWORD=CHANGE_ME|POSTGRES_PASSWORD=$(generate_password)|" .env
sed -i "s|REDIS_PASSWORD=CHANGE_ME|REDIS_PASSWORD=$(generate_password)|" .env
sed -i "s|KEYCLOAK_PASSWORD=CHANGE_ME|KEYCLOAK_PASSWORD=$(generate_password)|" .env
sed -i "s|LDAP_ADMIN_PASSWORD=CHANGE_ME|LDAP_ADMIN_PASSWORD=$(generate_password)|" .env
sed -i "s|KEYCLOAK_CLIENT_SECRET=CHANGE_ME|KEYCLOAK_CLIENT_SECRET=$(generate_secret)|" .env

echo ""
echo "Generated .env with random passwords."
echo ""
echo "IMPORTANT: Edit .env and set your DOMAIN and AUTH_DOMAIN before starting:"
echo "  nano .env"
echo ""
echo "Then start the platform:"
echo "  docker compose up -d"

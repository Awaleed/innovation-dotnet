#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="$(dirname "$SCRIPT_DIR")"

echo "=== Innovation Platform - Kubernetes Deployment ==="

# Apply namespace first
echo "[1/8] Creating namespace..."
kubectl apply -f "$SCRIPT_DIR/00-namespace.yaml"

# Create ConfigMaps from files (if source files exist)
echo "[2/8] Creating ConfigMaps..."

if [ -d "$DEPLOY_DIR/keycloak" ]; then
  kubectl create configmap keycloak-realm \
    --namespace=innovation \
    --from-file="$DEPLOY_DIR/keycloak/" \
    --dry-run=client -o yaml | kubectl apply -f -
  echo "  - keycloak-realm ConfigMap created"
fi

if [ -d "$DEPLOY_DIR/ldap" ]; then
  kubectl create configmap ldap-seed \
    --namespace=innovation \
    --from-file="$DEPLOY_DIR/ldap/" \
    --dry-run=client -o yaml | kubectl apply -f -
  echo "  - ldap-seed ConfigMap created"
fi

if [ -d "$DEPLOY_DIR/postgres" ]; then
  kubectl create configmap postgres-init \
    --namespace=innovation \
    --from-file="$DEPLOY_DIR/postgres/" \
    --dry-run=client -o yaml | kubectl apply -f -
  echo "  - postgres-init ConfigMap created"
fi

# Apply secrets
echo "[3/8] Applying secrets..."
kubectl apply -f "$SCRIPT_DIR/01-secrets.yaml"

# Apply data stores
echo "[4/8] Deploying PostgreSQL..."
kubectl apply -f "$SCRIPT_DIR/10-postgres.yaml"

echo "[5/8] Deploying Redis..."
kubectl apply -f "$SCRIPT_DIR/11-redis.yaml"

echo "[6/8] Deploying OpenLDAP..."
kubectl apply -f "$SCRIPT_DIR/12-openldap.yaml"
kubectl apply -f "$SCRIPT_DIR/13-phpldapadmin.yaml"

# Wait for data stores to be ready
echo "  Waiting for data stores..."
kubectl wait --namespace=innovation --for=condition=available --timeout=120s deployment/postgres || true
kubectl wait --namespace=innovation --for=condition=available --timeout=120s deployment/redis || true
kubectl wait --namespace=innovation --for=condition=available --timeout=120s deployment/openldap || true

# Apply Keycloak
echo "[7/8] Deploying Keycloak..."
kubectl apply -f "$SCRIPT_DIR/20-keycloak.yaml"
kubectl wait --namespace=innovation --for=condition=available --timeout=180s deployment/keycloak || true

# Apply application and dashboard
echo "[8/8] Deploying application..."
kubectl apply -f "$SCRIPT_DIR/30-web.yaml"
kubectl apply -f "$SCRIPT_DIR/31-dashboard.yaml"
kubectl apply -f "$SCRIPT_DIR/40-ingress.yaml"

# Wait for all deployments
echo ""
echo "Waiting for all deployments to be ready..."
kubectl wait --namespace=innovation --for=condition=available --timeout=180s deployment --all || true

echo ""
echo "=== Deployment Status ==="
kubectl get pods -n innovation
echo ""
kubectl get svc -n innovation
echo ""
kubectl get ingress -n innovation
echo ""
echo "=== Deployment complete ==="

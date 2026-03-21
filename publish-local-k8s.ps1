<#
.SYNOPSIS
    Builds and tests the Innovation Platform locally via Kubernetes (Kind).
.DESCRIPTION
    Builds the web app and custom Keycloak container images locally,
    creates a Kind cluster, generates K8s manifests, and deploys everything.
    One command to test the full Kubernetes deployment on your machine.
.PARAMETER ImageTag
    Tag for the local container images. Default: local
.PARAMETER Output
    Output directory for generated manifests. Default: dist-local-k8s
.PARAMETER ClusterName
    Name of the Kind cluster. Default: innovation
.PARAMETER Down
    Delete the Kind cluster and clean up.
#>
param(
    [string]$ImageTag = "local",
    [string]$Output = "dist-local-k8s",
    [string]$ClusterName = "innovation",
    [switch]$Down
)

$ErrorActionPreference = "Stop"
$ImageName = "innovation-web"
$FullImage = "${ImageName}:${ImageTag}"
$KeycloakImage = "innovation-keycloak:${ImageTag}"
$Namespace = "innovation"
$manifestDir = "$Output\manifests"

# Helper: generate a random password
function New-Password {
    $chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    -join (1..24 | ForEach-Object { $chars[(Get-Random -Maximum $chars.Length)] })
}

# --- Down mode: delete the cluster ---
if ($Down) {
    Write-Host "Deleting Kind cluster '$ClusterName'..." -ForegroundColor Yellow
    kind delete cluster --name $ClusterName 2>$null
    if (Test-Path $Output) {
        Remove-Item -Recurse -Force $Output
    }
    Write-Host "Cluster deleted." -ForegroundColor Green
    return
}

# --- Prerequisites ---
$missing = @()
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) { $missing += "docker" }
if (-not (Get-Command kubectl -ErrorAction SilentlyContinue)) { $missing += "kubectl" }
if (-not (Get-Command kind -ErrorAction SilentlyContinue)) { $missing += "kind (https://kind.sigs.k8s.io/docs/user/quick-start/#installation)" }
if ($missing.Count -gt 0) {
    Write-Host "Missing prerequisites:" -ForegroundColor Red
    $missing | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
    exit 1
}

Write-Host "=== Innovation Platform — Local K8s Test ===" -ForegroundColor Cyan
Write-Host "Image:   $FullImage"
Write-Host "Cluster: $ClusterName"
Write-Host "Output:  $Output"
Write-Host ""

# Clean output
if (Test-Path $Output) {
    Remove-Item -Recurse -Force $Output
}
New-Item -ItemType Directory -Path $manifestDir -Force | Out-Null

# --- Build web container image ---
Write-Host "Building web container image: $FullImage ..." -ForegroundColor Yellow
dotnet publish src\Innovation.Web -c Release `
    -p:PublishProfile=DefaultContainer `
    -p:ContainerRepository=$ImageName `
    -p:ContainerImageTag=$ImageTag
Write-Host "Image built: $FullImage" -ForegroundColor Green

# --- Build custom Keycloak image (base + theme JARs) ---
Write-Host ""
Write-Host "Building Keycloak image with themes: $KeycloakImage ..." -ForegroundColor Yellow
$kcBuildDir = "$Output\keycloak"
New-Item -ItemType Directory -Path "$kcBuildDir\themes" -Force | Out-Null
Copy-Item src\Innovation.AppHost\KeycloakThemes\* "$kcBuildDir\themes\"

$dockerfile = @'
FROM quay.io/keycloak/keycloak:26.4
COPY themes/ /opt/keycloak/providers/
'@
Set-Content -Path "$kcBuildDir\Dockerfile" -Value $dockerfile -NoNewline
docker build -t $KeycloakImage "$kcBuildDir"
Write-Host "Image built: $KeycloakImage" -ForegroundColor Green

# --- Create Kind cluster ---
Write-Host ""
# Delete existing cluster if it exists
$existingClusters = kind get clusters 2>$null
if ($existingClusters -match $ClusterName) {
    Write-Host "Deleting existing Kind cluster '$ClusterName'..." -ForegroundColor Yellow
    kind delete cluster --name $ClusterName
}

Write-Host "Creating Kind cluster '$ClusterName'..." -ForegroundColor Yellow
$kindConfig = @'
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
nodes:
  - role: control-plane
    extraPortMappings:
      - containerPort: 30200
        hostPort: 5200
        protocol: TCP
      - containerPort: 30080
        hostPort: 8080
        protocol: TCP
      - containerPort: 30888
        hostPort: 18888
        protocol: TCP
'@
$kindConfigFile = "$Output\kind-config.yaml"
Set-Content -Path $kindConfigFile -Value $kindConfig -NoNewline
kind create cluster --name $ClusterName --config $kindConfigFile
Write-Host "Cluster created." -ForegroundColor Green

# --- Load images into Kind ---
Write-Host ""
Write-Host "Loading images into Kind cluster..." -ForegroundColor Yellow
kind load docker-image $FullImage --name $ClusterName
kind load docker-image $KeycloakImage --name $ClusterName
Write-Host "Images loaded." -ForegroundColor Green

# --- Generate passwords ---
$pgPassword = New-Password
$redisPassword = New-Password
$kcPassword = New-Password

# --- Write and apply manifests ---
Write-Host ""
Write-Host "Applying Kubernetes manifests..." -ForegroundColor Yellow

# Namespace
$nsYaml = @"
apiVersion: v1
kind: Namespace
metadata:
  name: $Namespace
"@
Set-Content -Path "$manifestDir\namespace.yaml" -Value $nsYaml
kubectl apply -f "$manifestDir\namespace.yaml"

# Secrets
$secretYaml = @"
apiVersion: v1
kind: Secret
metadata:
  name: innovation-secrets
  namespace: $Namespace
type: Opaque
stringData:
  postgres-password: "$pgPassword"
  redis-password: "$redisPassword"
  keycloak-password: "$kcPassword"
"@
Set-Content -Path "$manifestDir\secrets.yaml" -Value $secretYaml
kubectl apply -f "$manifestDir\secrets.yaml"

# ConfigMaps (from files)
kubectl create configmap keycloak-realm --from-file=innovation.json=deploy\keycloak\realms\innovation.json -n $Namespace --dry-run=client -o yaml | kubectl apply -f -
kubectl create configmap ldap-seed --from-file=seed-users.ldif=deploy\ldap\seed-users.ldif -n $Namespace --dry-run=client -o yaml | kubectl apply -f -

# PostgreSQL
$postgresYaml = @"
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: postgres-data
  namespace: $Namespace
spec:
  accessModes: [ReadWriteOnce]
  resources:
    requests:
      storage: 1Gi
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: postgres
  namespace: $Namespace
spec:
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
        - name: postgres
          image: docker.io/ankane/pgvector:latest
          ports:
            - containerPort: 5432
          env:
            - name: POSTGRES_DB
              value: "innovationdb"
            - name: POSTGRES_USER
              value: "postgres"
            - name: POSTGRES_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: innovation-secrets
                  key: postgres-password
            - name: POSTGRES_HOST_AUTH_METHOD
              value: "scram-sha-256"
            - name: POSTGRES_INITDB_ARGS
              value: "--auth-host=scram-sha-256 --auth-local=scram-sha-256"
          readinessProbe:
            exec:
              command: ["pg_isready", "-U", "postgres", "-d", "innovationdb"]
            initialDelaySeconds: 5
            periodSeconds: 5
          volumeMounts:
            - name: data
              mountPath: /var/lib/postgresql/data
      volumes:
        - name: data
          persistentVolumeClaim:
            claimName: postgres-data
---
apiVersion: v1
kind: Service
metadata:
  name: postgres
  namespace: $Namespace
spec:
  selector:
    app: postgres
  ports:
    - port: 5432
      targetPort: 5432
"@
Set-Content -Path "$manifestDir\postgres.yaml" -Value $postgresYaml
kubectl apply -f "$manifestDir\postgres.yaml"

# Redis
$redisYaml = @"
apiVersion: apps/v1
kind: Deployment
metadata:
  name: redis
  namespace: $Namespace
spec:
  replicas: 1
  selector:
    matchLabels:
      app: redis
  template:
    metadata:
      labels:
        app: redis
    spec:
      containers:
        - name: redis
          image: docker.io/library/redis:8.2
          command: ["redis-server", "--requirepass", "$redisPassword"]
          ports:
            - containerPort: 6379
          env:
            - name: REDIS_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: innovation-secrets
                  key: redis-password
          readinessProbe:
            exec:
              command: ["sh", "-c", "redis-cli -a $redisPassword ping | grep PONG"]
            initialDelaySeconds: 5
            periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: redis
  namespace: $Namespace
spec:
  selector:
    app: redis
  ports:
    - port: 6379
      targetPort: 6379
"@
Set-Content -Path "$manifestDir\redis.yaml" -Value $redisYaml
kubectl apply -f "$manifestDir\redis.yaml"

# OpenLDAP
$ldapYaml = @"
apiVersion: apps/v1
kind: Deployment
metadata:
  name: openldap
  namespace: $Namespace
spec:
  replicas: 1
  selector:
    matchLabels:
      app: openldap
  template:
    metadata:
      labels:
        app: openldap
    spec:
      initContainers:
        - name: copy-ldap-seed
          image: busybox:1.36
          command: ["sh", "-c", "cp /seed-readonly/* /seed-writable/"]
          volumeMounts:
            - name: ldap-seed-cm
              mountPath: /seed-readonly
            - name: ldap-seed-writable
              mountPath: /seed-writable
      containers:
        - name: openldap
          image: osixia/openldap:latest
          ports:
            - containerPort: 389
          env:
            - name: LDAP_ORGANISATION
              value: "Company"
            - name: LDAP_DOMAIN
              value: "company.local"
            - name: LDAP_ADMIN_PASSWORD
              value: "adminpassword"
            - name: LDAP_REMOVE_CONFIG_AFTER_SETUP
              value: "false"
          volumeMounts:
            - name: ldap-seed-writable
              mountPath: /container/service/slapd/assets/config/bootstrap/ldif/custom
      volumes:
        - name: ldap-seed-cm
          configMap:
            name: ldap-seed
        - name: ldap-seed-writable
          emptyDir: {}
---
apiVersion: v1
kind: Service
metadata:
  name: openldap
  namespace: $Namespace
spec:
  selector:
    app: openldap
  ports:
    - port: 389
      targetPort: 389
"@
Set-Content -Path "$manifestDir\openldap.yaml" -Value $ldapYaml
kubectl apply -f "$manifestDir\openldap.yaml"

# phpLDAPadmin
$phpldapadminYaml = @"
apiVersion: apps/v1
kind: Deployment
metadata:
  name: phpldapadmin
  namespace: $Namespace
spec:
  replicas: 1
  selector:
    matchLabels:
      app: phpldapadmin
  template:
    metadata:
      labels:
        app: phpldapadmin
    spec:
      containers:
        - name: phpldapadmin
          image: osixia/phpldapadmin:latest
          ports:
            - containerPort: 443
          env:
            - name: PHPLDAPADMIN_LDAP_HOSTS
              value: "openldap"
---
apiVersion: v1
kind: Service
metadata:
  name: phpldapadmin
  namespace: $Namespace
spec:
  selector:
    app: phpldapadmin
  ports:
    - port: 443
      targetPort: 443
"@
Set-Content -Path "$manifestDir\phpldapadmin.yaml" -Value $phpldapadminYaml
kubectl apply -f "$manifestDir\phpldapadmin.yaml"

# Keycloak
$keycloakYaml = @"
apiVersion: apps/v1
kind: Deployment
metadata:
  name: keycloak
  namespace: $Namespace
spec:
  replicas: 1
  selector:
    matchLabels:
      app: keycloak
  template:
    metadata:
      labels:
        app: keycloak
    spec:
      initContainers:
        - name: wait-for-ldap
          image: busybox:1.36
          command: ["sh", "-c", "until nc -z openldap 389; do echo waiting for openldap; sleep 2; done"]
      containers:
        - name: keycloak
          image: $KeycloakImage
          imagePullPolicy: Never
          args: ["start-dev", "--import-realm"]
          ports:
            - containerPort: 8080
            - containerPort: 9000
          env:
            - name: KC_BOOTSTRAP_ADMIN_USERNAME
              value: "admin"
            - name: KC_BOOTSTRAP_ADMIN_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: innovation-secrets
                  key: keycloak-password
            - name: KC_HEALTH_ENABLED
              value: "true"
            - name: KC_FEATURES
              value: "opentelemetry"
            - name: OTEL_EXPORTER_OTLP_ENDPOINT
              value: "http://innovation-dashboard:18889"
            - name: OTEL_EXPORTER_OTLP_PROTOCOL
              value: "grpc"
            - name: OTEL_SERVICE_NAME
              value: "keycloak"
          readinessProbe:
            tcpSocket:
              port: 9000
            initialDelaySeconds: 30
            periodSeconds: 5
            failureThreshold: 30
          volumeMounts:
            - name: realm-import
              mountPath: /opt/keycloak/data/import
      volumes:
        - name: realm-import
          configMap:
            name: keycloak-realm
---
apiVersion: v1
kind: Service
metadata:
  name: keycloak
  namespace: $Namespace
spec:
  type: NodePort
  selector:
    app: keycloak
  ports:
    - name: http
      port: 8080
      targetPort: 8080
      nodePort: 30080
    - name: management
      port: 9000
      targetPort: 9000
"@
Set-Content -Path "$manifestDir\keycloak.yaml" -Value $keycloakYaml
kubectl apply -f "$manifestDir\keycloak.yaml"

# Aspire Dashboard
$dashboardYaml = @"
apiVersion: apps/v1
kind: Deployment
metadata:
  name: innovation-dashboard
  namespace: $Namespace
spec:
  replicas: 1
  selector:
    matchLabels:
      app: innovation-dashboard
  template:
    metadata:
      labels:
        app: innovation-dashboard
    spec:
      containers:
        - name: dashboard
          image: mcr.microsoft.com/dotnet/nightly/aspire-dashboard:latest
          ports:
            - containerPort: 18888
            - containerPort: 18889
            - containerPort: 18890
---
apiVersion: v1
kind: Service
metadata:
  name: innovation-dashboard
  namespace: $Namespace
spec:
  type: NodePort
  selector:
    app: innovation-dashboard
  ports:
    - name: ui
      port: 18888
      targetPort: 18888
      nodePort: 30888
    - name: otlp-grpc
      port: 18889
      targetPort: 18889
    - name: otlp-http
      port: 18890
      targetPort: 18890
"@
Set-Content -Path "$manifestDir\dashboard.yaml" -Value $dashboardYaml
kubectl apply -f "$manifestDir\dashboard.yaml"

# Web App
$webYaml = @"
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web
  namespace: $Namespace
spec:
  replicas: 1
  selector:
    matchLabels:
      app: web
  template:
    metadata:
      labels:
        app: web
    spec:
      initContainers:
        - name: wait-for-postgres
          image: docker.io/ankane/pgvector:latest
          command: ["sh", "-c", "until pg_isready -h postgres -U postgres -d innovationdb; do echo waiting for postgres; sleep 2; done"]
        - name: wait-for-keycloak
          image: busybox:1.36
          command: ["sh", "-c", "until nc -z keycloak 9000; do echo waiting for keycloak; sleep 3; done"]
      containers:
        - name: web
          image: $FullImage
          imagePullPolicy: Never
          ports:
            - containerPort: 8080
          env:
            - name: ASPNETCORE_FORWARDEDHEADERS_ENABLED
              value: "true"
            - name: HTTP_PORTS
              value: "8080"
            - name: ConnectionStrings__innovationdb
              value: "Host=postgres;Port=5432;Username=postgres;Password=$pgPassword;Database=innovationdb"
            - name: ConnectionStrings__keycloak
              value: "http://keycloak:8080"
            - name: ConnectionStrings__redis
              value: "redis:6379,password=$redisPassword"
            - name: Keycloak__FrontendUrl
              value: "http://localhost:8080"
            - name: OTEL_DOTNET_EXPERIMENTAL_OTLP_EMIT_EXCEPTION_LOG_ATTRIBUTES
              value: "true"
            - name: OTEL_DOTNET_EXPERIMENTAL_OTLP_EMIT_EVENT_LOG_ATTRIBUTES
              value: "true"
            - name: OTEL_DOTNET_EXPERIMENTAL_OTLP_RETRY
              value: "in_memory"
            - name: OTEL_EXPORTER_OTLP_ENDPOINT
              value: "http://innovation-dashboard:18889"
            - name: OTEL_EXPORTER_OTLP_PROTOCOL
              value: "grpc"
            - name: OTEL_SERVICE_NAME
              value: "web"
          readinessProbe:
            tcpSocket:
              port: 8080
            initialDelaySeconds: 10
            periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: web
  namespace: $Namespace
spec:
  type: NodePort
  selector:
    app: web
  ports:
    - port: 8080
      targetPort: 8080
      nodePort: 30200
"@
Set-Content -Path "$manifestDir\web.yaml" -Value $webYaml
kubectl apply -f "$manifestDir\web.yaml"

# --- Wait for readiness ---
Write-Host ""
Write-Host "Waiting for pods to be ready..." -ForegroundColor Yellow
kubectl wait --for=condition=Ready pod -l app=postgres -n $Namespace --timeout=120s
kubectl wait --for=condition=Ready pod -l app=redis -n $Namespace --timeout=60s
kubectl wait --for=condition=Ready pod -l app=keycloak -n $Namespace --timeout=300s
kubectl wait --for=condition=Ready pod -l app=web -n $Namespace --timeout=180s

# --- Success banner ---
Write-Host ""
Write-Host "=== Local K8s test environment ready ===" -ForegroundColor Green
Write-Host ""
Write-Host "  App:       http://localhost:5200" -ForegroundColor Cyan
Write-Host "  Keycloak:  http://localhost:8080" -ForegroundColor Cyan
Write-Host "  Dashboard: http://localhost:18888" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Pods:      kubectl get pods -n $Namespace" -ForegroundColor DarkGray
Write-Host "  Logs:      kubectl logs -f -l app=web -n $Namespace" -ForegroundColor DarkGray
Write-Host "  Stop:      .\publish-local-k8s.ps1 -Down" -ForegroundColor DarkGray

#!/bin/bash
set -e

# Innovation Platform — Backup Script
# Run via cron: 0 2 * * * cd /path/to/docker-compose && ./backup.sh

BACKUP_DIR="${BACKUP_DIR:-./backups}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS="${RETENTION_DAYS:-30}"

mkdir -p "$BACKUP_DIR"

echo "=== Innovation Platform Backup — $TIMESTAMP ==="

# PostgreSQL (all databases: innovationdb + keycloakdb)
echo "Backing up PostgreSQL..."
docker compose exec -T postgres pg_dumpall -U postgres | gzip > "$BACKUP_DIR/pg_${TIMESTAMP}.sql.gz"
PG_SIZE=$(du -h "$BACKUP_DIR/pg_${TIMESTAMP}.sql.gz" | cut -f1)
echo "  -> $BACKUP_DIR/pg_${TIMESTAMP}.sql.gz ($PG_SIZE)"

# LDAP directory
echo "Backing up LDAP..."
docker compose exec -T openldap slapcat 2>/dev/null | gzip > "$BACKUP_DIR/ldap_${TIMESTAMP}.ldif.gz"
LDAP_SIZE=$(du -h "$BACKUP_DIR/ldap_${TIMESTAMP}.ldif.gz" | cut -f1)
echo "  -> $BACKUP_DIR/ldap_${TIMESTAMP}.ldif.gz ($LDAP_SIZE)"

# Redis (RDB snapshot)
echo "Backing up Redis..."
docker compose exec -T redis redis-cli -a "${REDIS_PASSWORD:-}" BGSAVE >/dev/null 2>&1 || true
sleep 2
docker compose cp redis:/data/dump.rdb "$BACKUP_DIR/redis_${TIMESTAMP}.rdb" 2>/dev/null || echo "  [WARN] Redis backup skipped (no dump.rdb)"

# Cleanup old backups
echo "Cleaning up backups older than ${RETENTION_DAYS} days..."
find "$BACKUP_DIR" -name "*.gz" -o -name "*.rdb" -mtime +${RETENTION_DAYS} | xargs rm -f 2>/dev/null

echo "=== Backup complete ==="

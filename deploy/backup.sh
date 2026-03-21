#!/bin/bash
set -e

# Innovation Platform — Backup Script
# Run via cron: 0 2 * * * /path/to/backup.sh

BACKUP_DIR="${BACKUP_DIR:-./backups}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS="${RETENTION_DAYS:-30}"

mkdir -p "$BACKUP_DIR"

echo "=== Innovation Platform Backup — $TIMESTAMP ==="

# PostgreSQL (all databases)
echo "Backing up PostgreSQL..."
docker compose exec -T postgres pg_dumpall -U postgres | gzip > "$BACKUP_DIR/pg_${TIMESTAMP}.sql.gz"
echo "  -> $BACKUP_DIR/pg_${TIMESTAMP}.sql.gz"

# LDAP directory
echo "Backing up LDAP..."
docker compose exec -T openldap slapcat 2>/dev/null | gzip > "$BACKUP_DIR/ldap_${TIMESTAMP}.ldif.gz"
echo "  -> $BACKUP_DIR/ldap_${TIMESTAMP}.ldif.gz"

# Cleanup old backups
echo "Cleaning up backups older than ${RETENTION_DAYS} days..."
find "$BACKUP_DIR" -name "*.gz" -mtime +${RETENTION_DAYS} -delete

echo "=== Backup complete ==="

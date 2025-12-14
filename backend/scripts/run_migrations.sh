#!/bin/bash
# Migration runner script for SubTrack backend
# Usage: ./scripts/run_migrations.sh [upgrade|downgrade|revision|history]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$BACKEND_DIR"

# Check if alembic is installed
if ! command -v alembic &> /dev/null; then
    echo "Error: alembic not found. Install dependencies first:"
    echo "  pip install -e ."
    exit 1
fi

# Default action
ACTION="${1:-upgrade}"

case "$ACTION" in
    upgrade)
        echo "Running database migrations (upgrade to head)..."
        alembic upgrade head
        echo "✓ Migrations applied successfully"
        ;;
    downgrade)
        echo "Rolling back one migration..."
        alembic downgrade -1
        echo "✓ Migration rolled back"
        ;;
    revision)
        MESSAGE="${2:-Auto-generated migration}"
        echo "Creating new migration: $MESSAGE"
        alembic revision --autogenerate -m "$MESSAGE"
        echo "✓ Migration created. Review the file in alembic/versions/ before applying."
        ;;
    history)
        echo "Migration history:"
        alembic history
        ;;
    current)
        echo "Current migration version:"
        alembic current
        ;;
    *)
        echo "Usage: $0 [upgrade|downgrade|revision|history|current]"
        echo ""
        echo "Commands:"
        echo "  upgrade          Apply all pending migrations (default)"
        echo "  downgrade        Roll back one migration"
        echo "  revision [msg]   Create a new migration with autogenerate"
        echo "  history          Show migration history"
        echo "  current          Show current migration version"
        exit 1
        ;;
esac


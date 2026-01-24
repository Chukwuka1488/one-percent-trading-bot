#!/bin/bash
# =============================================================================
# Freqtrade Config Generator
# =============================================================================
# Generates freqtrade/user_data/config.json from config.template.json
# Substitutes environment variables and generates secure defaults
#
# Usage:
#   ./scripts/generate-freqtrade-config.sh
#   ./scripts/generate-freqtrade-config.sh --validate  # Validate only, don't generate
#
# Required for live trading:
#   EXCHANGE_API_KEY, EXCHANGE_API_SECRET
#
# Optional (secure defaults generated if not set):
#   FREQTRADE_JWT_SECRET, FREQTRADE_WS_TOKEN, FREQTRADE_API_PASSWORD
# =============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
TEMPLATE_FILE="$PROJECT_ROOT/freqtrade/user_data/config.template.json"
OUTPUT_FILE="$PROJECT_ROOT/freqtrade/user_data/config.json"
ENV_FILE="$PROJECT_ROOT/.env"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# =============================================================================
# Load environment variables
# =============================================================================
load_env() {
    if [[ -f "$ENV_FILE" ]]; then
        log_info "Loading environment from .env"
        set -a
        source "$ENV_FILE"
        set +a
    else
        log_warn ".env file not found, using existing environment variables"
    fi
}

# =============================================================================
# Generate secure random string
# =============================================================================
generate_secret() {
    openssl rand -hex 32 2>/dev/null || head -c 64 /dev/urandom | base64 | tr -d '\n'
}

# =============================================================================
# Set secure defaults for secrets
# =============================================================================
set_defaults() {
    # Generate JWT secret if not set
    if [[ -z "$FREQTRADE_JWT_SECRET" ]]; then
        export FREQTRADE_JWT_SECRET=$(generate_secret)
        log_info "Generated random FREQTRADE_JWT_SECRET"
    fi

    # Generate WebSocket token if not set
    if [[ -z "$FREQTRADE_WS_TOKEN" ]]; then
        export FREQTRADE_WS_TOKEN=$(generate_secret)
        log_info "Generated random FREQTRADE_WS_TOKEN"
    fi

    # Generate API password if not set
    if [[ -z "$FREQTRADE_API_PASSWORD" ]]; then
        export FREQTRADE_API_PASSWORD=$(generate_secret | head -c 16)
        log_warn "Generated random FREQTRADE_API_PASSWORD: $FREQTRADE_API_PASSWORD"
        log_warn "Save this password to access the Freqtrade API!"
    fi

    # Set defaults for optional vars
    export EXCHANGE_NAME="${EXCHANGE_NAME:-kraken}"
    export EXCHANGE_API_KEY="${EXCHANGE_API_KEY:-}"
    export EXCHANGE_API_SECRET="${EXCHANGE_API_SECRET:-}"
    export TELEGRAM_ENABLED="${TELEGRAM_ENABLED:-false}"
    export TELEGRAM_BOT_TOKEN="${TELEGRAM_BOT_TOKEN:-}"
    export TELEGRAM_CHAT_ID="${TELEGRAM_CHAT_ID:-}"
    export FREQTRADE_API_USER="${FREQTRADE_API_USER:-freqtrade}"
}

# =============================================================================
# Validate configuration
# =============================================================================
validate_config() {
    local errors=0

    log_info "Validating configuration..."

    # Check template exists
    if [[ ! -f "$TEMPLATE_FILE" ]]; then
        log_error "Template file not found: $TEMPLATE_FILE"
        return 1
    fi

    # Check if running in dry_run mode (check template for default)
    local dry_run=$(grep -o '"dry_run": *[^,]*' "$TEMPLATE_FILE" | grep -o 'true\|false')

    if [[ "$dry_run" == "false" ]]; then
        # Live trading requires exchange credentials
        if [[ -z "$EXCHANGE_API_KEY" ]]; then
            log_error "EXCHANGE_API_KEY is required for live trading"
            ((errors++))
        fi
        if [[ -z "$EXCHANGE_API_SECRET" ]]; then
            log_error "EXCHANGE_API_SECRET is required for live trading"
            ((errors++))
        fi
    else
        log_info "Dry-run mode: Exchange credentials optional"
    fi

    # Warn about default credentials
    if [[ "$FREQTRADE_API_USER" == "freqtrade" ]]; then
        log_warn "Using default API username 'freqtrade' - consider changing for production"
    fi

    # Check JWT secret strength
    if [[ ${#FREQTRADE_JWT_SECRET} -lt 32 ]]; then
        log_error "FREQTRADE_JWT_SECRET should be at least 32 characters"
        ((errors++))
    fi

    if [[ $errors -gt 0 ]]; then
        log_error "Validation failed with $errors error(s)"
        return 1
    fi

    log_info "Configuration validated successfully"
    return 0
}

# =============================================================================
# Generate config file
# =============================================================================
generate_config() {
    log_info "Generating config from template..."

    # Use envsubst to replace environment variables
    # We need to handle the special case where values might be empty
    envsubst < "$TEMPLATE_FILE" > "$OUTPUT_FILE"

    # Validate the generated JSON
    if command -v jq &> /dev/null; then
        if ! jq empty "$OUTPUT_FILE" 2>/dev/null; then
            log_error "Generated config is not valid JSON"
            return 1
        fi
        log_info "Generated config is valid JSON"
    else
        log_warn "jq not installed, skipping JSON validation"
    fi

    log_info "Config generated: $OUTPUT_FILE"

    # Set restrictive permissions
    chmod 600 "$OUTPUT_FILE"
    log_info "Set file permissions to 600 (owner read/write only)"
}

# =============================================================================
# Main
# =============================================================================
main() {
    echo "=========================================="
    echo "Freqtrade Config Generator"
    echo "=========================================="

    load_env
    set_defaults

    if [[ "$1" == "--validate" ]]; then
        validate_config
        exit $?
    fi

    if ! validate_config; then
        log_error "Fix validation errors before generating config"
        exit 1
    fi

    generate_config

    echo ""
    log_info "Done! Config ready at: $OUTPUT_FILE"
    echo ""
    echo "Next steps:"
    echo "  1. Review the generated config"
    echo "  2. Start Freqtrade: docker compose up freqtrade"
    echo ""
}

main "$@"

#!/bin/bash
# deploy.sh - Budget-Kas deployment script for VPS
# Usage: bash deploy.sh

set -e

# Configuration
APP_DIR="/var/www/Budget-Kas"
REPO_URL="https://github.com/akbargumelar-art/Budget-Kas.git"
BRANCH="main"
SERVICE_NAME="budget-kas"

echo "=========================================="
echo "  Budget-Kas - Deploy Script"
echo "=========================================="

# 1. Navigate to app directory or clone if not exists
if [ -d "$APP_DIR" ]; then
    echo ""
    echo "[1/6] Pulling latest code from GitHub..."
    cd "$APP_DIR"
    git fetch origin
    git reset --hard origin/$BRANCH
else
    echo ""
    echo "[1/6] Cloning repository..."
    git clone -b $BRANCH "$REPO_URL" "$APP_DIR"
    cd "$APP_DIR"
fi

# 2. Install dependencies
echo ""
echo "[2/6] Installing dependencies..."
npm install

# 3. Run database migration
echo ""
echo "[3/6] Running database migration..."
if [ -f "server/migration_add_input_role.sql" ]; then
    echo "  Checking for pending migrations..."
    # Load DB credentials from .env
    if [ -f ".env" ]; then
        source <(grep -E '^(DB_HOST|DB_USER|DB_PASSWORD|DB_NAME)=' .env)
        
        # Check if activity_logs table already exists
        TABLE_EXISTS=$(mysql -h"$DB_HOST" -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "SHOW TABLES LIKE 'activity_logs';" 2>/dev/null | grep -c 'activity_logs' || true)
        
        if [ "$TABLE_EXISTS" -eq 0 ]; then
            echo "  Running migration: migration_add_input_role.sql"
            mysql -h"$DB_HOST" -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < server/migration_add_input_role.sql
            echo "  Migration completed successfully!"
        else
            echo "  Migration already applied. Skipping."
        fi
    else
        echo "  WARNING: .env file not found. Please run migration manually:"
        echo "  mysql -u [user] -p [database] < server/migration_add_input_role.sql"
    fi
fi

# 4. Build frontend
echo ""
echo "[4/6] Building frontend..."
npm run build

# 5. Restart application
echo ""
echo "[5/6] Restarting application..."
if command -v pm2 &> /dev/null; then
    # Using PM2
    if pm2 list | grep -q "$SERVICE_NAME"; then
        pm2 restart "$SERVICE_NAME"
    else
        pm2 start server/server.js --name "$SERVICE_NAME"
    fi
    pm2 save
    echo "  Application restarted with PM2."
elif command -v systemctl &> /dev/null && systemctl list-units --type=service | grep -q "$SERVICE_NAME"; then
    # Using systemd
    sudo systemctl restart "$SERVICE_NAME"
    echo "  Application restarted with systemd."
else
    echo "  WARNING: Could not detect PM2 or systemd service."
    echo "  Please restart the application manually:"
    echo "  NODE_ENV=production node server/server.js"
fi

# 6. Verify
echo ""
echo "[6/6] Verifying deployment..."
sleep 2
if curl -s -o /dev/null -w "%{http_code}" http://localhost:${PORT:-5001}/api/auth/profile | grep -q "401"; then
    echo "  ✅ Server is running and responding!"
else
    echo "  ⚠️  Server may not be responding. Check logs with: pm2 logs $SERVICE_NAME"
fi

echo ""
echo "=========================================="
echo "  ✅ Deployment complete!"
echo "=========================================="
echo ""
echo "Post-deploy checklist:"
echo "  1. Login sebagai admin"
echo "  2. Buat user baru dengan role 'Input'"
echo "  3. Atur akses dompet untuk user tersebut"
echo "  4. Test login sebagai user input"
echo ""

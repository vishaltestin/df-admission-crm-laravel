#!/usr/bin/env bash
set -euo pipefail

cd /home/user

if [ ! -d /home/user/node_modules ]; then
  npm install --no-audit --no-fund
  rm -rf /home/user/.npm
fi

if ! command -v mysql >/dev/null 2>&1; then
  sudo apt-get update -qq && sudo DEBIAN_FRONTEND=noninteractive apt-get install -y -qq mariadb-server
fi

sudo service mariadb start || true
sudo mysql -u root -e "CREATE DATABASE IF NOT EXISTS df_crm CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci; CREATE USER IF NOT EXISTS 'crm_user'@'127.0.0.1' IDENTIFIED BY 'crm_password'; CREATE USER IF NOT EXISTS 'crm_user'@'localhost' IDENTIFIED BY 'crm_password'; GRANT ALL PRIVILEGES ON *.* TO 'crm_user'@'127.0.0.1'; GRANT ALL PRIVILEGES ON *.* TO 'crm_user'@'localhost'; FLUSH PRIVILEGES;"

TABLE_COUNT=$(mysql -u crm_user -pcrm_password -N -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='df_crm';")
if [ "${TABLE_COUNT:-0}" -lt 80 ]; then
  npx prisma migrate deploy --config prisma7.config.ts
  if [ -f /home/user/prisma/df_crm_demo_data.sql ]; then
    mysql --default-character-set=utf8mb4 -u crm_user -pcrm_password df_crm < /home/user/prisma/df_crm_demo_data.sql
  fi
  npx tsx /home/user/prisma/ensure-demo-accounts.ts
fi

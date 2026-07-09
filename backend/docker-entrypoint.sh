#!/bin/sh
set -eu

echo "DCAM: waiting for PostgreSQL..."

until pg_isready -d "$DATABASE_URL" >/dev/null 2>&1; do
  sleep 2
done

echo "DCAM: PostgreSQL is ready."

psql "$DATABASE_URL" -v ON_ERROR_STOP=1 <<'SQL'
CREATE TABLE IF NOT EXISTS schema_migrations (
  filename TEXT PRIMARY KEY,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
SQL

for migration in /app/database/migrations/*.sql; do
  filename="$(basename "$migration")"

  already_applied="$(
    psql "$DATABASE_URL" \
      -tAc "SELECT EXISTS (
        SELECT 1
        FROM schema_migrations
        WHERE filename = '$filename'
      );"
  )"

  if [ "$already_applied" = "t" ]; then
    echo "DCAM: migration already applied: $filename"
  else
    echo "DCAM: applying migration: $filename"

    psql "$DATABASE_URL" \
      -v ON_ERROR_STOP=1 \
      -f "$migration"

    psql "$DATABASE_URL" \
      -v ON_ERROR_STOP=1 \
      -c "INSERT INTO schema_migrations (filename) VALUES ('$filename');"
  fi
done

admin_email="${SEED_ADMIN_EMAIL:-admin@dcam.local}"

admin_exists="$(
  psql "$DATABASE_URL" \
    -tAc "SELECT EXISTS (
      SELECT 1
      FROM users
      WHERE LOWER(email) = LOWER('$admin_email')
    );"
)"

if [ "$admin_exists" = "t" ]; then
  echo "DCAM: admin account already exists."
else
  echo "DCAM: creating initial admin account."
  node /app/scripts/seed-admin.js
fi

echo "DCAM: starting API."

exec npm start

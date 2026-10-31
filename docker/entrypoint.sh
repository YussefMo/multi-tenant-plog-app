#!/bin/sh
set -e

cd /var/www/html

if [ -z "${APP_KEY:-}" ]; then
    echo "APP_KEY is required. Generate it with: php artisan key:generate --show" >&2
    exit 1
fi

export PORT="${PORT:-8080}"

envsubst '$PORT' \
    < /etc/nginx/templates/default.conf.template \
    > /etc/nginx/conf.d/default.conf

php artisan package:discover --ansi
php artisan config:cache
php artisan route:cache
php artisan view:cache

attempt=0
until php artisan migrate --force; do
    attempt=$((attempt + 1))

    if [ "$attempt" -ge 10 ]; then
        echo "Application database migrations failed." >&2
        exit 1
    fi

    sleep 3
done

attempt=0
until php artisan migrate --force --database=owner --path=database/migrations/owner; do
    attempt=$((attempt + 1))

    if [ "$attempt" -ge 10 ]; then
        echo "Owner database migrations failed." >&2
        exit 1
    fi

    sleep 3
done

if [ "${RUN_DEMO_SEED:-false}" = "true" ]; then
    php artisan db:seed --class=DemoSeeder --force
fi

exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf

#!/bin/sh
set -e

cd /var/www/html

# Hostless runs the container as root without CAP_SETUID / CAP_SETGID / CAP_CHOWN,
# and with a read-only root filesystem. /tmp is the only writable path.
mkdir -p /tmp/laravel/cache /tmp/laravel/views
chmod -R 0777 /tmp/laravel

# One-off commands (embedded cron jobs, ad-hoc artisan runs) replace the web stack.
# The platform may pass the command as one shell string or as separate arguments.
if [ "$#" -eq 1 ]; then
    exec /bin/sh -c "$1"
fi

if [ "$#" -gt 1 ]; then
    exec "$@"
fi

if [ -z "${APP_KEY:-}" ]; then
    echo "APP_KEY is required. Generate it with: php artisan key:generate --show" >&2
    exit 1
fi

export PORT="${PORT:-8080}"

mkdir -p /tmp/nginx/conf.d \
    /tmp/nginx/client_temp \
    /tmp/nginx/proxy_temp \
    /tmp/nginx/fastcgi_temp \
    /tmp/nginx/uwsgi_temp \
    /tmp/nginx/scgi_temp
chmod -R 0777 /tmp/nginx

envsubst '$PORT' \
    < /etc/nginx/templates/default.conf.template \
    > /tmp/nginx/conf.d/default.conf

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

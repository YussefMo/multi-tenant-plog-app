# syntax=docker/dockerfile:1

FROM composer:2 AS vendor

WORKDIR /app

COPY composer.json composer.lock ./
RUN composer config platform.php 8.3 \
    && composer install \
    --no-dev \
    --no-interaction \
    --prefer-dist \
    --no-scripts \
    --optimize-autoloader

COPY . .
RUN composer dump-autoload --no-dev --optimize --no-scripts


FROM php:8.3-fpm-bookworm

RUN apt-get update && apt-get install -y --no-install-recommends \
    nginx \
    supervisor \
    curl \
    gettext-base \
    libicu-dev \
    libzip-dev \
    libonig-dev \
    libpq-dev \
    && docker-php-ext-install pdo_mysql pdo_pgsql bcmath intl zip opcache mbstring \
    && docker-php-ext-enable opcache \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /var/www/html

ENV APP_CONFIG_CACHE=/tmp/laravel/cache/config.php \
    APP_ROUTES_CACHE=/tmp/laravel/cache/routes-v7.php \
    APP_EVENTS_CACHE=/tmp/laravel/cache/events.php \
    APP_PACKAGES_CACHE=/tmp/laravel/cache/packages.php \
    APP_SERVICES_CACHE=/tmp/laravel/cache/services.php \
    VIEW_COMPILED_PATH=/tmp/laravel/views \
    LOG_CHANNEL=stderr

COPY --from=vendor /app /var/www/html
COPY docker/nginx.conf.template /etc/nginx/templates/default.conf.template
COPY docker/nginx-main.conf /etc/nginx/nginx-main.conf
COPY docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh

RUN chmod +x /usr/local/bin/entrypoint.sh \
    && mkdir -p \
        storage/logs \
        storage/framework/cache/data \
        storage/framework/sessions \
        storage/framework/views \
        bootstrap/cache \
    && chown -R www-data:www-data storage bootstrap/cache \
    && rm -f /etc/nginx/sites-enabled/default

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD curl -fsS "http://127.0.0.1:${PORT:-8080}/up" || exit 1

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]

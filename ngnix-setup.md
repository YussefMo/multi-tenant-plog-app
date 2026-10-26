# Laravel API — Nginx + PHP-FPM + WSL Setup

This guide adapts the raw-PHP setup for a Laravel API running on Ubuntu WSL with Nginx and PHP-FPM.

Example project: `~/projects/laravel-api`  
Local domain: `http://laravel-api.test`

> The commands below use PHP 8.3 as an example. Replace `8.3` with the PHP version actually installed on your WSL system. Keep PHP CLI, PHP-FPM, and the Nginx socket aligned.

---

```bash
sudo setfacl -R -m u:www-data:rwX storage bootstrap/cache

sudo find storage bootstrap/cache -type d \
  -exec setfacl -m d:u:www-data:rwX {} \;

sudo systemctl restart php8.3-fpm

php artisan view:clear
```

## 1. Check PHP, Composer, and extensions

```bash
php -v
composer --version
php -m
ls /etc/php/
ls -la /run/php/
```

Install common Laravel requirements using Ubuntu/Debian packages:

```bash
sudo apt update
sudo apt install php php-cli php-fpm php-mbstring php-xml php-bcmath php-mysql php-zip php-curl unzip git
```

Some extensions (for example JSON, OpenSSL, PDO, and tokenizer) may already be included in the PHP build. Laravel's required extensions vary by Laravel/PHP version. If you use a version-specific PHP installation, install matching `php8.3-*` packages when available.

## 2. Start Nginx and PHP-FPM

```bash
sudo systemctl start php8.3-fpm
sudo systemctl start nginx

sudo systemctl status php8.3-fpm --no-pager
sudo systemctl status nginx --no-pager
```

After configuration changes:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

For a full restart:

```bash
sudo systemctl restart php8.3-fpm
sudo systemctl restart nginx
```

## 3. Create the Laravel application

```bash
mkdir -p ~/projects
cd ~/projects
composer create-project laravel/laravel laravel-api
cd laravel-api
php artisan --version
php artisan key:generate
```

Laravel already provides the project structure, Composer autoloading, front controller, router, middleware pipeline, dependency injection container, and database integration. **Do not create a custom `src/`, router, or `public/index.php` bootstrap like the raw PHP project.**

Typical relevant structure:

```text
laravel-api/
├── app/
│   ├── Http/
│   │   ├── Controllers/
│   │   └── Middleware/
│   ├── Models/
│   └── Providers/
├── bootstrap/
├── config/
├── database/
│   ├── migrations/
│   ├── factories/
│   └── seeders/
├── public/
│   └── index.php
├── resources/
├── routes/
├── storage/
├── tests/
├── vendor/
├── .env
├── artisan
└── composer.json
```

Depending on the Laravel version/setup, `routes/api.php` may not exist initially. If you need API routing and the file is absent, run:

```bash
php artisan install:api
```

Review its output; this command sets up API routing and may install Sanctum, depending on the Laravel version.

## 4. Configure `.env` and the database

Edit the environment file:

```bash
nano .env
```

Example values for a local MariaDB/MySQL database:

```dotenv
APP_NAME=LaravelApi
APP_ENV=local
APP_DEBUG=true
APP_URL=http://laravel-api.test

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=laravel_api
DB_USERNAME=your_database_user
DB_PASSWORD=your_database_password
```

Replace the database name and credentials with your actual values. Create the database first, then run:

```bash
php artisan config:clear
php artisan migrate
```

Do not commit `.env` or real secrets to Git. Keep `APP_DEBUG=true` for local development only, never production.

## 5. Create the Nginx server block

```bash
sudo nano /etc/nginx/sites-available/laravel-api
```

Use this configuration, changing the path or socket if your setup differs:

```nginx
server {
    listen 80;
    server_name laravel-api.test;

    root /home/youssef/projects/laravel-api/public;
    index index.php;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location = /favicon.ico { access_log off; log_not_found off; }
    location = /robots.txt  { access_log off; log_not_found off; }

    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/run/php/php8.3-fpm.sock;
    }

    # Prevent access to hidden files such as .env.
    location ~ /\.(?!well-known).* {
        deny all;
    }
}
```

**Important:**
- Nginx `root` must point to Laravel's `public/` directory, not the project root.
- `fastcgi_pass` must match a real socket shown by `ls -la /run/php/`.
- Never expose the whole Laravel project as the web root.
- Give each project its own server block in `/etc/nginx/sites-available/`.

## 6. Enable the site

```bash
sudo ln -s /etc/nginx/sites-available/laravel-api /etc/nginx/sites-enabled/laravel-api
sudo nginx -t
sudo systemctl reload nginx
```

If the symlink already exists, do not create it a second time.

## 7. Configure hosts files

Inside WSL:

```bash
sudo nano /etc/hosts
```

Add:

```text
127.0.0.1 laravel-api.test
```

Windows browser/Postman may also need the Windows hosts file. Open PowerShell as Administrator:

```powershell
notepad C:\Windows\System32\drivers\etc\hosts
```

Add the same line:

```text
127.0.0.1 laravel-api.test
```

Test name resolution from PowerShell:

```powershell
ping laravel-api.test
```

## 8. Add and test an API route

If `routes/api.php` exists, edit it:

```bash
nano routes/api.php
```

Add:

```php
<?php

use Illuminate\Support\Facades\Route;

Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'message' => 'Laravel API is working',
    ]);
});
```

Test from WSL:

```bash
curl http://laravel-api.test/api/health
```

Expected JSON:

```json
{
  "status": "ok",
  "message": "Laravel API is working"
}
```

You can also send `GET http://laravel-api.test/api/health` from Postman. If the route returns 404, check whether `routes/api.php` exists and is registered:

```bash
php artisan route:list
```

## 9. Useful Laravel commands

Run these from the project root:

```bash
# Show routes
php artisan route:list

# Create a controller
php artisan make:controller Api/HealthController

# Create a model and migration
php artisan make:model Post -m

# Create a migration
php artisan make:migration create_posts_table

# Run migrations
php artisan migrate

# Roll back the latest migration batch
php artisan migrate:rollback

# Clear configuration cache
php artisan config:clear

# Clear framework caches in local development
php artisan optimize:clear

# Alternative local server (not required when using Nginx)
php artisan serve
```

## 10. Verify PHP-FPM and Nginx

```bash
sudo systemctl status php8.3-fpm --no-pager
ls -la /run/php/
sudo nginx -t
```

The socket configured in Nginx must match the socket present in `/run/php/`, for example:

```nginx
fastcgi_pass unix:/run/php/php8.3-fpm.sock;
```

## 11. Useful service commands

Nginx:

```bash
sudo systemctl start nginx
sudo systemctl stop nginx
sudo systemctl restart nginx
sudo systemctl reload nginx
sudo systemctl status nginx --no-pager
sudo tail -n 100 /var/log/nginx/error.log
```

PHP-FPM (PHP 8.3 example):

```bash
sudo systemctl start php8.3-fpm
sudo systemctl stop php8.3-fpm
sudo systemctl restart php8.3-fpm
sudo systemctl status php8.3-fpm --no-pager
sudo journalctl -u php8.3-fpm -n 100 --no-pager
```

## 12. Troubleshooting

### 502 Bad Gateway

```bash
sudo systemctl status php8.3-fpm --no-pager
ls -la /run/php/
sudo tail -n 100 /var/log/nginx/error.log
sudo journalctl -u php8.3-fpm -n 100 --no-pager
```

Make sure the FPM service is running and Nginx uses its actual socket.

### 404 Not Found

Check that:
1. Nginx points to `/home/youssef/projects/laravel-api/public`.
2. The route exists.
3. API routes are registered.

```bash
php artisan route:list
sudo nginx -t
sudo systemctl reload nginx
```

### Laravel returns a 500 error

```bash
tail -n 100 storage/logs/laravel.log
ls -ld storage bootstrap/cache
```

PHP-FPM must be able to write to `storage/` and `bootstrap/cache/`. Fix the specific ownership/permissions issue rather than using `chmod -R 777`.

### Composer reports a missing extension

```bash
php -m
php --ini
```

CLI and PHP-FPM can use different versions/configurations. Install the missing extension for the version Laravel uses, then restart the matching FPM service.

### Windows cannot reach the domain but WSL can

Confirm the Windows hosts file includes:

```text
127.0.0.1 laravel-api.test
```

File: `C:\Windows\System32\drivers\etc\hosts`

### Nginx serves the wrong project

```bash
ls -la /etc/nginx/sites-enabled/
sudo nginx -T | grep -n "server_name"
```

Make sure `laravel-api.test` appears in the intended server block and that `sudo nginx -t` succeeds.

## 13. Workflow for every new Laravel project

1. Create it:
   ```bash
   cd ~/projects
   composer create-project laravel/laravel my-api
   cd my-api
   ```
2. Configure `.env`, including `APP_URL` and database credentials.
3. Create the database and run `php artisan migrate`.
4. Create `/etc/nginx/sites-available/my-api`.
5. Point Nginx's root to `/home/youssef/projects/my-api/public`.
6. Use a unique local domain, e.g. `my-api.test`.
7. Enable the site, test Nginx, and reload:
   ```bash
   sudo ln -s /etc/nginx/sites-available/my-api /etc/nginx/sites-enabled/my-api
   sudo nginx -t
   sudo systemctl reload nginx
   ```
8. Add `127.0.0.1 my-api.test` to WSL and Windows hosts files.
9. Verify:
   ```bash
   curl -I http://my-api.test
   php artisan route:list
   ```

## 14. Request architecture

```text
Windows Browser / Postman
          |
          v
    laravel-api.test
          |
          v
      WSL networking
          |
          v
         Nginx
          |
          v
       PHP-FPM
          |
          v
  public/index.php
          |
          v
 Laravel bootstrap
          |
          v
 Global and route middleware
          |
          v
        Router
          |
          v
      Controller
          |
          v
 Validation / Form Request
          |
          v
 Service (when useful)
          |
          v
 Eloquent Model / Query Builder
          |
          v
       Database
```

Laravel already provides routing, middleware, dependency injection, validation, and database integration. Learn the framework's conventions rather than rebuilding the infrastructure you implemented in raw PHP.

**Key idea:** Nginx is a system-level service. Each project has its own server block and local domain, while projects can share the Nginx service and a compatible PHP-FPM service.

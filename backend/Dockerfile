FROM php:8.2-fpm

RUN apt-get update && apt-get install -y \
    zip unzip git curl libzip-dev libssl-dev libpq-dev \
    && docker-php-ext-install zip pdo pdo_mysql pgsql pdo_pgsql

RUN pecl install redis && docker-php-ext-enable redis

WORKDIR /var/www/html

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

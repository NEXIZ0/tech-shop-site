FROM php:8.2-apache

# Install PHP extensions
RUN docker-php-ext-install pdo pdo_mysql mysqli

# Enable Apache modules
RUN a2enmod rewrite headers

# Set permissions for uploads directory
RUN mkdir -p /var/www/html/public/uploads && \
    chown -R www-data:www-data /var/www/html

# Copy Apache configuration
COPY apache.conf /etc/apache2/sites-available/000-default.conf
COPY .htaccess /var/www/html/public/.htaccess

WORKDIR /var/www/html
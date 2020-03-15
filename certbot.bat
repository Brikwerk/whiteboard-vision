docker-compose run --rm --entrypoint^
 ^"certbot certonly --webroot -w /var/www/certbot ^
 --email EMAIL@GOES.HERE ^
 -d WEBSITE.ADDRESS.HERE ^
 --rsa-key-size 4096 ^
 --agree-tos ^
 --no-eff-email ^
 --force-renewal^" certbot

docker stop nginx
docker-compose run --rm --entrypoint^
 ^"certbot certonly --webroot -w /var/www/certbot ^
 --email mail@reecewal.sh ^
 -d wv.reecewal.sh ^
 --rsa-key-size 4096 ^
 --agree-tos ^
 --no-eff-email ^
 --force-renewal^" certbot

docker stop nginx
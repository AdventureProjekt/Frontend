# nginx er en webserver, der bare udleverer vores HTML-, CSS- og JS-filer
FROM nginx:alpine

COPY . /usr/share/nginx/html

EXPOSE 80

FROM nginxinc/nginx-unprivileged:stable-alpine

COPY nginx.conf /etc/nginx/nginx.conf
COPY --chmod=0755 docker/40-backend-origin.sh /docker-entrypoint.d/40-backend-origin.sh
COPY dist/browser /usr/share/nginx/html/

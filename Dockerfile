FROM nginxinc/nginx-unprivileged:stable-alpine

COPY nginx.conf /etc/nginx/nginx.conf
COPY dist/browser /usr/share/nginx/html/

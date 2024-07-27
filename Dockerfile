FROM nginx:latest
COPY dist/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

FROM nginxinc/nginx-unprivileged:stable-alpine

ARG DOCROOT=/usr/share/nginx/html
COPY --chown=nobody:nobody dist/browser ${DOCROOT}
COPY --chown=nobody:nobody nginx.conf /etc/nginx/nginx.conf

USER nginx

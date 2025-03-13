FROM ghcr.io/maplibre/martin:latest

COPY config.yaml /config/config.yaml

RUN ls -l /config

EXPOSE 8080

CMD ["--config", "/config/config.yaml"]
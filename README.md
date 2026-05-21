# POS Comedor

Punto de venta táctil para comedor con turnos de desayuno y almuerzo.

## Requisitos

- Docker
- Docker Compose

## Levantar el proyecto

```bash
# Clonar o descomprimir el proyecto, luego:
docker compose up -d
```

La app queda disponible en: **http://localhost:3000**

## Detener

```bash
docker compose down
```

## Reconstruir tras cambios

```bash
docker compose up -d --build
```

## Estructura del proyecto

```
pos-comedor/
├── public/
│   └── index.html       # App completa (HTML + CSS + JS)
├── server.js            # Servidor Express
├── package.json
├── Dockerfile
├── docker-compose.yml
└── .dockerignore
```

## Cambiar el puerto

Edita `docker-compose.yml` y cambia `"3000:3000"` por el puerto que necesites,
por ejemplo `"8080:3000"` para acceder desde el puerto 8080.

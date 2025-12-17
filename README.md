# DevOps Lab Application

[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://www.docker.com/)
[![Node.js](https://img.shields.io/badge/Node.js-LTS-green.svg)](https://nodejs.org/)
[![Prometheus](https://img.shields.io/badge/Prometheus-Metrics-orange.svg)](https://prometheus.io/)

Aplicación demostrativa para laboratorio DevOps diseñada para ser simple, observable y lista para producción.

## 🎯 Características

- ✅ **Stateless**: Sin estado persistente, ideal para contenedores efímeros
- ✅ **Observable**: Métricas Prometheus y logs estructurados en JSON
- ✅ **Configurable**: Configuración completa via variables de entorno
- ✅ **Zero Downtime**: Tolerante a rolling updates y reinicios
- ✅ **Determinista**: Comportamiento predecible en cualquier entorno
- ✅ **Ligera**: Imagen Docker optimizada basada en Alpine Linux
- ✅ **Validada**: Validación estricta de configuración con fallbacks seguros

## 📁 Estructura del Proyecto

```
labs/
├── app/
│   ├── server.js          # Aplicación Express con métricas y logging
│   └── package.json       # Dependencias (express, prom-client)
├── Dockerfile             # Imagen de producción multi-stage
├── Taskfile.yml          # Automatización de tareas
├── .dockerignore         # Exclusiones para build
├── .gitignore            # Exclusiones para Git
└── README.md             # Esta documentación
```

## 🚀 Inicio Rápido

### Requisitos

- **Docker** (requerido)
- **[Task](https://taskfile.dev/)** (recomendado para automatización)
- **[jq](https://stedolan.github.io/jq/)** (opcional, para análisis de logs JSON)

### Instalación de Task

```bash
# macOS (Homebrew)
brew install go-task

# Linux (script de instalación)
sh -c "$(curl --location https://taskfile.dev/install.sh)" -- -d -b /usr/local/bin

# Windows (Scoop)
scoop install task

# O descarga desde: https://github.com/go-task/task/releases
```

### Uso Básico

#### Con Task (Recomendado)

```bash
# Ver todas las tareas disponibles
task --list

# Construir imagen Docker
task build

# Ejecutar aplicación (modo interactivo)
task run

# Ejecutar en background
task run-detached

# Detener aplicación
task stop

# Limpiar contenedores e imágenes
task clean
```

#### Con Task y configuración personalizada

```bash
# Ejecutar con color y versión específicos
BACKGROUND_COLOR=green APP_VERSION=v2.5.0 task run

# Ejecutar en puerto diferente
PORT=8080 task run
```

#### Con Docker directo

```bash
# 1. Construir imagen
docker build -t devops-lab-app .

# 2. Ejecutar (modo interactivo)
docker run --rm -p 3000:3000 \
  -e BACKGROUND_COLOR=green \
  -e APP_VERSION=v1.0.0 \
  --name devops-lab-app \
  devops-lab-app

# 3. Ejecutar en background
docker run -d -p 3000:3000 \
  -e BACKGROUND_COLOR=blue \
  -e APP_VERSION=v1.0.0 \
  --name devops-lab-app \
  devops-lab-app

# 4. Ver logs
docker logs -f devops-lab-app

# 5. Ver logs JSON formateados
docker logs devops-lab-app 2>&1 | jq -R 'fromjson? // .'

# 6. Detener y eliminar
docker stop devops-lab-app
docker rm devops-lab-app
```

## 🌐 Endpoints Disponibles

Una vez iniciada la aplicación (por defecto en puerto 3000):

| Endpoint | Descripción | Ejemplo |
|----------|-------------|---------|
| `/` | Página web principal con información visual | `http://localhost:3000/` |
| `/?color=red` | Página con color temporal (no afecta métricas) | `http://localhost:3000/?color=blue` |
| `/metrics` | Métricas de Prometheus | `http://localhost:3000/metrics` |
| `/health` | Health check endpoint | `http://localhost:3000/health` |
| `/colors` | Lista de colores permitidos (JSON) | `http://localhost:3000/colors` |
| `/slow?delay=1000` | Endpoint para simular latencia (max 5000ms) | `http://localhost:3000/slow?delay=500` |

## ⚙️ Configuración

### Variables de Entorno

| Variable | Descripción | Por defecto | Valores |
|----------|-------------|-------------|---------|
| `PORT` | Puerto de escucha | `3000` | Cualquier puerto válido (1-65535) |
| `BACKGROUND_COLOR` | Color de fondo base | `white` | Ver tabla de colores permitidos |
| `APP_VERSION` | Versión de la aplicación | `v1.0.0` | Cualquier string |

### 🎨 Colores Permitidos

La aplicación **solo acepta** los siguientes colores para mantener consistencia:

| Nombre (EN) | Nombre (ES) | Código Hex | Uso |
|-------------|-------------|------------|-----|
| `green` | `verde` | `#00ff00` | Ideal para indicar versión estable |
| `red` | `rojo` | `#f18484` | Ideal para indicar versión canary/beta |
| `blue` | `azul` | `#0000ff` | Ideal para indicar versión dev |
| `white` | `blanco` | `#ffffff` | Color por defecto |

**Nota**: Los colores se validan al inicio. Colores inválidos generarán un log de advertencia y usarán `white` como fallback.

### Ejemplos de Configuración

```bash
# ✅ Configuraciones válidas
BACKGROUND_COLOR=green task run
BACKGROUND_COLOR=rojo task run           # alias en español
BACKGROUND_COLOR=#0000ff task run        # código hex directo
BACKGROUND_COLOR=white task run          # valor por defecto

# ❌ Configuraciones inválidas (usarán white con warning)
BACKGROUND_COLOR=yellow task run         # color no permitido
BACKGROUND_COLOR=#123456 task run        # hex no permitido
BACKGROUND_COLOR=purple task run         # color no soportado
```

## 🎨 Colores Temporales (Query Parameters)

Además del color base configurado por variable de entorno, puedes cambiar el color **temporalmente** por petición usando query parameters:

### Características

- ✅ **Stateless**: No modifica el estado del contenedor
- ✅ **Por petición**: Cada usuario puede ver su propio color
- ✅ **Métricas separadas**: Cuenta en `http_temporary_color_requests_total`
- ✅ **No afecta métricas core**: Las métricas principales usan el color base
- ✅ **Logs enriquecidos**: Se registra el color temporal usado
- ✅ **Validación aplicada**: Mismas reglas que el color base
- ✅ **Ideal para demos**: Muestra diferentes colores sin reiniciar

### Uso

```bash
# Desde el navegador
http://localhost:3000/?color=red
http://localhost:3000/?color=green
http://localhost:3000/?color=blue

# Con curl
curl http://localhost:3000/?color=red
curl http://localhost:3000/?color=verde    # alias español

# Validar que métricas NO cambian
curl http://localhost:3000/metrics | grep app_color_info
```

### Diferencia entre Color Base y Color Temporal

| Aspecto | Color Base (env var) | Color Temporal (query param) |
|---------|---------------------|----------------------------|
| **Configuración** | `BACKGROUND_COLOR=green` | `?color=green` |
| **Alcance** | Todo el contenedor | Solo esa petición |
| **Métricas core** | ✅ Se refleja en todas | ❌ No afecta |
| **Métrica específica** | N/A | ✅ `http_temporary_color_requests_total` |
| **Logs** | Siempre presente | Se añade cuando se usa |
| **Requiere reinicio** | ✅ Sí | ❌ No |
| **Ideal para** | Producción, versiones | Demos, pruebas |

## 📊 Observabilidad

### Métricas Prometheus

La aplicación expone métricas en `/metrics` siguiendo las mejores prácticas de Prometheus.

#### Métricas Personalizadas

##### 1. `app_version_info` (Gauge)
Información de la versión y color base configurado.

```promql
app_version_info{version="v1.0.0",color="green"} 1
```

**Labels:**
- `version`: Versión de la aplicación
- `color`: Color base configurado

##### 2. `app_color_info` (Gauge)
Color de fondo configurado en el contenedor.

```promql
app_color_info{color="green",hex_value="#00ff00"} 1
```

**Labels:**
- `color`: Nombre del color
- `hex_value`: Código hexadecimal

##### 3. `http_requests_total` (Counter)
Total de peticiones HTTP recibidas.

```promql
http_requests_total{method="GET",route="/",status_code="200",color="green"} 142
```

**Labels:**
- `method`: Método HTTP (GET, POST, etc.)
- `route`: Ruta solicitada
- `status_code`: Código de respuesta HTTP
- `color`: Color base (no temporal)

##### 4. `http_request_duration_seconds` (Histogram)
Distribución de latencias de peticiones HTTP.

```promql
http_request_duration_seconds_bucket{method="GET",route="/",status_code="200",color="green",le="0.1"} 135
```

**Labels:**
- `method`: Método HTTP
- `route`: Ruta solicitada
- `status_code`: Código de respuesta
- `color`: Color base (no temporal)

**Buckets:** `0.001s, 0.005s, 0.01s, 0.05s, 0.1s, 0.5s, 1s, 2s, 5s`

##### 5. `http_temporary_color_requests_total` (Counter)
Contador específico para peticiones que usaron color temporal via query param.

```promql
http_temporary_color_requests_total{color_base="white",color_requested="red",route="/"} 23
```

**Labels:**
- `color_base`: Color configurado en el contenedor
- `color_requested`: Color temporal solicitado
- `route`: Ruta solicitada

**Nota**: Esta métrica **solo** se incrementa cuando se usa `?color=` en la URL.

#### Métricas por Defecto de Node.js

Además de las métricas personalizadas, se exponen métricas estándar:

- `process_cpu_seconds_total`: Uso de CPU
- `process_resident_memory_bytes`: Uso de memoria
- `nodejs_heap_size_total_bytes`: Tamaño del heap
- `nodejs_eventloop_lag_seconds`: Lag del event loop
- `nodejs_gc_duration_seconds`: Duración de garbage collection
- Y muchas más...

### Queries de Prometheus Útiles

```promql
# ========================================
# GOLDEN SIGNALS
# ========================================

# Latencia: P95 de tiempo de respuesta
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))

# Latencia: Promedio
rate(http_request_duration_seconds_sum[5m]) / rate(http_request_duration_seconds_count[5m])

# Tráfico: Requests por segundo
sum(rate(http_requests_total[5m]))

# Errores: Tasa de errores 5xx
sum(rate(http_requests_total{status_code=~"5.."}[5m]))

# Saturación: Uso de memoria
process_resident_memory_bytes / 1024 / 1024

# ========================================
# ANÁLISIS POR COLOR
# ========================================

# Peticiones por color base
sum by (color) (rate(http_requests_total[5m]))

# Latencia promedio por color
sum by (color) (rate(http_request_duration_seconds_sum[5m])) 
/ 
sum by (color) (rate(http_request_duration_seconds_count[5m]))

# ========================================
# COLORES TEMPORALES
# ========================================

# Uso de colores temporales por segundo
sum by (color_requested) (rate(http_temporary_color_requests_total[5m]))

# Qué colores temporales se piden más desde cada color base
sum by (color_base, color_requested) (http_temporary_color_requests_total)

# Porcentaje de peticiones con color temporal
(
  sum(rate(http_temporary_color_requests_total[5m])) 
  / 
  sum(rate(http_requests_total{route="/"}[5m]))
) * 100

# ========================================
# VERSIÓN Y CONFIGURACIÓN
# ========================================

# Ver versión y color actual
app_version_info

# Ver configuración de color
app_color_info
```

### Logs Estructurados (JSON)

Todos los logs se generan en formato JSON estructurado para facilitar el análisis y la integración con sistemas de agregación de logs.

#### Formato de Log

```json
{
  "timestamp": "2025-12-15T16:30:45.123Z",
  "level": "INFO",
  "message": "HTTP Request",
  "app": "devops-lab-app",
  "version": "v1.0.0",
  "color": "green",
  "host_ip": "172.17.0.2",
  "client_ip": "192.168.1.100",
  "method": "GET",
  "path": "/",
  "status_code": 200,
  "duration_ms": 5,
  "user_agent": "Mozilla/5.0 ..."
}
```

#### Campos Estándar

Todos los logs incluyen:

| Campo | Descripción | Ejemplo |
|-------|-------------|---------|
| `timestamp` | Timestamp ISO 8601 UTC | `2025-12-15T16:30:45.123Z` |
| `level` | Nivel del log | `INFO`, `WARN`, `ERROR` |
| `message` | Mensaje descriptivo | `HTTP Request` |
| `app` | Nombre de la aplicación | `devops-lab-app` |
| `version` | Versión de la aplicación | `v1.0.0` |
| `color` | Color base configurado | `green` |
| `host_ip` | IP del host/contenedor | `172.17.0.2` |

#### Campos Adicionales (según tipo de log)

**Logs de HTTP Request:**
- `client_ip`: IP del cliente (detecta X-Forwarded-For, X-Real-IP)
- `method`: Método HTTP
- `path`: Ruta solicitada
- `status_code`: Código de respuesta
- `duration_ms`: Duración en milisegundos
- `user_agent`: User agent del cliente
- `temporary_color` (opcional): Color temporal si se usó query param
- `temporary_color_hex` (opcional): Hex del color temporal

**Logs de Inicio:**
- `port`: Puerto de escucha
- `background_color`: Color configurado
- `status`: Estado (`ready`, `shutdown`)

**Logs de Error:**
- `error_message`: Mensaje del error
- `error_stack`: Stack trace
- `endpoint`: Endpoint donde ocurrió

#### Ver y Analizar Logs

```bash
# Ver logs raw
docker logs devops-lab-app

# Ver logs formateados con jq
docker logs devops-lab-app 2>&1 | jq -R 'fromjson? // .'

# Ver solo el mensaje de cada log
docker logs devops-lab-app 2>&1 | jq -r '.message'

# Filtrar por nivel
docker logs devops-lab-app 2>&1 | jq -R 'fromjson? // .' | jq 'select(.level == "ERROR")'
docker logs devops-lab-app 2>&1 | jq -R 'fromjson? // .' | jq 'select(.level == "WARN")'

# Solo requests HTTP
docker logs devops-lab-app 2>&1 | jq -R 'fromjson? // .' | jq 'select(.message == "HTTP Request")'

# Requests que tardaron más de 100ms
docker logs devops-lab-app 2>&1 | jq -R 'fromjson? // .' | jq 'select(.duration_ms > 100)'

# Requests con color temporal
docker logs devops-lab-app 2>&1 | jq -R 'fromjson? // .' | jq 'select(.temporary_color)'

# Ver IPs de clientes únicos
docker logs devops-lab-app 2>&1 | jq -r '.client_ip' | sort -u

# Contar requests por método
docker logs devops-lab-app 2>&1 | jq -r 'select(.method) | .method' | sort | uniq -c

# Calcular latencia promedio
docker logs devops-lab-app 2>&1 | jq -r 'select(.duration_ms) | .duration_ms' | \
  awk '{sum+=$1; n++} END {print "Promedio:", sum/n, "ms"}'
```

#### Integración con Plataformas de Logging

##### Elasticsearch + Kibana (ELK)

```bash
# Filebeat configuration
filebeat.inputs:
  - type: docker
    containers.ids: '*'
    json.keys_under_root: true
    json.add_error_key: true

output.elasticsearch:
  hosts: ["localhost:9200"]
  index: "devops-lab-%{+yyyy.MM.dd}"
```

##### Grafana Loki + Promtail

```yaml
# promtail-config.yml
scrape_configs:
  - job_name: devops-lab-app
    docker_sd_configs:
      - host: unix:///var/run/docker.sock
    relabel_configs:
      - source_labels: ['__meta_docker_container_name']
        regex: 'devops-lab-app'
        action: keep
    pipeline_stages:
      - json:
          expressions:
            level: level
            message: message
            color: color
            client_ip: client_ip
      - labels:
          level:
          color:
```

##### Datadog

```bash
# Docker labels
docker run -d \
  -l com.datadoghq.ad.logs='[{"source":"nodejs","service":"devops-lab-app"}]' \
  devops-lab-app
```

## 🏗️ Arquitectura y Diseño

### Principios de Diseño

1. **Stateless por Diseño**
   - Sin escrituras a disco
   - Sin sesiones en memoria
   - Tolerante a reinicios frecuentes
   - Ideal para escalado horizontal

2. **Configuración Inmutable**
   - Toda la configuración via environment variables
   - Validación en startup
   - Fallbacks seguros para valores inválidos
   - No requiere config files

3. **Observabilidad First**
   - Métricas siguiendo convenciones de Prometheus
   - Logs estructurados en JSON
   - Health checks incluidos
   - Ready para monitoring moderno

4. **Cloud Native**
   - Responde a señales SIGTERM/SIGINT
   - Grace period para conexiones activas
   - Docker-first approach
   - Compatible con Kubernetes

### Stack Tecnológico

- **Runtime**: Node.js LTS (Alpine Linux)
- **Framework Web**: Express.js 4.x
- **Métricas**: prom-client 15.x
- **Containerización**: Docker multi-stage builds
- **Automatización**: Task (Taskfile)

### Seguridad

- ✅ Usuario no-root en contenedor (`USER node`)
- ✅ Imagen base minimal (Alpine Linux)
- ✅ Dependencies pinned en package.json
- ✅ Production-only dependencies en imagen
- ✅ Sin secrets hardcodeados
- ✅ Validación estricta de inputs

## 📚 Casos de Uso

### 1. Demo de Rolling Updates

Simula un rolling update cambiando versión y color:

```bash
# Terminal 1: Versión 1 (verde)
BACKGROUND_COLOR=green APP_VERSION=v1.0.0 task run

# Terminal 2: Versión 2 (azul) en otro puerto
PORT=3001 BACKGROUND_COLOR=blue APP_VERSION=v2.0.0 task run

# Verificar métricas de ambas versiones
curl http://localhost:3000/metrics | grep app_version_info
curl http://localhost:3001/metrics | grep app_version_info
```

### 2. Demo de Canary Deployment

```bash
# 90% del tráfico a versión estable (verde)
docker run -d -p 3000:3000 -e BACKGROUND_COLOR=green devops-lab-app

# 10% del tráfico a versión canary (rojo)
docker run -d -p 3001:3000 -e BACKGROUND_COLOR=red devops-lab-app

# Configurar balanceador (nginx, traefik, etc.) con split 90/10
```

### 3. Demo de Feature Flags Visuales

Usa colores temporales para simular feature flags sin reiniciar:

```bash
# URL normal (feature desactivado)
http://localhost:3000/

# URL con feature flag (cambia UI temporalmente)
http://localhost:3000/?color=blue

# Métricas muestran cuánto se usa cada "feature"
curl http://localhost:3000/metrics | grep http_temporary_color_requests_total
```

### 4. Labs de Observabilidad

```bash
# Generar carga
for i in {1..100}; do curl http://localhost:3000/; done

# Generar latencia
for i in {1..20}; do curl "http://localhost:3000/slow?delay=1000"; done

# Analizar métricas
curl http://localhost:3000/metrics | grep http_request_duration

# Analizar logs
docker logs devops-lab-app 2>&1 | jq -r 'select(.duration_ms > 500)'
```

## 🐛 Troubleshooting

### Puerto ya en uso

```bash
# Error: bind: address already in use
# Solución: Usar otro puerto
docker run --rm -p 8080:3000 -e PORT=3000 devops-lab-app
```

### Contenedor no arranca

```bash
# Ver logs de error
docker logs devops-lab-app

# Verificar que el puerto no está en uso
lsof -i :3000
# o
netstat -tulpn | grep 3000

# Verificar que la imagen existe
docker images | grep devops-lab-app
```

### Color no cambia

```bash
# Verificar variable de entorno
docker inspect devops-lab-app | jq '.[0].Config.Env'

# Verificar logs de startup
docker logs devops-lab-app | head -5

# Si usaste color inválido, buscar warning
docker logs devops-lab-app 2>&1 | jq 'select(.level == "WARN")'
```

### Métricas no aparecen

```bash
# Verificar que /metrics responde
curl http://localhost:3000/metrics

# Verificar que hay peticiones
curl http://localhost:3000/
curl http://localhost:3000/metrics | grep http_requests_total
```

### Logs no son JSON

```bash
# NPM warnings no son JSON, filtrar:
docker logs devops-lab-app 2>&1 | grep '^{' | jq

# O usar jq con manejo de errores:
docker logs devops-lab-app 2>&1 | jq -R 'fromjson? // .'
```

### Limpiar todo y empezar de cero

```bash
# Con Task
task clean

# Con Docker directo
docker stop devops-lab-app
docker rm devops-lab-app
docker rmi devops-lab-app

# Limpiar todo Docker (¡cuidado!)
docker system prune -a
```

## 🔧 Desarrollo

### Modificar la Aplicación

```bash
# 1. Editar app/server.js

# 2. Rebuild imagen
task build

# 3. Ejecutar
task run

# 4. Verificar cambios
curl http://localhost:3000/
```

### Añadir Dependencias

```bash
# 1. Editar app/package.json

# 2. Rebuild (npm install se ejecuta en el build)
task build

# 3. Verificar
docker run --rm devops-lab-app npm list
```

### Debug en Contenedor

```bash
# Ejecutar shell en contenedor corriendo
docker exec -it devops-lab-app sh

# Verificar procesos
docker exec devops-lab-app ps aux

# Verificar variables de entorno
docker exec devops-lab-app env

# Verificar archivos
docker exec devops-lab-app ls -la
```

## 📖 Referencias

- **Express.js**: https://expressjs.com/
- **Prometheus**: https://prometheus.io/
- **prom-client**: https://github.com/siimon/prom-client
- **Docker**: https://docs.docker.com/
- **Task**: https://taskfile.dev/
- **jq**: https://stedolan.github.io/jq/
- **The Twelve-Factor App**: https://12factor.net/
- **Cloud Native**: https://www.cncf.io/

## 📄 Licencia

ISC

---

**Creado para laboratorios DevOps** | Mantener simple, observable y divertido 🚀

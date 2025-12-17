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
devops-lab/
├── app/                  # Código fuente de la aplicación Node.js
├── cd/                   # Configuraciones de despliegue continuo
├── helm/                 # Charts de Helm y dashboards de Grafana
├── manifests/            # Manifiestos de Kubernetes (Tekton, cf-tunnel)
├── taskfiles/            # Taskfiles modulares para automatización
├── Dockerfile            # Imagen de producción
├── Taskfile.yml          # Taskfile principal
└── README.md             # Esta documentación
```

## 🚀 Inicio Rápido

### Requisitos

#### Herramientas Requeridas

- **[Docker](https://www.docker.com/)** - Para construir y ejecutar contenedores
- **[kubectl](https://kubernetes.io/docs/tasks/tools/)** - Cliente de Kubernetes (requerido para CI/CD)
- **[Helm](https://helm.sh/)** - Gestor de paquetes de Kubernetes (requerido para despliegues)
- **[Git](https://git-scm.com/)** - Control de versiones

#### Herramientas Recomendadas

- **[Task](https://taskfile.dev/)** - Automatización de tareas (altamente recomendado)
- **[Minikube](https://minikube.sigs.k8s.io/)** - Cluster de Kubernetes local para desarrollo y pruebas
- **[jq](https://stedolan.github.io/jq/)** - Análisis de logs JSON (opcional)

#### Requisitos de Infraestructura

- **Cluster de Kubernetes** - Configurado y accesible via `kubectl` (puede ser local con Minikube o un cluster remoto)
- **Registro de Docker** - Para almacenar imágenes de contenedor (Docker Hub, GitHub Container Registry, etc.)
- **Acceso a GitHub** - Para webhooks y gestión de repositorios (tokens, SSH keys según configuración)

### Instalación de Herramientas

Para instalar las herramientas requeridas, sigue las instrucciones oficiales de cada proyecto:

- **Docker**: [docs.docker.com/get-docker/](https://docs.docker.com/get-docker/)
- **kubectl**: [kubernetes.io/docs/tasks/tools/](https://kubernetes.io/docs/tasks/tools/)
- **Helm**: [helm.sh/docs/intro/install/](https://helm.sh/docs/intro/install/)
- **Task**: [taskfile.dev/installation/](https://taskfile.dev/installation/)
- **Minikube**: [minikube.sigs.k8s.io/docs/start/](https://minikube.sigs.k8s.io/docs/start/)

> **Nota:** Minikube requiere un hipervisor (Docker, VirtualBox, Hyperkit, etc.). Si usas Docker Desktop, Minikube puede usar Docker como driver.

#### Verificación de Instalación

```bash
# Verificar que todas las herramientas estén instaladas
docker --version
kubectl version --client
helm version
minikube version  # Si usas Minikube
task --version    # Si usas Task
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

### Dashboard de Grafana

El proyecto incluye un dashboard de Grafana pre-configurado ubicado en `helm/grafana/devop-lab-app.json` que proporciona visualización completa de las métricas de la aplicación.

#### Paneles Principales

El dashboard incluye los siguientes paneles:

1. **Request Rate (requests/sec)**: Tasa de peticiones por segundo por ruta y código de estado
2. **Total Requests**: Total de peticiones en la última hora
3. **Error Rate (5xx)**: Tasa de errores 5xx en tiempo real
4. **Response Time Percentiles**: P50, P95, P99 de latencia agregada
5. **Average Response Time**: Tiempo promedio de respuesta por ruta
6. **Requests by Route**: Distribución de peticiones por ruta (bargauge)
7. **Temporary Color Requests**: Peticiones que usaron colores temporales (barchart)
8. **Color Info**: Tabla con información de colores configurados (hex values)
9. **Version & Color History**: Tabla histórica mostrando versiones y colores únicos desplegados

#### Características

- **Variable de namespace**: El dashboard incluye una variable `$namespace` para filtrar por namespace de Kubernetes
- **Exclusión de `/metrics`**: Todas las métricas HTTP excluyen automáticamente el endpoint `/metrics` para evitar que el scraping de Prometheus afecte los gráficos
- **Actualización automática**: El dashboard se actualiza cada 5 segundos
- **Rango de tiempo**: Por defecto muestra los últimos 30 minutos
- **Filtrado de duplicados**: El panel histórico agrupa por versión y color para mostrar valores únicos

#### Instalación

Para importar el dashboard en Grafana:

1. Abre Grafana y ve a **Dashboards** → **Import**
2. Selecciona el archivo `helm/grafana/devop-lab-app.json` o importa el JSON directamente
3. Asegúrate de que el datasource de Prometheus esté configurado con UID `prometheus`
4. Selecciona el namespace deseado desde la variable dropdown en la parte superior del dashboard

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

**Aplicación:**
- **Runtime**: Node.js LTS (Alpine Linux)
- **Framework Web**: Express.js 4.x
- **Métricas**: prom-client 15.x
- **Containerización**: Docker multi-stage builds

**CI/CD:**
- **Pipeline**: Tekton Pipelines
- **Triggers**: Tekton Triggers
- **Automatización**: Task (Taskfile)
- **Versionado**: Commitizen (Conventional Commits)

**Despliegue:**
- **Orquestación**: Kubernetes
- **Gestión de paquetes**: Helm
- **Ingress**: Cloudflare Tunnel

**Observabilidad:**
- **Métricas**: Prometheus
- **Visualización**: Grafana
- **Logs**: Estructurados en JSON

### Seguridad

- ✅ Usuario no-root en contenedor (`USER node`)
- ✅ Imagen base minimal (Alpine Linux)
- ✅ Dependencies pinned en package.json
- ✅ Production-only dependencies en imagen
- ✅ Sin secrets hardcodeados
- ✅ Validación estricta de inputs

## 📚 Casos de Uso

- **Rolling Updates**: Simulación de actualizaciones graduales cambiando versión y color en diferentes instancias
- **Canary Deployments**: Despliegue de versiones canary con distribución de tráfico controlada
- **Feature Flags**: Uso de colores temporales via query parameters para simular feature flags sin reiniciar la aplicación
- **Labs de Observabilidad**: Pruebas y experimentación con métricas, logs y dashboards de Prometheus/Grafana
- **CI/CD**: Pipeline completo con Tekton para construcción, escaneo de seguridad y despliegue automatizado
- **Versionado Semántico**: Automatización de versionado y creación de tags mediante Commitizen

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

**Aplicación:**
- **Express.js**: https://expressjs.com/
- **Prometheus**: https://prometheus.io/
- **prom-client**: https://github.com/siimon/prom-client
- **Docker**: https://docs.docker.com/

**CI/CD y Despliegue:**
- **Tekton**: https://tekton.dev/
- **Kubernetes**: https://kubernetes.io/
- **Helm**: https://helm.sh/
- **Minikube**: https://minikube.sigs.k8s.io/

**Herramientas:**
- **Task**: https://taskfile.dev/
- **Commitizen**: https://commitizen-tools.github.io/commitizen/
- **Grafana**: https://grafana.com/
- **Cloudflare Tunnel**: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/

**Conceptos:**
- **The Twelve-Factor App**: https://12factor.net/
- **Cloud Native Computing Foundation**: https://www.cncf.io/

**Información Útil:**
- **Conventional Commits**: https://www.conventionalcommits.org/
- **Semantic Versioning**: https://semver.org/
- **Commitizen**: https://commitizen-tools.github.io/commitizen/
- **PromQL**: https://prometheus.io/docs/prometheus/latest/querying/basics/
- **Kubernetes Best Practices**: https://kubernetes.io/docs/concepts/configuration/overview/

## 📄 Licencia

ISC

---

**Creado para laboratorios DevOps** | Mantener simple, observable y divertido 🚀

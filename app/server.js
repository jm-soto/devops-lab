const express = require('express');
const client = require('prom-client');
const os = require('os');

// Colores permitidos
const ALLOWED_COLORS = {
  'green': '#00ff00',
  'red': '#ff0000', // #ff0000',
  'blue': '#0000ff',
  'white': '#ffffff',
  'yellow': '#ffff00',
  'verde': '#00ff00',    // alias en español
  'rojo': '#ff0000',     // alias en español
  'azul': '#0000ff',     // alias en español
  'blanco': '#ffffff',   // alias en español
  'amarillo': '#ffff00'  // alias en español
};

// Función para validar y normalizar color
function validateAndNormalizeColor(color) {
  if (!color) {
    return ALLOWED_COLORS['white']; // default
  }
  
  const colorLower = color.toLowerCase();
  
  // Si es un nombre de color permitido
  if (ALLOWED_COLORS[colorLower]) {
    return ALLOWED_COLORS[colorLower];
  }
  
  // Si es un código hex directo permitido
  const allowedHexValues = Object.values(ALLOWED_COLORS);
  if (allowedHexValues.includes(color.toLowerCase())) {
    return color.toLowerCase();
  }
  
  // Color no permitido - usar blanco y loggear warning
  // Usar console.warn directamente aquí porque logger aún no está definido
  const allowedColors = Object.keys(ALLOWED_COLORS).filter(k => !['verde', 'rojo', 'azul', 'blanco', 'amarillo'].includes(k));
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    level: 'WARN',
    message: 'Color no permitido',
    app: 'devops-lab-app',
    host_ip: getHostIP(),
    color_requested: color,
    color_used: 'white',
    allowed_colors: allowedColors
  }));
  return ALLOWED_COLORS['white'];
}

// Función para obtener el nombre del color desde el código hex
function getColorName(hexColor) {
  const colorMap = {
    '#00ff00': 'green',
    '#ff0000': 'red',
    '#0000ff': 'blue',
    '#ffffff': 'white',
    '#ffff00': 'yellow'
  };
  return colorMap[hexColor] || 'unknown';
}

// Función para obtener la IP del host
function getHostIP() {
  const interfaces = os.networkInterfaces();
  
  // Buscar la primera IP IPv4 que no sea localhost
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Skip over internal (i.e. 127.0.0.1) and non-IPv4 addresses
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  
  // Si no encuentra ninguna, devolver hostname
  return os.hostname();
}

// Configuración de variables de entorno con validación
const PORT = process.env.PORT || 3000;
const BACKGROUND_COLOR = validateAndNormalizeColor(process.env.BACKGROUND_COLOR);
const APP_VERSION = process.env.APP_VERSION || 'v1.0.0';
const HOST_IP = getHostIP();
const HOSTNAME = os.hostname();

// Logger estructurado en JSON
function log(level, message, metadata = {}) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level: level.toUpperCase(),
    message: message,
    app: 'devops-lab-app',
    version: APP_VERSION,
    color: getColorName(BACKGROUND_COLOR),
    host_ip: HOST_IP,
    ...metadata
  };
  
  console.log(JSON.stringify(logEntry));
}

// Helpers de logging por nivel
const logger = {
  info: (message, metadata) => log('info', message, metadata),
  warn: (message, metadata) => log('warn', message, metadata),
  error: (message, metadata) => log('error', message, metadata),
  debug: (message, metadata) => log('debug', message, metadata)
};

// Inicializar Express
const app = express();

// Configurar registro de métricas de Prometheus
const register = new client.Registry();

// Añadir métricas por defecto de Node.js
client.collectDefaultMetrics({ register });

// Crear métrica personalizada para la versión de la aplicación
const appVersionGauge = new client.Gauge({
  name: 'app_version_info',
  help: 'Información de la versión de la aplicación',
  labelNames: ['version', 'color'],
  registers: [register]
});

// Establecer el valor de la métrica de versión con color
appVersionGauge.set({ 
  version: APP_VERSION,
  color: getColorName(BACKGROUND_COLOR)
}, 1);

// Crear métrica para el color configurado
const appColorGauge = new client.Gauge({
  name: 'app_color_info',
  help: 'Color de fondo configurado en la aplicación',
  labelNames: ['color', 'hex_value'],
  registers: [register]
});

// Establecer el valor de la métrica de color
appColorGauge.set({
  color: getColorName(BACKGROUND_COLOR),
  hex_value: BACKGROUND_COLOR
}, 1);

// Crear métrica para rastrear códigos de estado HTTP
const httpStatusCounter = new client.Counter({
  name: 'http_requests_total',
  help: 'Total de peticiones HTTP por método, ruta y código de estado',
  labelNames: ['method', 'route', 'status_code', 'color'],
  registers: [register]
});

// Crear métrica de latencia (Histogram)
const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duración de las peticiones HTTP en segundos',
  labelNames: ['method', 'route', 'status_code', 'color'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5], // buckets en segundos
  registers: [register]
});

// Crear métrica para rastrear uso de colores temporales
const temporaryColorCounter = new client.Counter({
  name: 'http_temporary_color_requests_total',
  help: 'Total de peticiones HTTP que usaron color temporal via query param',
  labelNames: ['color_base', 'color_requested', 'route'],
  registers: [register]
});

// Middleware para rastrear métricas y logging (códigos de estado y latencia)
app.use((req, res, next) => {
  // Capturar tiempo de inicio
  const startTime = process.hrtime();
  const startTimeMs = Date.now();
  
  // Interceptar el método end para capturar métricas al finalizar
  const originalEnd = res.end;
  res.end = function(...args) {
    // Calcular duración
    const [seconds, nanoseconds] = process.hrtime(startTime);
    const durationSeconds = seconds + nanoseconds / 1e9;
    const durationMs = Date.now() - startTimeMs;
    
    const route = req.route ? req.route.path : req.path;
    const method = req.method;
    const statusCode = res.statusCode;
    const colorName = getColorName(BACKGROUND_COLOR);
    
    // Incrementar contador de peticiones
    httpStatusCounter.inc({
      method: method,
      route: route,
      status_code: statusCode.toString(),
      color: colorName
    });
    
    // Registrar duración de la petición en métricas
    httpRequestDuration.observe(
      {
        method: method,
        route: route,
        status_code: statusCode.toString(),
        color: colorName
      },
      durationSeconds
    );
    
    // Si hay color temporal, registrar en métrica específica
    if (req.temporaryColor) {
      temporaryColorCounter.inc({
        color_base: colorName,
        color_requested: req.temporaryColor.name,
        route: route
      });
    }
    
    // Obtener IP del cliente (considerando proxies)
    const clientIP = req.headers['x-forwarded-for']?.split(',')[0].trim() 
                     || req.headers['x-real-ip'] 
                     || req.connection.remoteAddress 
                     || req.socket.remoteAddress 
                     || 'unknown';
    
    // Log estructurado de la petición
    const logData = {
      method: method,
      path: req.path,
      status_code: statusCode,
      duration_ms: durationMs,
      client_ip: clientIP,
      user_agent: req.headers['user-agent'] || 'unknown'
    };
    
    // Añadir info de color temporal si existe
    if (req.temporaryColor) {
      logData.temporary_color = req.temporaryColor.name;
      logData.temporary_color_hex = req.temporaryColor.validated;
    }
    
    logger.info('HTTP Request', logData);
    
    // Llamar al método original
    originalEnd.apply(res, args);
  };
  
  next();
});

// Logging de arranque
logger.info('Iniciando aplicación', {
  port: PORT,
  background_color: BACKGROUND_COLOR
});

// Endpoint raíz: página web con color de fondo y versión
app.get('/', (req, res) => {
  // Obtener color del query param (si existe) o usar el configurado por defecto
  let displayColor = BACKGROUND_COLOR;
  let isTemporaryColor = false;
  let temporaryColorName = null;
  
  if (req.query.color) {
    const requestedColor = req.query.color;
    displayColor = validateAndNormalizeColor(requestedColor);
    isTemporaryColor = true;
    temporaryColorName = getColorName(displayColor);
    
    // Guardar info de color temporal en request para que el middleware lo vea
    req.temporaryColor = {
      requested: requestedColor,
      validated: displayColor,
      name: temporaryColorName
    };
    
    // Log del uso de color temporal
    logger.info('Color temporal solicitado', {
      requested_color: requestedColor,
      validated_color: displayColor,
      color_name: temporaryColorName,
      base_color: BACKGROUND_COLOR
    });
  }
  
  const baseColorName = getColorName(BACKGROUND_COLOR);
  
  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DevOps Lab App</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: Arial, sans-serif;
            background-color: ${displayColor};
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            transition: background-color 0.3s ease;
        }
        .container {
            text-align: center;
            padding: 30px;
            background: rgba(255, 255, 255, 0.9);
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        h1 {
            color: #333;
            margin-bottom: 10px;
            font-size: 2em;
        }
        .version {
            font-size: 1.2em;
            color: #666;
            margin: 10px 0;
        }
        .color-info {
            margin-top: 20px;
            padding: 15px;
            background: #f5f5f5;
            border-radius: 5px;
            font-size: 0.9em;
        }
        .color-badge {
            display: inline-block;
            padding: 5px 10px;
            border-radius: 3px;
            font-weight: bold;
            margin: 5px;
        }
        .temp-color {
            background: #ffeb3b;
            color: #333;
        }
        .base-color {
            background: #2196f3;
            color: white;
        }
        .demo-links {
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
        }
        .demo-links a {
            display: inline-block;
            margin: 5px;
            padding: 8px 15px;
            background: #4caf50;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            font-size: 0.9em;
        }
        .demo-links a:hover {
            background: #45a049;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>DevOps Lab Application</h1>
        <p class="version">Versión: ${APP_VERSION}</p>
        <p class="version">Hostname: <code>${HOSTNAME}</code></p>
        <p class="version" style="font-size: 0.9em; color: #888;">IP: ${HOST_IP}</p>
        
        <div class="color-info">
            <p><strong>Color base (métricas):</strong> 
                <span class="color-badge base-color">${baseColorName}</span>
                <code>${BACKGROUND_COLOR}</code>
            </p>
            ${isTemporaryColor ? `
            <p><strong>Color temporal (query param):</strong> 
                <span class="color-badge temp-color">${temporaryColorName}</span>
                <code>${displayColor}</code>
            </p>
            <p style="font-size: 0.85em; color: #666;">
                ℹ️ El color temporal solo afecta a esta vista, no a las métricas
            </p>
            ` : `
            <p style="font-size: 0.85em; color: #666;">
                💡 Prueba añadiendo <code>?color=red</code> a la URL para ver un color temporal
            </p>
            `}
        </div>
        
        <div class="demo-links">
            <strong>Prueba otros colores:</strong><br>
            <a href="/?color=green">Verde</a>
            <a href="/?color=red">Rojo</a>
            <a href="/?color=blue">Azul</a>
            <a href="/?color=white">Blanco</a>
            <a href="/">Color base</a>
        </div>
    </div>
</body>
</html>
  `;
  
  res.setHeader('Content-Type', 'text/html');
  res.status(200).send(html);
});

// Endpoint de métricas para Prometheus
app.get('/metrics', async (req, res) => {
  try {
    res.setHeader('Content-Type', register.contentType);
    const metrics = await register.metrics();
    res.status(200).send(metrics);
  } catch (error) {
    logger.error('Error al generar métricas', {
      error_message: error.message,
      error_stack: error.stack,
      endpoint: '/metrics'
    });
    res.status(500).send('Error al generar métricas');
  }
});

// Endpoint de health check (opcional pero útil)
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    version: APP_VERSION,
    timestamp: new Date().toISOString()
  });
});

// Endpoint para obtener colores permitidos
app.get('/colors', (req, res) => {
  res.status(200).json({
    allowed_colors: ['green', 'red', 'blue', 'white'],
    current_color: BACKGROUND_COLOR,
    hex_values: {
      'green': '#00ff00',
      'red': '#ff0000',
      'blue': '#0000ff',
      'white': '#ffffff'
    },
    aliases: {
      'green': 'verde',
      'red': 'rojo',
      'blue': 'azul',
      'white': 'blanco'
    }
  });
});

// Endpoint de simulación de latencia (útil para pruebas)
app.get('/slow', async (req, res) => {
  const delay = parseInt(req.query.delay) || 1000; // delay en milisegundos
  const maxDelay = 5000; // máximo 5 segundos
  
  const actualDelay = Math.min(delay, maxDelay);
  
  await new Promise(resolve => setTimeout(resolve, actualDelay));
  
  res.status(200).json({
    message: 'Respuesta lenta simulada',
    delay_ms: actualDelay,
    version: APP_VERSION
  });
});

// Manejo de errores
app.use((err, req, res, next) => {
  logger.error('Error no manejado', {
    error_message: err.message,
    error_stack: err.stack,
    path: req.path,
    method: req.method
  });
  res.status(500).json({ error: 'Error interno del servidor' });
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
  logger.info('Servidor iniciado', {
    port: PORT,
    status: 'ready'
  });
});

// Manejo de señales para cierre graceful
process.on('SIGTERM', () => {
  logger.info('Señal SIGTERM recibida', {
    action: 'shutdown'
  });
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('Señal SIGINT recibida', {
    action: 'shutdown'
  });
  process.exit(0);
});


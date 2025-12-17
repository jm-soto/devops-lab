# Usar imagen base ligera de Node.js
FROM node:alpine

# Crear directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias desde el directorio app
COPY app/package.json ./

# Instalar dependencias
RUN npm install --production

# Copiar código de la aplicación desde el directorio app
COPY app/server.js ./

# Exponer puerto (por defecto 3000, configurable por variable de entorno)
EXPOSE 3000

# Usuario no root para mayor seguridad
USER node

# Comando para iniciar la aplicación
CMD ["npm", "start"]
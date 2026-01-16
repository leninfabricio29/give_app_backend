# 🚀 Guía de Deploy - Backend Delivery API

## Opción 1: Deploy en Heroku (Recomendado)

### Requisitos
- Heroku CLI instalado
- Cuenta de Heroku (gratuita en heroku.com)
- Git

### Pasos

1. **Instalar Heroku CLI**
```bash
# Windows
choco install heroku-cli

# macOS
brew tap heroku/brew && brew install heroku
```

2. **Login en Heroku**
```bash
heroku login
```

3. **Crear aplicación**
```bash
cd backend
heroku create tu-app-name
```

4. **Configurar variables de entorno**
```bash
heroku config:set JWT_SECRET=your-production-secret
heroku config:set NODE_ENV=production
```

5. **Crear Procfile**
```bash
# En la carpeta backend/
echo "web: node server.js" > Procfile
```

6. **Agregar MongoDB (Atlas)**
```bash
# Si usas MongoDB Atlas, obtén tu URL connection string
heroku config:set MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/delivery
```

7. **Deploy**
```bash
git push heroku main
```

8. **Ver logs**
```bash
heroku logs --tail
```

---

## Opción 2: Deploy en AWS EC2

### Requisitos
- Cuenta AWS
- Instancia EC2 (Ubuntu 20.04)
- Elastic IP (para IP estática)

### Pasos

1. **Conectar a instancia EC2**
```bash
ssh -i tu-key.pem ubuntu@your-ip-address
```

2. **Instalar dependencias**
```bash
sudo apt-get update
sudo apt-get install -y nodejs npm mongodb
```

3. **Clonar repositorio**
```bash
git clone tu-repositorio
cd backend
```

4. **Instalar dependencias de Node**
```bash
npm install
```

5. **Crear archivo .env**
```bash
nano .env
# Agregar configuración
```

6. **Iniciar con PM2**
```bash
npm install -g pm2
pm2 start server.js --name "delivery-api"
pm2 startup
pm2 save
```

7. **Configurar Nginx**
```bash
sudo apt-get install -y nginx

# Crear config de Nginx
sudo nano /etc/nginx/sites-available/default
```

Agregar:
```nginx
server {
    listen 80 default_server;
    server_name _;
    
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

8. **Reiniciar Nginx**
```bash
sudo systemctl restart nginx
```

---

## Opción 3: Deploy en Railway (Simple)

### Requisitos
- Cuenta Railway (railway.app)
- Repositorio Git

### Pasos

1. **Conectar GitHub a Railway**
   - Ve a railway.app
   - Haz clic en "New Project"
   - Selecciona "Deploy from GitHub"
   - Elige tu repositorio

2. **Configurar variables de entorno**
   - En Railway Dashboard → Settings
   - Agrega:
     ```
     PORT=5000
     MONGODB_URI=mongodb+srv://...
     JWT_SECRET=your-secret
     NODE_ENV=production
     ```

3. **Deploy automático**
   - Railway hace deploy automático al hacer push a main

---

## Opción 4: Deploy en DigitalOcean App Platform

### Pasos

1. **Crear App en DigitalOcean**
   - Apps → Create App
   - Conectar GitHub
   - Seleccionar rama

2. **Configurar build**
   - Build Command: `npm install`
   - Run Command: `npm start`

3. **Agregar MongoDB**
   - Crear Managed Database (MongoDB)
   - Obtener connection string

4. **Configurar variables**
   ```
   MONGODB_URI=<tu-mongodb-url>
   JWT_SECRET=<tu-secret>
   NODE_ENV=production
   ```

---

## Checklist Pre-Deploy

- [ ] `.env` configurado con valores de producción
- [ ] `JWT_SECRET` es una cadena larga y segura
- [ ] `MONGODB_URI` es una conexión a MongoDB (no local)
- [ ] `NODE_ENV=production`
- [ ] `PORT` está configurado
- [ ] No hay secretos en el código
- [ ] `.gitignore` excluye `.env`
- [ ] `package.json` tiene todos los scripts
- [ ] `Procfile` está creado (para Heroku)
- [ ] Certificado SSL configurado

---

## Checklist Post-Deploy

- [ ] API responde en `https://tu-dominio/`
- [ ] Login funciona
- [ ] Registro funciona
- [ ] WebSocket conecta
- [ ] Endpoints autenticados funcionan
- [ ] Base de datos se sincroniza
- [ ] Logs están accesibles

---

## Monitoreo en Producción

### Logs
```bash
# Heroku
heroku logs --tail

# AWS/DigitalOcean
pm2 monit

# PM2
pm2 logs
```

### Alertas
```bash
# PM2 Plus (monitoreo automático)
pm2 install pm2-auto-pull
```

---

## Escalabilidad en Producción

### Load Balancing
```bash
# Para múltiples instancias
pm2 start server.js -i max
```

### Cache con Redis
```bash
# Agregar a package.json
npm install redis

# Usar en services para caché
```

### CDN para Imágenes
```
Usar Cloudinary o AWS S3
```

---

## Seguridad en Producción

### SSL/TLS
- Usar certificado válido (Let's Encrypt gratis)
- Redirigir HTTP a HTTPS

### Rate Limiting
```bash
npm install express-rate-limit
```

### CORS Restringido
```javascript
app.use(cors({
  origin: 'https://tu-frontend.com'
}));
```

### HELMET
```bash
npm install helmet
```

---

## Troubleshooting

### Puerto en uso
```bash
lsof -i :5000
kill -9 <PID>
```

### MongoDB no conecta
- Verifica IP whitelist en MongoDB Atlas
- Verifica connection string
- Verifica credenciales

### WebSocket no conecta
- Verificar CORS
- Verificar firewall
- Verificar proxy configuration (Nginx)

---

## Comandos Útiles

```bash
# Ver estado de la app
pm2 status

# Reiniciar la app
pm2 restart all

# Ver recursos
pm2 monit

# Ver logs en tiempo real
pm2 logs server.js

# Detener aplicación
pm2 stop server.js
```

---

## URLs Típicas Post-Deploy

```
Production: https://api.tu-dominio.com
Staging: https://staging-api.tu-dominio.com
WebSocket: wss://api.tu-dominio.com
```

---

## Backup de Base de Datos

### MongoDB Atlas
```bash
# Export
mongodump --uri "mongodb+srv://user:pass@cluster.mongodb.net/delivery"

# Import
mongorestore --uri "mongodb+srv://user:pass@cluster.mongodb.net/delivery" dump/
```

---

**Versión**: 1.0.0
**Última actualización**: 9 de enero de 2026

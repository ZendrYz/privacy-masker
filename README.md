privacy-masker
Un paquete NPM ligero para enmascarar datos sensibles en logs y APIs, ayudando a cumplir con GDPR y proteger la privacidad.
Instalación
npm install privacy-masker

Uso
const { maskData, maskMiddleware } = require('privacy-masker');

// Enmascarar datos
console.log(maskData({ email: 'user@example.com', phone: '+1234567890' }));
// Salida: { email: 'us***@ex***.com', phone: '+123****7890' }

// Middleware para Express
app.use(maskMiddleware({ mode: 'partial' }));

Opciones

mode: 'partial' (default) o 'total'.
patterns: Objeto para agregar patrones custom (regex).

Contribuciones
Forkea el repo y envía un PR.
Licencia
MIT
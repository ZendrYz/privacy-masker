# Privacy-Masker

Una librería para **enmascarar información sensible** en aplicaciones Node.js y Express. Soporta detección automática de patrones comunes como emails, teléfonos, direcciones IP, tarjetas de crédito, API keys, usuarios y contraseñas. También permite definir patrones personalizados.

---

## 🚀 Instalación

```bash
npm install privacy-masker
```

---

## 📦 Uso básico

```js
const { maskData } = require('privacy-masker');

// Enmascarar un email
console.log(maskData('user@example.com'));
// ➝ "us***@example.com"

// Enmascarar un teléfono
console.log(maskData('+1234567890'));
// ➝ "+123****7890"

// Enmascarar un objeto completo
const input = { email: 'user@example.com', phone: '+1234567890' };
console.log(maskData(input));
// ➝ { email: 'us***@example.com', phone: '+123****7890' }
```

---

## ⚙️ Opciones

La función `maskData` acepta un segundo parámetro con opciones:

```js
maskData(data, {
  mode: 'partial' | 'total',
  patterns: { custom: /regex/ }
});
```

* **mode**:

  * `partial` (por defecto): enmascara parcialmente según el tipo de dato.
  * `total`: reemplaza por `********`.
* **patterns**: permite añadir o sobreescribir patrones. Ejemplo:

```js
const options = { patterns: { custom: /secret/g } };
console.log(maskData('my secret password', options));
// ➝ "my ******** password"
```

---

## 🔍 Patrones soportados por defecto

* **Email** → `user@example.com` → `us***@example.com`
* **Teléfono** → `+1234567890` → `+123****7890`
* **IP (IPv4)** → `192.168.1.45` → `192.168.1.***`
* **Tarjeta de crédito** → `4111 1111 1111 1234` → `4111********1234`
* **API Key** (genérico, 24-64 caracteres) → `ABCD1234efgh5678ijkl9012mnop3456` → `ABCD************************3456`
* **Username** → `@usuario123` → `@********`
* **Password** → `password: mySecret` → `password: ********`
* **Custom (definido por el usuario)**

---

## 🌐 Middleware para Express

Puedes usar la librería como middleware para que toda respuesta JSON sea enmascarada automáticamente:

```js
const express = require('express');
const { maskMiddleware } = require('privacy-masker');

const app = express();

// Aplica enmascarado parcial a todas las respuestas
app.use(maskMiddleware({ mode: 'partial' }));

app.get('/user', (req, res) => {
  res.json({
    email: 'user@example.com',
    phone: '+1234567890',
    password: 'superSecret123'
  });
});

// Respuesta real: { email: "us***@example.com", phone: "+123****7890", password: "********" }
```

---

## 🛡️ Modo Premium

La librería incluye un modo premium con funciones adicionales como **auditoría de logs** y **enmascarado en queries de base de datos**.

```js
const { enablePremium, maskDataPremium, maskDatabaseQuery } = require('privacy-masker');

// Habilitar premium con clave válida
enablePremium('PREMIUM_KEY_123');

// Usar función premium
const masked = maskDataPremium('user@example.com');
// ➝ "us***@example.com" (y genera log de auditoría)

// Enmascarar query de base de datos
const query = { user: 'user@example.com', password: 'superSecret' };
console.log(maskDatabaseQuery(query));
```

---

## 🧪 Tests

La librería viene con un set de tests unitarios (Jest).

Ejecutar tests:

```bash
npm test
```

---

## 📜 Licencia

MIT License © 2025

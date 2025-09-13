const _ = require('lodash');
let isPremium = false;
let premiumKey = null;

// Patrones básicos para detección (se pueden ampliar/ajustar desde options.patterns)
const defaultPatterns = {
    email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/,
    phone: /\+?\d{5,14}/,
    // IPv4: cuatro octetos 0-255 (simplificado, suficiente para detección general)
    ipv4: /\b(?:(?:25[0-5]|2[0-4]\d|1?\d{1,2})\.){3}(?:25[0-5]|2[0-4]\d|1?\d{1,2})\b/,
    // Tarjetas: detecta secuencias de 13-19 dígitos (espacios/guiones permitidos)
    credit_card: /\b(?:\d[ -]*?){13,19}\b/,
    // API keys genéricas: 32-64 caracteres hex/base64-like (ajustable)
    api_key: /\b[A-Za-z0-9_-]{24,64}\b/,
    // Nombres de usuario (por ejemplo @username o username en url) - patrón generico
    username: /@([A-Za-z0-9._-]{3,30})\b/,
    // Contraseñas sentencias tipo "password: xyz" o "pass=xyz" (captura el valor)
    password: /\b(?:password|pass|pwd)\s*[:=]\s*([^\s,;]+)/i,
    // Se mantiene posibilidad de custom pattern vía options.patterns.custom
    // custom: /.../    // (no definido aquí por defecto)
};

// Aplica enmascaramiento en función del tipo (devuelve string enmascarado)
function maskString(str, type, mode = 'partial', opts = {}) {
    if (mode === 'total') return '********';

    switch (type) {
        case 'email': {
            const [username, domain] = str.split('@');
            if (!domain) return str;
            return username.slice(0, 2) + '***@' + domain;
        }
        case 'phone': {
            const hasPlus = str.startsWith('+');
            let digits = str.replace(/[^\d]/g, '');
            if (digits.length <= 5) {
                return (hasPlus ? '+' : '') + digits.slice(0, 2) + '****';
            }
            // conserva prefijo de 3 y sufijo 4
            return (hasPlus ? '+' : '') + digits.slice(0, 3) + '****' + digits.slice(-4);
        }
        case 'ipv4': {
            // Enmascara último octeto
            return str.replace(defaultPatterns.ipv4, (m) => {
                const parts = m.split('.');
                parts[3] = '***';
                return parts.join('.');
            });
        }
        case 'credit_card': {
            // Normaliza: quita espacios/guiones para analizar longitud
            const normalized = str.replace(/[ -]/g, '');
            if (!/^\d{13,19}$/.test(normalized)) return str;
            // Mostrar primeros 4 y últimos 4, resto en asteriscos, respetando grupos en la representación original
            const first = normalized.slice(0, 4);
            const last = normalized.slice(-4);
            const masked = first + '*'.repeat(Math.max(0, normalized.length - 8)) + last;
            // Para mantener formato original (espacios/guiones), sustituimos sólo los dígitos manteniendo separadores
            let i = 0;
            return str.replace(/[0-9]/g, () => masked[i++]);
        }
        case 'api_key': {
            // Mantenemos primeros 4 y últimos 4 visibles si la longitud lo permite
            const len = str.length;
            if (len <= 8) return '********';
            const keepHead = 4;
            const keepTail = 4;
            return str.slice(0, keepHead) + '*'.repeat(len - keepHead - keepTail) + str.slice(len - keepTail);
        }
        default:
            return str;
    }
}

// Aplica reemplazos más precisos para tipos que deben sustituir solo la porción coincidente
function applyPatternReplacement(original, type, pattern, mode = 'partial') {
    if (mode === 'total') return '********';
    switch (type) {
        case 'custom':
            return original.replace(pattern, '********');
        case 'username':
        case 'password':
            // Para estos tipos, reemplazamos la porción coincidente por ********
            // Para 'username' queremos preservar el '@' si existe: pattern debe capturarlo si se requiere
            return original.replace(pattern, (match, p1) => {
                // Si existe grupo capturado (p1), sólo reemplazamos ese grupo
                if (p1 !== undefined) {
                    return match.replace(p1, '********');
                }
                // en otro caso reemplazamos toda la coincidencia
                return '********';
            });
        case 'api_key':
            // Reemplazamos con la versión parcial (usar maskString para mantener lógica)
            return original.replace(pattern, (m) => maskString(m, 'api_key', mode));
        case 'credit_card':
            return original.replace(pattern, (m) => maskString(m, 'credit_card', mode));
        case 'ipv4':
            return original.replace(pattern, (m) => maskString(m, 'ipv4', mode));
        default:
            // Por defecto, si no sabemos, hacemos una sustitución completa de la coincidencia
            return original.replace(pattern, '********');
    }
}

// Función principal para enmascarar datos
function maskData(data, options = { mode: 'partial', patterns: defaultPatterns }) {
    if (data === undefined || data === null) {
        throw new Error('Data is required');
    }
    // fusionamos patrones: options.patterns tiene precedencia
    const patterns = { ...defaultPatterns, ...(options.patterns || {}) };

    if (_.isString(data)) {
        let result = data;

        // Primero chequea patrones custom si están definidos (reemplaza solo la porción que coincida)
        if (options.patterns?.custom && options.patterns.custom.test(data)) {
            return applyPatternReplacement(data, 'custom', options.patterns.custom, options.mode || 'partial');
        }

        // Recorremos los patrones en un orden razonable (email/phone antes que numeric generic)
        const detectionOrder = ['email', 'phone', 'ipv4', 'credit_card', 'api_key', 'username', 'password'];

        for (const type of detectionOrder) {
            const pattern = patterns[type];
            if (!pattern) continue;
            if (pattern.test(result)) {
                // Para algunos tipos queremos aplicar reemplazo parcial en la porción coincidente
                if (['custom', 'username', 'password', 'api_key', 'credit_card', 'ipv4'].includes(type)) {
                    result = applyPatternReplacement(result, type, pattern, options.mode || 'partial');
                } else {
                    // Para email y phone aplicamos maskString completo (para mantener comportamiento original)
                    result = maskString(result, type, options.mode || 'partial', options);
                }
                break; // aplicamos solo el primer patrón que coincida
            }
        }

        return result;
    }

    if (_.isArray(data)) {
        return data.map((item) => maskData(item, options));
    }

    if (_.isPlainObject(data) || _.isObject(data)) {
        // mapValues maneja objetos normales; si viene algo mas complejo, lo dejamos pasar
        return _.mapValues(data, (value) => {
            try {
                return maskData(value, options);
            } catch {
                return value;
            }
        });
    }

    // Otros tipos (números, booleanos) se devuelven tal cual
    return data;
}

// Middleware para Express (sin cambios funcionales)
function maskMiddleware(options = { mode: 'partial', patterns: defaultPatterns }) {
    return (req, res, next) => {
        const originalJson = res.json;
        res.json = function (data) {
            try {
                return originalJson.call(this, maskData(data, options));
            } catch (error) {
                console.error('Error in masking:', error);
                return originalJson.call(this, data);
            }
        };
        next();
    };
}

// Sobrescribir console.log con manejo de errores (manteniendo comportamiento)
const originalLog = console.log;
console.log = (...args) => {
    try {
        const maskedArgs = args.map((arg) => {
            try {
                return maskData(arg);
            } catch {
                return arg;
            }
        });
        originalLog(...maskedArgs);
    } catch (error) {
        originalLog(...args); // Fallback si hay error
    }
};

async function enablePremium(key) {
  try {
    const response = await fetch(
      `https://privacy-masker.vercel.app/api/verify?key=${key}`
    );
    const data = await response.json();

    if (data.valid) {
      isPremium = true;
      premiumKey = key;
      console.log("✅ Premium habilitado con éxito.");
      return { success: true, message: "Premium enabled" };
    } else {
      throw new Error("Invalid premium key");
    }
  } catch (err) {
    throw new Error("❌ Error validando clave premium: " + err.message);
  }
}

function checkPremium() {
  if (!isPremium) {
    throw new Error(
      "Esta función requiere Premium. Dona y recibe tu clave en https://tu-dominio-de-donaciones"
    );
  }
}

function maskDataPremium(data, options = {}) {
  checkPremium();
  const masked = maskData(data, options);
  const auditLog = {
    original: data,
    masked,
    timestamp: new Date().toISOString(),
  };
  console.log("Audit Log:", auditLog);
  return masked;
}

function maskDatabaseQuery(query, options = {}) {
  checkPremium();
  const maskedQuery = maskData(query, options);
  console.log("Masked Database Query:", maskedQuery);
  return maskedQuery;
}

module.exports = {
  maskData,
  maskMiddleware,
  enablePremium,
  maskDataPremium,
  maskDatabaseQuery,
};
// server.js
const express = require("express");
const nodemailer = require("nodemailer");
const crypto = require("crypto");

const app = express();
app.use(express.json());

let keys = []; // aquí guardamos las claves (idealmente usa DB)

// endpoint de webhook (ejemplo con Stripe)
app.post("/webhook", async (req, res) => {
  const { email, amount } = req.body; // vendrá del proveedor de pago
  if (amount >= 1) { // ej. mínimo 1€
    const newKey = crypto.randomBytes(16).toString("hex");
    keys.push(newKey);

    // enviar email con la clave
    let transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.EMAIL, pass: process.env.PASS }
    });

    await transporter.sendMail({
      from: "contacto@zendryz.com",
      to: email,
      subject: "Tu clave Premium de Privacy Masker",
      text: `Gracias por tu donación ❤️\nAquí tienes tu clave premium: ${newKey}`
    });

    return res.json({ success: true });
  }
  res.status(400).json({ error: "donación insuficiente" });
});

// endpoint de verificación
app.get("/verify", (req, res) => {
  const { key } = req.query;
  if (keys.includes(key)) {
    return res.json({ valid: true });
  }
  res.json({ valid: false });
});

app.listen(3000, () => console.log("Servidor de licencias corriendo 🚀"));

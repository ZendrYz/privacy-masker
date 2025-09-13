// api/webhook.js
import Stripe from "stripe";
import sgMail from "@sendgrid/mail";
import crypto from "crypto";
import { MongoClient } from "mongodb";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const client = new MongoClient(process.env.MONGODB_URI);
let db;

async function connectDB() {
  if (!db) {
    await client.connect();
    db = client.db("privacyMasker");
  }
  return db;
}

export const config = {
  api: {
    bodyParser: false, // Stripe necesita el raw body
  },
};

function buffer(readable) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    readable.on("data", (chunk) => chunks.push(chunk));
    readable.on("end", () => resolve(Buffer.concat(chunks)));
    readable.on("error", reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  const buf = await buffer(req);
  const sig = req.headers["stripe-signature"];

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      buf,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("⚠️ Error validando webhook:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const email = session.customer_details.email;
    const newKey = crypto.randomBytes(16).toString("hex");

    try {
      const db = await connectDB();
      await db.collection("keys").insertOne({ key: newKey, email });

      // Enviar clave por correo
      await sgMail.send({
        to: email,
        from: "tucorreo@tudominio.com", // validado en SendGrid
        subject: "Tu clave Premium de MaskDataJS",
        text: `🎉 Gracias por tu donación!\n\nAquí tienes tu clave Premium:\n${newKey}\n\nÚsala en tu proyecto:\n\nenablePremium("${newKey}")`,
      });

      console.log("✅ Clave enviada y guardada para:", email);
    } catch (err) {
      console.error("❌ Error procesando clave:", err);
    }
  }

  res.status(200).json({ received: true });
}
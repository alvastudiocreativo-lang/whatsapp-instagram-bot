import express from "express";
import bodyParser from "body-parser";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(bodyParser.json());

const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const META_TOKEN = process.env.META_TOKEN;

// 📌 WEBHOOK - VERIFICACIÓN (Meta lo usa solo 1 vez)
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }

  return res.sendStatus(403);
});

// 📌 WEBHOOK - RECEPCIÓN DE MENSAJES
app.post("/webhook", async (req, res) => {
  try {
    const data = req.body;

    if (data.object === "whatsapp_business_account") {
      const message = data.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

      if (message?.text) {
        await sendReply(message.from, message.text.body);
      }
    }

    res.sendStatus(200);
  } catch (error) {
    console.log("Error webhook:", error);
    res.sendStatus(500);
  }
});

// 📌 FUNCIÓN PARA RESPONDER
async function sendReply(to, text) {
  try {
    await axios({
      method: "POST",
      url: `https://graph.facebook.com/v20.0/${process.env.PHONE_NUMBER_ID}/messages`,
      headers: {
        Authorization: `Bearer ${META_TOKEN}`,
        "Content-Type": "application/json"
      },
      data: {
        messaging_product: "whatsapp",
        to,
        text: { body: `🤖 Bot: ${text}` }
      }
    });
  } catch (err) {
    console.log("ERROR enviando mensaje:", err.response?.data || err);
  }
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("BOT RUNNING ON PORT", PORT));

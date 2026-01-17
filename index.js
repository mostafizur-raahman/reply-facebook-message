require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");

const app = express();
app.use(bodyParser.json());


const PORT = 3000; 
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

// Webhook verification
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("Webhook verified!");
    return res.status(200).send(challenge);
  }

  return res.sendStatus(403);
});

app.post("/webhook", async (req, res) => {
  try {
    const entry = req.body.entry?.[0];
    const messaging = entry?.messaging?.[0];

    if (!messaging) return res.sendStatus(200);

    const senderId = messaging.sender.id;
    const messageText = messaging.message?.text || "Hello 👋";

    console.log("User ID:", senderId);
    console.log("Message:", messageText);

    await sendMessage(senderId, `You said: ${messageText}`);

    res.sendStatus(200);
  } catch (err) {
    console.error("Webhook Error:", err.message);
    res.sendStatus(500);
  }
});

// Send message function
async function sendMessage(psid, text) {
  try {
    await axios.post(
      "https://graph.facebook.com/v23.0/me/messages",
      {
        recipient: { id: psid },
        messaging_type: "RESPONSE",
        message: { text }
      },
      {
        params: { access_token: PAGE_ACCESS_TOKEN },
        headers: { "Content-Type": "application/json" }
      }
    );

    console.log("Message sent successfully!");
  } catch (err) {
    console.error("Send API Error:", err.response?.data || err.message);
  }
}

app.listen(PORT, () => {
  console.log(`Messenger bot running on port ${PORT}`);
});

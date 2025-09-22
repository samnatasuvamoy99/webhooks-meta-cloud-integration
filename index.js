const express = require("express");
const body_parser = require("body-parser");
const { default: axios } = require("axios");
const app = express().use(body_parser.json());
require('dotenv').config();

const token =process.env.TOKEN;
// to verify the callback url from the dashboard side - cloud api side 

app.get("/webhooks", (req, res) => {
  console.log("Webhook verification request:", req.query); // debug

  const mode = req.query["hub.mode"];
  const verify_token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode && verify_token) {
    if (mode === "subscribe" && verify_token === process.env.MYTOKEN) {
      console.log("Webhook verified successfully");
      return res.status(200).send(challenge); // must send exactly hub.challenge
    } else {
      console.log("❌ Verification failed");
      return res.status(403).send("Verification failed!");
    }
  }

  return res.status(400).send("Missing parameters!");
});


//  user send the msg 
app.post("/webhooks",async (req, res) => {
  const body_param = req.body;

  console.log("Incoming webhook:", JSON.stringify(body_param, null, 2));

  if (body_param.object) {
    const entry = body_param.entry && body_param.entry[0];
    const changes = entry && entry.changes && entry.changes[0];
    const messageData = changes?.value?.messages?.[0];

    if (messageData) {
      const phone_number_id = changes.value.metadata.phone_number_id;
      const from = messageData.from;
      const msg_body = messageData.text?.body || "";

      console.log(`✅ Message from ${from}: "${msg_body}"`);

      try {
       const result= await axios({
          method: "POST",
          url: `https://graph.facebook.com/v22.0/${phone_number_id}/messages`,
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
           },
        
          data: {
            messaging_product: "whatsapp",
            to: from,
            text: { body: "Hi 👋 I'm Suvamoy, nice to meet you!" }
          },
          
        });


        console.log(" Message sent successfully ", result.data);
        return res.sendStatus(200); // respond OK to WhatsApp
      } catch (err) {
        console.error(" Error sending message:", err.response?.data || err.message);
        return res.sendStatus(500); // internal server error
      }
    }
  }

  // if body_param.object or messages not found
  res.sendStatus(404);
});

       


//server

app.listen(3000, '0.0.0.0', () => console.log('Server running on 3000'));



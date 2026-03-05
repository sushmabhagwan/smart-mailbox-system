const express = require("express");
const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const app = express();
mongoose.connect(process.env.MONGO_URI)
.then(() => {
  console.log("MongoDB connected");
})
.catch((err) => {
  console.error("MongoDB error:", err);
});
const eventSchema = new mongoose.Schema({
  status: String,
  time: String
});

const Event = mongoose.model("Event", eventSchema);
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*"
  }
});


app.use(cors());
app.use(express.json());

let mailboxStatus = "closed";
let lastEventTime = null;
let eventHistory = [];
app.get("/", (req, res) => {
  res.send("Smart Mailbox Server Running");
});

app.post("/mailbox-event", async (req, res) => {

  const { status } = req.body;

  mailboxStatus = status;
  lastEventTime = new Date().toLocaleString();

  console.log("Mailbox Event:", status);

  const event = {
    status: status,
    time: lastEventTime
  };

  eventHistory.unshift(event);
const newEvent = new Event(event);
await newEvent.save();
  if(status === "opened"){
      sendEmailAlert();
  }

  io.emit("mailbox-update", {
      mailbox: mailboxStatus,
      lastEvent: lastEventTime,
      history: eventHistory
  });

  res.json({
    message: "Mailbox event received",
    status: mailboxStatus
  });

});

app.get("/status", (req, res) => {
  res.json({
    mailbox: mailboxStatus
  });
});
app.get("/history", async (req, res) => {

  const events = await Event.find().sort({_id:-1}).limit(20);

  res.json({
    events: events
  });

});
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log("Server running on port", PORT);
});

async function sendEmailAlert() {

  const time = new Date().toLocaleString();

  try {

    await resend.emails.send({
      from: "onboarding@resend.dev",
      to: "sushmabhagwan01@gmail.com",
      subject: "Mailbox Alert",
      text: `📬 Mailbox opened!

Time: ${time}

This alert was sent from your Smart Mailbox System.`
    });

    console.log("Email sent successfully");

  } catch (error) {
    console.log("Email error:", error);
  }

}
app.get("/test-email", async (req, res) => {

  try {

    const response = await resend.emails.send({
      from: "onboarding@resend.dev",
      to: "sushmabhagwan01@gmail.com",
      subject: "Test Email",
      text: "Resend is working!"
    });

    res.json(response);

  } catch (error) {
    res.json(error);
  }

});
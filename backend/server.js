const express = require("express");
const nodemailer = require("nodemailer");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const app = express();
mongoose.connect("mongodb://127.0.0.1:27017/mailboxDB")
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
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "sushmavecham@gmail.com",
    pass: "vlwt koky mazu airm"
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
server.listen(3000, () => {
  console.log("Server running on port 3000");
});

function sendEmailAlert() {

  const time = new Date().toLocaleString();

  const mailOptions = {
    from: "sushmavecham@gmail.com",
    to: "sushmabhagwan01@gmail.com",
    subject: "Mailbox Alert",
    text: `📬 Mailbox opened!

Time: ${time}

This alert was sent from your Smart Mailbox System.`
  };

  transporter.sendMail(mailOptions, (error, info) => {

    if (error) {
      console.log("Email error:", error);
    } else {
      console.log("Email sent:", info.response);
    }

  });

}
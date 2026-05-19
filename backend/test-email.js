import nodemailer from "nodemailer";
import dns from "dns";
import "dotenv/config";

// Force IPv4 first
dns.setDefaultResultOrder("ipv4first");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  family: 4,

  connectionTimeout: 20000,
  greetingTimeout: 20000,
  socketTimeout: 20000,

  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

transporter.verify((error, success) => {
  if (error) {
    console.error("❌ Email auth failed:");
    console.error(error);
  } else {
    console.log("✅ Email transporter ready!");
  }
});
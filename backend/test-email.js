import nodemailer from "nodemailer";
import "dotenv/config";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

console.log(`Testing ${process.env.SMTP_HOST}...`);

const timeout = setTimeout(() => {
  console.error("❌ Timeout after 10 seconds");
  process.exit(1);
}, 10000);

transporter.verify((error, success) => {
  clearTimeout(timeout);
  if (error) {
    console.error("❌ Email transporter failed:");
    console.error(error.message);
    process.exit(1);
  } else {
    console.log("✅ Email transporter ready!");
    console.log(`Host: ${process.env.SMTP_HOST}`);
    console.log(`User: ${process.env.SMTP_USER}`);
    process.exit(0);
  }
});
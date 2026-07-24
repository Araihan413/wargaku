import { sendEmail } from "../lib/mail";
import * as dotenv from "dotenv";
import path from "path";

// Load .env
dotenv.config({ path: path.resolve(__dirname, "../.env") });

async function run() {
  console.log("Mulai mengirim email uji...");
  console.log("BREVO_SENDER_EMAIL:", process.env.BREVO_SENDER_EMAIL);
  console.log("BREVO_API_KEY exists:", !!process.env.BREVO_API_KEY);
  try {
    const result = await sendEmail({
      to: { email: "arraihan0104@gmail.com" }, // kirim ke email pengirim untuk tes
      subject: "Test Email Wargaku",
      htmlContent: "<h1>Halo, ini email uji coba Brevo API!</h1>",
    });
    console.log("Hasil pengiriman:", result);
  } catch (error) {
    console.error("Terjadi kesalahan detail:", error);
  }
}

run();

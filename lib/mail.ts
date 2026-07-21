export interface EmailRecipient {
  email: string;
  name?: string;
}

export interface SendEmailPayload {
  to: EmailRecipient | EmailRecipient[];
  subject: string;
  htmlContent: string;
  senderName?: string;
}

/**
 * Mengirim email menggunakan Brevo SMTP/Email REST API.
 * @param payload Objek berisi penerima, subjek, konten HTML, dan opsional nama pengirim.
 */
export async function sendEmail({
  to,
  subject,
  htmlContent,
  senderName = "Wargaku",
}: SendEmailPayload) {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL;

  if (!apiKey || !senderEmail) {
    console.warn(
      "Brevo API Key (BREVO_API_KEY) atau Sender Email (BREVO_SENDER_EMAIL) belum dikonfigurasi di file .env. Pengiriman email dilewati."
    );
    return null;
  }

  // Normalisasi penerima tunggal menjadi array
  const recipients = Array.isArray(to) ? to : [to];

  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "accept": "application/json",
        "api-key": apiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sender: {
          name: senderName,
          email: senderEmail,
        },
        to: recipients.map((r) => ({
          email: r.email,
          name: r.name || r.email.split("@")[0],
        })),
        subject,
        htmlContent,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Gagal mengirim email melalui Brevo");
    }

    return result;
  } catch (error) {
    console.error("Gagal mengirim email:", error);
    throw error;
  }
}

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

/**
 * Mengirim email notifikasi reset password oleh Admin.
 * Template didesain ringkas, hemat tempat, dan responsif di aplikasi email smartphone/desktop.
 */
export async function sendPasswordResetEmail({
  toEmail,
  userName,
  temporaryPassword,
  loginUrl,
}: {
  toEmail: string;
  userName: string;
  temporaryPassword: string;
  loginUrl: string;
}) {
  const subject = "[Wargaku] Password Akun Anda Telah Di-Reset oleh Admin";
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 12px; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 480px; margin: 12px auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
    <!-- Header Ringkas -->
    <tr>
      <td style="padding: 20px 24px; background-color: #0f172a; text-align: center;">
        <h1 style="margin: 0; font-size: 18px; font-weight: 800; color: #ffffff; tracking-tight: -0.02em;">PORTAL WARGAKU</h1>
        <p style="margin: 2px 0 0; font-size: 11px; color: #94a3b8;">Sistem Informasi & Layanan RT</p>
      </td>
    </tr>

    <!-- Body Utama -->
    <tr>
      <td style="padding: 24px 20px; text-align: center;">
        <h2 style="margin: 0 0 12px; font-size: 16px; font-weight: 700; color: #0f172a;">Password Akun Di-Reset</h2>
        <p style="margin: 0 0 16px; font-size: 13px; color: #475569; line-height: 1.5;">
          Halo <strong>${userName}</strong>,<br>
          Password akun Anda (<code>${toEmail}</code>) telah di-reset oleh <strong>Admin Sistem</strong>. Gunakan password sementara berikut untuk login:
        </p>

        <!-- Box Password Monospace Mudah Disalin -->
        <div style="margin: 16px 0; padding: 14px; background-color: #f1f5f9; border: 1.5px dashed #0284c7; border-radius: 12px; text-align: center;">
          <code style="font-family: 'Courier New', Courier, monospace; font-size: 18px; font-weight: 700; color: #0369a1; letter-spacing: 2px; -webkit-user-select: all; user-select: all; word-break: break-all;">${temporaryPassword}</code>
        </div>
        <p style="margin: 0 0 20px; font-size: 11px; color: #64748b;">💡 <em>Tip: Tekan lama / double-tap pada password di atas untuk menyalin.</em></p>

        <!-- Tombol Akses Login -->
        <a href="${loginUrl}" style="display: inline-block; width: 85%; max-width: 260px; padding: 12px 18px; background-color: #0284c7; color: #ffffff; font-size: 13px; font-weight: 700; text-decoration: none; border-radius: 10px; box-shadow: 0 2px 4px rgba(2, 132, 199, 0.25);">
          Login ke Portal Wargaku &rarr;
        </a>
      </td>
    </tr>

    <!-- Footer Ringkas -->
    <tr>
      <td style="padding: 14px 20px; background-color: #f8fafc; border-top: 1px solid #f1f5f9; text-align: center; font-size: 11px; color: #94a3b8;">
        Email ini dikirim otomatis oleh Admin Sistem Wargaku.<br>
        Demi keamanan, segera ubah password Anda setelah berhasil login.
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  return sendEmail({
    to: { email: toEmail, name: userName },
    subject,
    htmlContent,
    senderName: "Admin Wargaku",
  });
}


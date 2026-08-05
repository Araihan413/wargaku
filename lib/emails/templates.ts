interface BaseEmailOptions {
  title: string;
  subtitle: string;
  theme: 'success' | 'info' | 'danger';
  contentHtml: string;
}

export function getBaseEmailLayout({ subtitle, theme, contentHtml }: BaseEmailOptions): string {
  let headerGradient = 'linear-gradient(135deg, #10b981 0%, #059669 100%)'; // success (green)
  let subtitleColor = '#e6f4ea';

  if (theme === 'info') {
    headerGradient = 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)'; // info (blue)
    subtitleColor = '#dbeafe';
  } else if (theme === 'danger') {
    headerGradient = 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)'; // danger (red)
    subtitleColor = '#fee2e2';
  }

  const currentYear = new Date().getFullYear();

  return `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <title>Wargaku</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased; -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f8fafc; width: 100%; margin: 0; padding: 0;">
        <tr>
          <td align="center" style="padding: 12px 0;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; width: 100%; background-color: #ffffff; margin: 0 auto;">
              <!-- Header Banner -->
              <tr>
                <td style="background: ${headerGradient}; padding: 24px 24px; text-align: left;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px; line-height: 1.2;">WARGAKU</h1>
                  <p style="color: ${subtitleColor}; margin: 4px 0 0 0; font-size: 13px; font-weight: 500;">${subtitle}</p>
                </td>
              </tr>
              
              <!-- Body Content -->
              <tr>
                <td style="padding: 28px 24px; color: #1e293b; font-size: 15px; line-height: 1.6;">
                  ${contentHtml}
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background-color: #f8fafc; padding: 20px 24px; text-align: center; border-top: 1px solid #e2e8f0;">
                  <p style="font-size: 12px; color: #64748b; margin: 0; line-height: 1.5;">
                    Pesan ini dikirim secara otomatis oleh sistem Wargaku. Mohon untuk tidak membalas email ini secara langsung.
                  </p>
                  <p style="font-size: 11px; color: #94a3b8; margin: 8px 0 0 0;">
                    &copy; ${currentYear} Wargaku. All rights reserved.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

export function getWargaRegistrationEmail(name: string, loginLink: string): string {
  const content = `
    <h2 style="font-size: 22px; font-weight: 800; color: #0f172a; margin-top: 0; margin-bottom: 16px; letter-spacing: -0.4px;">Registrasi Akun Diterima!</h2>
    <p style="font-size: 15px; line-height: 1.6; color: #334155; margin-bottom: 20px;">
      Halo <strong>${name}</strong>, terima kasih telah melakukan pendaftaran mandiri di aplikasi <strong>Wargaku</strong>.
    </p>
    
    <div style="background-color: #eff6ff; border-left: 4px solid #2563eb; border-radius: 8px; padding: 16px 20px; margin-bottom: 24px; color: #1e40af;">
      <p style="margin: 0; font-size: 14px; line-height: 1.5;">
        Akun Anda saat ini berstatus <strong>Pending</strong>. Pengurus RT sedang melakukan verifikasi data kependudukan Anda. Anda akan menerima email pemberitahuan setelah akun Anda disetujui.
      </p>
    </div>
    
    <p style="font-size: 15px; line-height: 1.6; color: #334155; margin-bottom: 28px;">
      Setelah akun Anda diaktifkan oleh Ketua RT, Anda dapat masuk ke aplikasi melalui tautan berikut:
    </p>
    
    <div style="text-align: center; margin-bottom: 28px;">
      <a href="${loginLink}" style="background-color: #2563eb; color: #ffffff; padding: 13px 32px; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 14px; display: inline-block; box-shadow: 0 4px 10px rgba(37, 99, 235, 0.25);">
        Halaman Login Wargaku
      </a>
    </div>
    
    <p style="font-size: 15px; line-height: 1.6; color: #334155; margin-top: 24px; margin-bottom: 0;">
      Salam hangat,<br/>
      <strong>Pengurus RT - Wargaku</strong>
    </p>
  `;

  return getBaseEmailLayout({
    title: "WARGAKU",
    subtitle: "Sistem Informasi & Manajemen RT",
    theme: "info",
    contentHtml: content,
  });
}

export function getWargaApprovalEmail(name: string, loginLink: string): string {
  const content = `
    <h2 style="font-size: 22px; font-weight: 800; color: #0f172a; margin-top: 0; margin-bottom: 16px; letter-spacing: -0.4px;">Akun Wargaku Telah Aktif!</h2>
    <p style="font-size: 15px; line-height: 1.6; color: #334155; margin-bottom: 20px;">
      Halo <strong>${name}</strong>, pendaftaran akun mandiri Anda di aplikasi <strong>Wargaku</strong> telah disetujui dan diaktifkan oleh pengurus RT.
    </p>
    
    <p style="font-size: 15px; line-height: 1.6; color: #334155; margin-bottom: 28px;">
      Anda sekarang sudah dapat masuk dan menggunakan seluruh fitur Wargaku menggunakan email dan password yang Anda daftarkan sebelumnya:
    </p>
    
    <div style="text-align: center; margin-bottom: 28px;">
      <a href="${loginLink}" style="background-color: #10b981; color: #ffffff; padding: 13px 32px; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 14px; display: inline-block; box-shadow: 0 4px 10px rgba(16, 185, 129, 0.25);">
        Masuk ke Aplikasi
      </a>
    </div>
    
    <p style="font-size: 15px; line-height: 1.6; color: #334155; margin-top: 24px; margin-bottom: 0;">
      Salam hangat,<br/>
      <strong>Pengurus RT - Wargaku</strong>
    </p>
  `;

  return getBaseEmailLayout({
    title: "WARGAKU",
    subtitle: "Sistem Informasi & Manajemen RT",
    theme: "success",
    contentHtml: content,
  });
}

export function getCoordActivationEmail(name: string, activationLink: string): string {
  const content = `
    <h2 style="font-size: 22px; font-weight: 800; color: #0f172a; margin-top: 0; margin-bottom: 16px; letter-spacing: -0.4px;">Akun Koordinator Aktif!</h2>
    <p style="font-size: 15px; line-height: 1.6; color: #334155; margin-bottom: 20px;">
      Halo <strong>${name}</strong>, penunjukan Anda sebagai <strong>Koordinator (Pengelola) Properti Sewa</strong> telah disetujui oleh pengurus RT.
    </p>
    
    <p style="font-size: 15px; line-height: 1.6; color: #334155; margin-bottom: 28px;">
      Silakan klik tombol di bawah ini untuk melengkapi proses aktivasi dengan membuat kata sandi baru untuk akun Anda:
    </p>
    
    <div style="text-align: center; margin-bottom: 28px;">
      <a href="${activationLink}" style="background-color: #10b981; color: #ffffff; padding: 13px 32px; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 14px; display: inline-block; box-shadow: 0 4px 10px rgba(16, 185, 129, 0.25);">
        Aktivasi Akun & Buat Password
      </a>
    </div>
    
    <div style="background-color: #f8fafc; border-radius: 10px; padding: 14px 18px; border: 1px solid #e2e8f0; margin-bottom: 24px;">
      <p style="font-size: 12px; color: #64748b; margin: 0; word-break: break-all; line-height: 1.5;">
        <strong>Tautan alternatif:</strong><br/>
        <a href="${activationLink}" style="color: #10b981; text-decoration: underline;">${activationLink}</a>
      </p>
    </div>
    
    <p style="font-size: 15px; line-height: 1.6; color: #334155; margin-top: 24px; margin-bottom: 0;">
      Salam hangat,<br/>
      <strong>Pengurus RT - Wargaku</strong>
    </p>
  `;

  return getBaseEmailLayout({
    title: "WARGAKU",
    subtitle: "Sistem Informasi & Manajemen RT",
    theme: "success",
    contentHtml: content,
  });
}

export function getRegistrationRejectionEmail(name: string, rejectReason: string): string {
  const content = `
    <h2 style="font-size: 22px; font-weight: 800; color: #0f172a; margin-top: 0; margin-bottom: 16px; letter-spacing: -0.4px;">Pendaftaran Ditolak</h2>
    <p style="font-size: 15px; line-height: 1.6; color: #334155; margin-bottom: 20px;">
      Halo <strong>${name}</strong>, pendaftaran akun mandiri Anda di aplikasi <strong>Wargaku</strong> telah ditolak oleh pengurus RT.
    </p>
    
    <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; border-radius: 8px; padding: 18px 20px; margin-bottom: 24px;">
      <strong style="display: block; font-size: 12px; text-transform: uppercase; color: #991b1b; margin-bottom: 6px; letter-spacing: 0.5px;">Alasan Penolakan dari RT:</strong>
      <p style="font-size: 14px; line-height: 1.5; color: #7f1d1d; margin: 0; font-style: italic;">
        "${rejectReason || "Data pendaftaran tidak sesuai atau tidak valid."}"
      </p>
    </div>
    
    <p style="font-size: 15px; line-height: 1.6; color: #334155; margin-bottom: 0;">
      Silakan lakukan pendaftaran ulang dengan memasukkan data yang benar langsung melalui aplikasi Wargaku. NIK dan email Anda telah dibebaskan agar bisa digunakan kembali.
    </p>
    
    <p style="font-size: 15px; line-height: 1.6; color: #334155; margin-top: 28px; margin-bottom: 0;">
      Salam hangat,<br/>
      <strong>Pengurus RT - Wargaku</strong>
    </p>
  `;

  return getBaseEmailLayout({
    title: "WARGAKU",
    subtitle: "Sistem Informasi & Manajemen RT",
    theme: "danger",
    contentHtml: content,
  });
}

export function getTenantFamilyWelcomeEmail(name: string, email: string, password: string, loginLink: string): string {
  const content = `
    <h2 style="font-size: 22px; font-weight: 800; color: #0f172a; margin-top: 0; margin-bottom: 16px; letter-spacing: -0.4px;">Akun Keluarga Penyewa Baru Berhasil Dibuat!</h2>
    <p style="font-size: 15px; line-height: 1.6; color: #334155; margin-bottom: 20px;">
      Halo <strong>${name}</strong>, Anda telah didaftarkan sebagai Kepala Keluarga penyewa sewaan oleh Koordinator Properti di sistem Wargaku.
    </p>
    
    <p style="font-size: 15px; line-height: 1.6; color: #334155; margin-bottom: 16px;">
      Silakan gunakan kredensial berikut untuk masuk pertama kali:
    </p>

    <div style="background-color: #f8fafc; border-radius: 10px; padding: 18px 20px; border: 1px solid #e2e8f0; margin-bottom: 24px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="font-size: 14px; color: #334155;">
        <tr>
          <td style="padding: 6px 0; font-weight: 700; width: 90px; color: #475569;">Email:</td>
          <td style="padding: 6px 0; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; color: #0f172a; font-weight: 600;">${email}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-weight: 700; color: #475569;">Password:</td>
          <td style="padding: 6px 0; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; color: #0f172a; font-weight: 600;">${password}</td>
        </tr>
      </table>
    </div>
    
    <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; border-radius: 8px; padding: 14px 18px; margin-bottom: 28px;">
      <p style="font-size: 13px; color: #991b1b; font-weight: 600; margin: 0; line-height: 1.5;">
        *PENTING: Setelah masuk, Anda wajib mengunggah berkas scan KK dan melengkapi data anggota keluarga Anda agar dapat diverifikasi oleh pengurus RT.
      </p>
    </div>

    <div style="text-align: center; margin-bottom: 28px;">
      <a href="${loginLink}" style="background-color: #2563eb; color: #ffffff; padding: 13px 32px; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 14px; display: inline-block; box-shadow: 0 4px 10px rgba(37, 99, 235, 0.25);">
        Masuk ke Wargaku
      </a>
    </div>
    
    <p style="font-size: 15px; line-height: 1.6; color: #334155; margin-top: 24px; margin-bottom: 0;">
      Salam hangat,<br/>
      <strong>Pengurus RT - Wargaku</strong>
    </p>
  `;

  return getBaseEmailLayout({
    title: "WARGAKU",
    subtitle: "Sistem Informasi & Manajemen RT",
    theme: "info",
    contentHtml: content,
  });
}

export function getResetPasswordEmail(name: string, resetLink: string): string {
  const content = `
    <h2 style="font-size: 22px; font-weight: 800; color: #0f172a; margin-top: 0; margin-bottom: 16px; letter-spacing: -0.4px;">Permintaan Reset Kata Sandi</h2>
    <p style="font-size: 15px; line-height: 1.6; color: #334155; margin-bottom: 20px;">
      Halo <strong>${name}</strong>, kami menerima permintaan untuk mereset kata sandi akun <strong>Wargaku</strong> Anda.
    </p>
    
    <p style="font-size: 15px; line-height: 1.6; color: #334155; margin-bottom: 28px;">
      Silakan klik tombol di bawah ini untuk membuat kata sandi baru. Tautan ini berlaku selama 1 jam:
    </p>
    
    <div style="text-align: center; margin-bottom: 28px;">
      <a href="${resetLink}" style="background-color: #2563eb; color: #ffffff; padding: 13px 32px; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 14px; display: inline-block; box-shadow: 0 4px 10px rgba(37, 99, 235, 0.25);">
        Reset Kata Sandi
      </a>
    </div>

    <div style="background-color: #f8fafc; border-radius: 10px; padding: 14px 18px; border: 1px solid #e2e8f0; margin-bottom: 24px;">
      <p style="font-size: 12px; color: #64748b; margin: 0; word-break: break-all; line-height: 1.5;">
        <strong>Tautan alternatif:</strong><br/>
        <a href="${resetLink}" style="color: #2563eb; text-decoration: underline;">${resetLink}</a>
      </p>
    </div>
    
    <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; border-radius: 8px; padding: 14px 18px; margin-bottom: 24px; color: #991b1b;">
      <p style="margin: 0; font-size: 13px; line-height: 1.5;">
        Jika Anda tidak merasa melakukan permintaan ini, abaikan email ini. Kata sandi Anda tidak akan berubah.
      </p>
    </div>

    <p style="font-size: 15px; line-height: 1.6; color: #334155; margin-top: 24px; margin-bottom: 0;">
      Salam hangat,<br/>
      <strong>Pengurus RT - Wargaku</strong>
    </p>
  `;

  return getBaseEmailLayout({
    title: "WARGAKU",
    subtitle: "Sistem Informasi & Manajemen RT",
    theme: "info",
    contentHtml: content,
  });
}

export function getAdminCreatedUserCredentialsEmail(
  name: string,
  email: string,
  password: string,
  loginLink: string
): string {
  const content = `
    <h2 style="font-size: 22px; font-weight: 800; color: #0f172a; margin-top: 0; margin-bottom: 16px; letter-spacing: -0.4px;">Akun Wargaku Anda Telah Dibuat!</h2>
    <p style="font-size: 15px; line-height: 1.6; color: #334155; margin-bottom: 20px;">
      Halo <strong>${name}</strong>, akun pengguna Anda di aplikasi <strong>Wargaku</strong> telah didaftarkan secara resmi oleh Pengurus RT.
    </p>
    
    <div style="background-color: #f1f5f9; border-radius: 12px; padding: 20px; border: 1px solid #e2e8f0; margin-bottom: 24px;">
      <p style="margin: 0 0 10px 0; font-size: 13px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Kredensial Login Anda:</p>
      <p style="margin: 0 0 6px 0; font-size: 14px; color: #334155;"><strong>Email:</strong> <span style="font-family: monospace; color: #0f172a;">${email}</span></p>
      <p style="margin: 0; font-size: 14px; color: #334155;"><strong>Password Awal:</strong> <span style="font-family: monospace; color: #2563eb; font-weight: 700;">${password}</span></p>
    </div>
    
    <p style="font-size: 15px; line-height: 1.6; color: #334155; margin-bottom: 24px;">
      Anda dapat langsung masuk ke aplikasi melalui tombol di bawah ini. Demi keamanan akun Anda, disarankan untuk <strong>mengubah kata sandi awal ini di Halaman Profil</strong> setelah login.
    </p>

    <div style="text-align: center; margin-bottom: 28px;">
      <a href="${loginLink}" style="background-color: #10b981; color: #ffffff; padding: 13px 32px; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 14px; display: inline-block; box-shadow: 0 4px 10px rgba(16, 185, 129, 0.25);">
        Masuk ke Wargaku
      </a>
    </div>
    
    <p style="font-size: 15px; line-height: 1.6; color: #334155; margin-top: 24px; margin-bottom: 0;">
      Salam hangat,<br/>
      <strong>Pengurus RT - Wargaku</strong>
    </p>
  `;

  return getBaseEmailLayout({
    title: "WARGAKU",
    subtitle: "Sistem Informasi & Manajemen RT",
    theme: "success",
    contentHtml: content,
  });
}


interface BaseEmailOptions {
  title: string;
  subtitle: string;
  theme: 'success' | 'info' | 'danger';
  contentHtml: string;
}

export function getBaseEmailLayout({ subtitle, theme, contentHtml }: BaseEmailOptions): string {
  let headerGradient = 'linear-gradient(135deg, #10b981 0%, #059669 100%)'; // success (green)
  let subtitleColor = '#a7f3d0';

  if (theme === 'info') {
    headerGradient = 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'; // info (blue)
    subtitleColor = '#bfdbfe';
  } else if (theme === 'danger') {
    headerGradient = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'; // danger (red)
    subtitleColor = '#fca5a5';
  }

  const currentYear = new Date().getFullYear();

  return `
    <div style="background-color: #f3f4f6; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); border: 1px solid #e5e7eb;">
        <!-- Header Banner -->
        <div style="background: ${headerGradient}; padding: 32px 40px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">WARGAKU</h1>
          <p style="color: ${subtitleColor}; margin: 4px 0 0 0; font-size: 13px; font-weight: 500;">${subtitle}</p>
        </div>
        
        <!-- Body Content -->
        <div style="padding: 40px; color: #1f2937;">
          ${contentHtml}
        </div>
        
        <!-- Footer -->
        <div style="background-color: #f9fafb; padding: 24px 40px; text-align: center; border-top: 1px solid #f3f4f6;">
          <p style="font-size: 12px; color: #9ca3af; margin: 0; line-height: 1.5;">
            Pesan ini dikirim secara otomatis oleh sistem Wargaku. Mohon untuk tidak membalas email ini secara langsung.
          </p>
          <p style="font-size: 11px; color: #d1d5db; margin: 8px 0 0 0;">
            &copy; ${currentYear} Wargaku. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  `;
}

export function getWargaRegistrationEmail(name: string, loginLink: string): string {
  const content = `
    <h2 style="font-size: 20px; font-weight: 700; color: #111827; margin-top: 0; margin-bottom: 16px;">Registrasi Akun Diterima!</h2>
    <p style="font-size: 15px; line-height: 1.6; color: #4b5563; margin-bottom: 24px;">
      Halo <strong>${name}</strong>, terima kasih telah melakukan pendaftaran mandiri di aplikasi <strong>Wargaku</strong>.
    </p>
    
    <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 8px; padding: 16px; margin-bottom: 24px; color: #1e3a8a;">
      <p style="margin: 0; font-size: 14px; line-height: 1.5;">
        Akun Anda saat ini berstatus <strong>Pending</strong>. Pengurus RT sedang melakukan verifikasi data kependudukan Anda. Anda akan menerima email pemberitahuan setelah akun Anda disetujui.
      </p>
    </div>
    
    <p style="font-size: 15px; line-height: 1.6; color: #4b5563; margin-bottom: 32px;">
      Setelah akun Anda diaktifkan oleh Ketua RT, Anda dapat masuk ke aplikasi melalui tautan berikut:
    </p>
    
    <div style="text-align: center; margin-bottom: 32px;">
      <a href="${loginLink}" style="background-color: #3b82f6; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 15px; display: inline-block; box-shadow: 0 4px 10px rgba(59, 130, 246, 0.2);">
        Halaman Login Wargaku
      </a>
    </div>
    
    <p style="font-size: 15px; line-height: 1.6; color: #4b5563; margin-top: 24px; margin-bottom: 0;">
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
    <h2 style="font-size: 20px; font-weight: 700; color: #111827; margin-top: 0; margin-bottom: 16px;">Akun Wargaku Telah Aktif!</h2>
    <p style="font-size: 15px; line-height: 1.6; color: #4b5563; margin-bottom: 24px;">
      Halo <strong>${name}</strong>, pendaftaran akun mandiri Anda di aplikasi <strong>Wargaku</strong> telah disetujui dan diaktifkan oleh pengurus RT.
    </p>
    
    <p style="font-size: 15px; line-height: 1.6; color: #4b5563; margin-bottom: 32px;">
      Anda sekarang sudah dapat masuk dan menggunakan seluruh fitur Wargaku menggunakan email dan password yang Anda daftarkan sebelumnya:
    </p>
    
    <div style="text-align: center; margin-bottom: 32px;">
      <a href="${loginLink}" style="background-color: #10b981; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 15px; display: inline-block; box-shadow: 0 4px 10px rgba(16, 185, 129, 0.2);">
        Masuk ke Aplikasi
      </a>
    </div>
    
    <p style="font-size: 15px; line-height: 1.6; color: #4b5563; margin-top: 24px; margin-bottom: 0;">
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
    <h2 style="font-size: 20px; font-weight: 700; color: #111827; margin-top: 0; margin-bottom: 16px;">Akun Koordinator Aktif!</h2>
    <p style="font-size: 15px; line-height: 1.6; color: #4b5563; margin-bottom: 24px;">
      Halo <strong>${name}</strong>, penunjukan Anda sebagai <strong>Koordinator (Pengelola) Properti Sewa</strong> telah disetujui oleh pengurus RT.
    </p>
    
    <p style="font-size: 15px; line-height: 1.6; color: #4b5563; margin-bottom: 32px;">
      Silakan klik tombol di bawah ini untuk melengkapi proses aktivasi dengan membuat kata sandi baru untuk akun Anda:
    </p>
    
    <div style="text-align: center; margin-bottom: 32px;">
      <a href="${activationLink}" style="background-color: #10b981; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 15px; display: inline-block; box-shadow: 0 4px 10px rgba(16, 185, 129, 0.2);">
        Aktivasi Akun & Buat Password
      </a>
    </div>
    
    <div style="background-color: #f9fafb; border-radius: 12px; padding: 16px; border: 1px solid #f3f4f6; margin-bottom: 24px;">
      <p style="font-size: 12px; color: #6b7280; margin: 0; word-break: break-all; line-height: 1.5;">
        <strong>Tautan alternatif:</strong><br/>
        <a href="${activationLink}" style="color: #10b981; text-decoration: underline;">${activationLink}</a>
      </p>
    </div>
    
    <p style="font-size: 15px; line-height: 1.6; color: #4b5563; margin-top: 24px; margin-bottom: 0;">
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
    <h2 style="font-size: 20px; font-weight: 700; color: #111827; margin-top: 0; margin-bottom: 16px;">Pendaftaran Ditolak</h2>
    <p style="font-size: 15px; line-height: 1.6; color: #4b5563; margin-bottom: 24px;">
      Halo <strong>${name}</strong>, pendaftaran akun mandiri Anda di aplikasi <strong>Wargaku</strong> telah ditolak oleh pengurus RT.
    </p>
    
    <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
      <strong style="display: block; font-size: 13px; text-transform: uppercase; color: #991b1b; margin-bottom: 8px;">Alasan Penolakan dari RT:</strong>
      <p style="font-size: 15px; line-height: 1.5; color: #7f1d1d; margin: 0; font-style: italic;">
        "${rejectReason || "Data pendaftaran tidak sesuai atau tidak valid."}"
      </p>
    </div>
    
    <p style="font-size: 15px; line-height: 1.6; color: #4b5563; margin-bottom: 0;">
      Silakan lakukan pendaftaran ulang dengan memasukkan data yang benar langsung melalui aplikasi Wargaku. NIK dan email Anda telah dibebaskan agar bisa digunakan kembali.
    </p>
    
    <p style="font-size: 15px; line-height: 1.6; color: #4b5563; margin-top: 32px; margin-bottom: 0;">
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

export function getCoordWelcomeWithPasswordEmail(name: string, email: string, password: string, loginLink: string): string {
  const content = `
    <h2 style="font-size: 20px; font-weight: 700; color: #111827; margin-top: 0; margin-bottom: 16px;">Akun Koordinator Baru Berhasil Dibuat!</h2>
    <p style="font-size: 15px; line-height: 1.6; color: #4b5563; margin-bottom: 20px;">
      Halo <strong>${name}</strong>, Anda telah didaftarkan secara manual oleh pengurus RT sebagai <strong>Koordinator (Pengelola) Properti Sewa</strong> di sistem Wargaku.
    </p>
    
    <p style="font-size: 15px; line-height: 1.6; color: #4b5563; margin-bottom: 20px;">
      Berikut adalah kredensial akun Anda untuk login pertama kali:
    </p>

  <div style="background-color: #f9fafb; border-radius: 12px; padding: 20px; border: 1px solid #e5e7eb; margin-bottom: 28px;">
    <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #4b5563;">
      <tr>
        <td style="padding: 6px 0; font-weight: 700; width: 100px;">Email:</td>
        <td style="padding: 6px 0; font-family: monospace; color: #111827;">${email}</td>
      </tr>
      <tr>
        <td style="padding: 6px 0; font-weight: 700;">Password:</td>
        <td style="padding: 6px 0; font-family: monospace; color: #111827;">${password}</td>
      </tr>
    </table>
  </div>

    <div style="text-align: center; margin-bottom: 32px;">
      <a href="${loginLink}" style="background-color: #10b981; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 15px; display: inline-block; box-shadow: 0 4px 10px rgba(16, 185, 129, 0.2);">
        Login ke Wargaku
      </a>
    </div>

    <p style="font-size: 15px; line-height: 1.6; color: #4b5563; margin-top: 24px; margin-bottom: 0;">
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

export function getTenantFamilyWelcomeEmail(name: string, email: string, password: string, loginLink: string): string {
  const content = `
    <h2 style="font-size: 20px; font-weight: 700; color: #111827; margin-top: 0; margin-bottom: 16px;">Akun Keluarga Penyewa Baru Berhasil Dibuat!</h2>
    <p style="font-size: 15px; line-height: 1.6; color: #4b5563; margin-bottom: 20px;">
      Halo <strong>${name}</strong>, Anda telah didaftarkan sebagai Kepala Keluarga penyewa sewaan oleh Koordinator Properti di sistem Wargaku.
    </p>
    
    <p style="font-size: 15px; line-height: 1.6; color: #4b5563; margin-bottom: 20px;">
      Silakan gunakan kredensial berikut untuk masuk pertama kali:
    </p>

    <div style="background-color: #f9fafb; border-radius: 12px; padding: 20px; border: 1px solid #e5e7eb; margin-bottom: 28px;">
      <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #4b5563;">
        <tr>
          <td style="padding: 6px 0; font-weight: 700; width: 100px;">Email:</td>
          <td style="padding: 6px 0; font-family: monospace; color: #111827;">${email}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-weight: 700;">Password:</td>
          <td style="padding: 6px 0; font-family: monospace; color: #111827;">${password}</td>
        </tr>
      </table>
    </div>
    
    <p style="font-size: 14px; color: #ef4444; font-weight: 600; margin-bottom: 28px;">
      *PENTING: Setelah masuk, Anda wajib mengunggah berkas scan KK dan melengkapi data anggota keluarga Anda agar dapat diverifikasi oleh pengurus RT.
    </p>

    <div style="text-align: center; margin-bottom: 32px;">
      <a href="${loginLink}" style="background-color: #3b82f6; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 15px; display: inline-block; box-shadow: 0 4px 10px rgba(59, 130, 246, 0.2);">
        Masuk ke Wargaku
      </a>
    </div>
    
    <p style="font-size: 15px; line-height: 1.6; color: #4b5563; margin-top: 24px; margin-bottom: 0;">
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

// End of templates

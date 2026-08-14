interface TurnstileVerifyResponse {
  success: boolean;
  'error-codes'?: string[];
  challenge_ts?: string;
  hostname?: string;
}

/**
 * Memvalidasi token Cloudflare Turnstile ke API Cloudflare Siteverify.
 * 
 * @param token - Token Turnstile yang dikirimkan oleh browser client
 * @param remoteIp - (Opsional) IP address klien untuk keamanan tambahan
 */
export async function verifyTurnstileToken(
  token?: string | null,
  remoteIp?: string | null
): Promise<{ success: boolean; error?: string }> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;

  // Jika secret key belum disetel pada masa development, izinkan bypass dengan peringatan
  if (!secretKey) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        '[Turnstile Warning] TURNSTILE_SECRET_KEY belum disetel di .env. Verifikasi bot dilewati khusus lingkungan Development.'
      );
      return { success: true };
    }
    return {
      success: false,
      error: 'Konfigurasi verifikasi keamanan server belum lengkap (TURNSTILE_SECRET_KEY missing).',
    };
  }

  if (!token) {
    return {
      success: false,
      error: 'Verifikasi keamanan (CAPTCHA/Turnstile) wajib diselesaikan.',
    };
  }

  try {
    const formData = new URLSearchParams();
    formData.append('secret', secretKey);
    formData.append('response', token);
    if (remoteIp && remoteIp !== '127.0.0.1') {
      formData.append('remoteip', remoteIp);
    }

    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    if (!response.ok) {
      console.error(`[Turnstile Error] HTTP response status: ${response.status}`);
      return {
        success: false,
        error: 'Gagal terhubung ke layanan verifikasi keamanan Cloudflare.',
      };
    }

    const data: TurnstileVerifyResponse = await response.json();

    if (!data.success) {
      console.warn('[Turnstile Verification Failed] Error codes:', data['error-codes']);
      return {
        success: false,
        error: 'Verifikasi keamanan bot gagal atau token telah kadaluarsa. Silakan muat ulang dan coba lagi.',
      };
    }

    return { success: true };
  } catch (err: unknown) {
    console.error('[Turnstile Network Error]', err);
    return {
      success: false,
      error: 'Terjadi kesalahan sistem saat memverifikasi keamanan CAPTCHA.',
    };
  }
}

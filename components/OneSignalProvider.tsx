"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    OneSignalDeferred?: any[];
    OneSignal?: any;
  }
}

export function OneSignalProvider() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    let isMounted = true;

    async function initOneSignal() {
      try {
        const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
        if (!appId) {
          // Lewati inisialisasi jika OneSignal App ID tidak diatur di .env
          return;
        }

        const res = await fetch("/api/user/notification-preference");
        if (!res.ok) return;

        const data = await res.json();
        const pushEnabled = data.pushNotificationsEnabled ?? true;

        window.OneSignalDeferred = window.OneSignalDeferred || [];
        window.OneSignalDeferred.push(async function (OneSignal: any) {
          if (!isMounted) return;

          // Guard: cegah inisialisasi ganda
          if (!OneSignal.initialized) {
            try {
              await OneSignal.init({
                appId,
                allowLocalhostAsSecureOrigin: process.env.NODE_ENV === "development",
              });
            } catch (err: any) {
              if (!err?.message?.includes("already initialized")) {
                console.error("OneSignal.init error:", err);
              }
            }
          }

          if (pushEnabled) {
            // Re-opt in if previously opted out
            if (OneSignal.User?.PushSubscription?.optIn) {
              await OneSignal.User.PushSubscription.optIn();
            }
          } else {
            // Opt out of push notifications on this device
            if (OneSignal.User?.PushSubscription?.optOut) {
              await OneSignal.User.PushSubscription.optOut();
            }
          }
        });
      } catch (err) {
        console.error("OneSignalProvider error:", err);
      }
    }

    initOneSignal();

    return () => {
      isMounted = false;
    };
  }, []);

  return null;
}

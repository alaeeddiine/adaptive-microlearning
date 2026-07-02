import { useEffect, useRef } from "react";
import useAuth from "./useAuth";

export default function useAutoSession() {
    const { currentUser } = useAuth();
    const sessionStartRef = useRef(Date.now());
    const savedContextRef = useRef(false);
    const durationSentRef = useRef(false);

    useEffect(() => {
        if (!currentUser) return;

        sessionStartRef.current = Date.now();
        durationSentRef.current = false;
        savedContextRef.current = false;

        const collectAndSave = async () => {
            // ---- Device ----
            const userAgent = navigator.userAgent;
            const width = window.innerWidth;
            let device_type = "Desktop";
            if (/Mobi|Android|iPhone|iPad|iPod/i.test(userAgent) || width < 1024) {
                device_type = width < 768 ? "Mobile" : "Tablette";
            }

            // ---- Connection ----
            let connection_level = "Inconnu";
            if (navigator.connection?.effectiveType) {
                const type = navigator.connection.effectiveType.toLowerCase();
                switch (type) {
                    case "slow-2g": case "2g": connection_level = "Faible"; break;
                    case "3g": connection_level = "Moyenne"; break;
                    case "4g": case "5g": connection_level = "Élevé"; break;
                    case "wifi": case "ethernet": connection_level = "WiFi / Ethernet"; break;
                    default: connection_level = type;
                }
            } else if (navigator.onLine === false) {
                connection_level = "Hors ligne";
            }

            // ---- Time of day ----
            const hour = new Date().getHours();
            let time_of_day = "Matin";
            if (hour >= 12 && hour < 17) time_of_day = "Après-midi";
            else if (hour >= 17 && hour < 21) time_of_day = "Soir";
            else if (hour >= 21 || hour < 5) time_of_day = "Nuit";

            // ---- Battery (wait for result) ----
            let battery_level = "Non disponible";
            let battery_percent = null;
            try {
                if (navigator.getBattery) {
                    const battery = await navigator.getBattery();
                    const level = battery.level * 100;
                    battery_percent = Math.round(level);
                    if (level < 25) battery_level = "Faible";
                    else if (level < 70) battery_level = "Moyenne";
                    else battery_level = "Élevé";
                }
            } catch (err) {
                console.error("Battery API error:", err);
            }

            // ---- Save ONCE ----
            if (savedContextRef.current) return;
            savedContextRef.current = true;
            fetch("http://localhost:5000/api/session/auto", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    firebase_uid: currentUser.uid,
                    device_type,
                    connection_level,
                    time_of_day,
                    battery_level,
                    battery_percent,
                }),
            }).catch(console.error);
        };

        const sendDuration = () => {
            if (durationSentRef.current) return;
            const duration = Math.round((Date.now() - sessionStartRef.current) / 1000);
            if (duration < 1) return;
            durationSentRef.current = true;
            fetch("http://localhost:5000/api/session/duration", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    firebase_uid: currentUser.uid,
                    duration,
                }),
                keepalive: true,
            }).catch(() => {
                durationSentRef.current = false;
            });
        };

        collectAndSave();

        const handlePageHide = () => sendDuration();
        const handleBeforeUnload = () => sendDuration();
        const handleVisibilityChange = () => {
            if (document.visibilityState === "hidden") sendDuration();
        };

        window.addEventListener("pagehide", handlePageHide);
        window.addEventListener("beforeunload", handleBeforeUnload);
        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => {
            sendDuration();
            window.removeEventListener("pagehide", handlePageHide);
            window.removeEventListener("beforeunload", handleBeforeUnload);
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, [currentUser]);
}

import { useEffect, useRef, useState } from "react";
import "../styles/SettingsModal.css";

export default function SettingsModal({ open, onClose, username, role }) {
    const dialogRef = useRef(null);
    const [tab, setTab] = useState("general"); // general | appearance | language

    const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
    const [lang, setLang] = useState(localStorage.getItem("lang") || "en");

    // Apply settings
    useEffect(() => {
        document.body.classList.toggle("dark", theme === "dark");
        localStorage.setItem("theme", theme);
    }, [theme]);

    useEffect(() => {
        localStorage.setItem("lang", lang);
    }, [lang]);

    // Close on Esc
    useEffect(() => {
        if (!open) return;
        const onKeyDown = (e) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [open, onClose]);

    // Lock background scroll
    useEffect(() => {
        if (!open) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = prev;
        };
    }, [open]);

    // Click outside to close
    const onBackdropMouseDown = (e) => {
        if (dialogRef.current && !dialogRef.current.contains(e.target)) {
            onClose();
        }
    };

    if (!open) return null;

    return (
        <div className="smBackdrop" onMouseDown={onBackdropMouseDown} role="presentation">
            <div
                className="smDialog"
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-label="Settings"
            >
                <div className="smHeader">
                    <div>
                        <div className="smTitle">Settings</div>
                        <div className="smSubtitle">Personalize your PhysioFlow experience</div>
                    </div>

                    <button className="smCloseBtn" onClick={onClose} aria-label="Close settings">
                        ✕
                    </button>
                </div>

                <div className="smBody">
                    <div className="smTabs" role="tablist" aria-label="Settings tabs">
                        <button
                            className={`smTab ${tab === "general" ? "isActive" : ""}`}
                            onClick={() => setTab("general")}
                            role="tab"
                            aria-selected={tab === "general"}
                        >
                            👤 Account
                        </button>
                        <button
                            className={`smTab ${tab === "appearance" ? "isActive" : ""}`}
                            onClick={() => setTab("appearance")}
                            role="tab"
                            aria-selected={tab === "appearance"}
                        >
                            🎨 Appearance
                        </button>
                        <button
                            className={`smTab ${tab === "language" ? "isActive" : ""}`}
                            onClick={() => setTab("language")}
                            role="tab"
                            aria-selected={tab === "language"}
                        >
                            🌍 Language
                        </button>
                    </div>

                    <div className="smPanel" role="tabpanel">
                        {tab === "general" && (
                            <div className="smSection">
                                <div className="smRow">
                                    <div className="smLabel">Signed in as</div>
                                    <div className="smValue">{username}</div>
                                </div>
                                <div className="smRow">
                                    <div className="smLabel">Role</div>
                                    <div className="smValue">
                                        <span className="smPill">{role}</span>
                                    </div>
                                </div>

                                <div className="smHint">
                                    Your login is stored in a secure session cookie. You’ll stay signed in after refresh.
                                </div>
                            </div>
                        )}

                        {tab === "appearance" && (
                            <div className="smSection">
                                <div className="smRow">
                                    <div className="smLabel">Theme</div>
                                    <div className="smValue">
                                        <select
                                            className="smSelect"
                                            value={theme}
                                            onChange={(e) => setTheme(e.target.value)}
                                        >
                                            <option value="light">Light</option>
                                            <option value="dark">Dark</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="smHint">
                                    Tip: Dark mode looks great for long sessions.
                                </div>
                            </div>
                        )}

                        {tab === "language" && (
                            <div className="smSection">
                                <div className="smRow">
                                    <div className="smLabel">Language</div>
                                    <div className="smValue">
                                        <select
                                            className="smSelect"
                                            value={lang}
                                            onChange={(e) => setLang(e.target.value)}
                                        >
                                            <option value="en">English</option>
                                            <option value="de">Deutsch</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="smHint">
                                    This stores your preference locally. Later you can connect it to i18n.
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="smFooter">
                    <button className="smSecondaryBtn" onClick={onClose}>
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

import { useEffect, useMemo, useRef, useState } from "react";
import logo from "../assets/logo1.png";
import "../styles/Header.css";
import SettingsModal from "../components/SettingsModal";


function formatName(name) {
  if (!name) return "";
  return name.charAt(0).toUpperCase() + name.slice(1);
}

function useOutsideClick(isOpen, onClose) {
  const ref = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const onPointerDown = (e) => {
      const el = ref.current;
      if (!el) return;
      if (!el.contains(e.target)) onClose();
    };
    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, [isOpen, onClose]);

  return ref;
}

function TopTab({ active, onClick, children }) {
  return (
      <button type="button" className={`pfpTab ${active ? "isActive" : ""}`} onClick={onClick}>
        {children}
      </button>
  );
}

function IconBtn({ title, children, onClick }) {
  return (
      <button type="button" className="pfpIconBtn" title={title} onClick={onClick}>
        {children}
      </button>
  );
}

export default function Header({ role, tab, setTab, isPhysio, username, onLogout }) {
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useOutsideClick(profileOpen, () => setProfileOpen(false));
  const [showSettings, setShowSettings] = useState(false);

  const topTabs = useMemo(() => {
    return [
      { id: "dashboard", label: "Dashboard" },
      { id: "patients", label: "Patients" },
      { id: "workflows", label: "Workflows" },
      { id: "analytics", label: "Analytics" },
      { id: "library", label: "Library" },
    ];
  }, []);

  return (
      <header className="pfpHeader">
        <div className="pfpTopRow">
          <div className="pfpBrand">
            <div className="pfpBrandLogo">
              <img src={logo} alt="PhysioFlow" className="pfpLogoImage" />
            </div>
          </div>

          <nav className="pfpTopNav" aria-label="Primary">
            {topTabs.map((t) => (
                <TopTab key={t.id} active={tab === t.id} onClick={() => setTab(t.id)}>
                  {t.label}
                </TopTab>
            ))}
          </nav>

          <div className="pfpRight">
            {/* ✅ One profile button: 👤 Anna ▾ */}
            <div className="pfpProfile" ref={profileRef}>
              <button
                  type="button"
                  className="pfpProfileBtn"
                  onClick={() => setProfileOpen((v) => !v)}
                  aria-haspopup="menu"
                  aria-expanded={profileOpen}
                  title="Account"
                  style={{display: "flex", alignItems: "center", gap: "8px"}}
              >
                <span className="pfpAvatar">👤</span>
                <span style={{fontSize: 13, fontWeight: 600}}>{formatName(username)}</span>
                <span className="pfpCaret">▾</span>
              </button>

              {profileOpen && (
                  <div className="pfpMenu" role="menu">

                    <button
                        className="pfpMenuItem"
                        role="menuitem"
                        onClick={() => {
                          setProfileOpen(false);
                          setShowSettings(true);
                        }}
                        style={{display: "flex", alignItems: "center", gap: "10px"}}
                    >
                      <span style={{fontSize: 16}}>⚙️</span>
                      <span>Settings</span>
                    </button>

                    <div className="pfpMenuHr"/>

                    <button
                        className="pfpMenuItem"
                        role="menuitem"
                        onClick={() => {
                          setShowSettings(false);
                          setProfileOpen(false);
                          onLogout();
                        }}
                        style={{display: "flex", alignItems: "center", gap: "10px"}}
                    >
  <span style={{display: "flex", alignItems: "center"}}>
    <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
      <path d="M9 3H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h5"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  </span>
                      <span>Logout</span>
                    </button>

                  </div>
              )}


            </div>
          </div>
        </div>

        <div className="pfpToolsRow">
          <div className="pfpToolsLeft">
            <button className="pfpToolBtn">🎨 Color Palette</button>
            <button className="pfpToolBtn pfpToolBtnPrimary">⬛ Shapes</button>
          </div>


        </div>

        <SettingsModal
            open={showSettings}
            onClose={() => setShowSettings(false)}
            username={username}
            role={role}
        />

      </header>
  );
}

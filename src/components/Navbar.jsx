import { Menu, Settings, User, X } from "lucide-react";
import { useState } from "react";
import icon from "../assets/icon.png";
import CurrentTime from "./CurrentTime";

function Navbar({
  userId,
  onLogout,
  fontColor,
  backgroundColor,
  onSettingsClick,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const userName = localStorage.getItem("userName") || "User";

  const copyIdToClipboard = () => {
    navigator.clipboard.writeText(userId);
    alert(
      "User ID copied to clipboard! Share this ID to sync with other devices."
    );
  };

  return (
    <nav
      style={{
        backgroundColor: backgroundColor,
        color: fontColor,
        borderBottom: `1px solid ${fontColor}`,
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        padding: "0.05rem 1rem",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          maxWidth: "1200px",
          margin: "0 auto",
          gap: "0.5rem",
        }}
      >
        {/* Logo and Title */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <img src={icon} alt="Study Timer" style={{ height: "2.5rem" }} />
          <h1 style={{ fontSize: "1.2rem", fontWeight: "bold" }}>
            Study Timer
          </h1>
        </div>

        {/* Desktop Menu */}
        <div
          className="desktop-menu"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "2rem",
            flex: 1,
            justifyContent: "flex-end",
          }}
        >
          <CurrentTime fontColor={fontColor} isInNavbar={true} />
          <div style={{ display: "flex", gap: "1rem" }}>
            <button
              onClick={onSettingsClick}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: fontColor,
                display: "flex",
                alignItems: "center",
                padding: "0.5rem",
              }}
            >
              <Settings size={20} />
            </button>
            <div className="profile-dropdown" style={{ position: "relative" }}>
              <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: fontColor,
                  display: "flex",
                  alignItems: "center",
                  padding: "0.5rem",
                }}
              >
                <User size={20} />
              </button>
              {isOpen && (
                <div
                  style={{
                    position: "absolute",
                    top: "100%",
                    right: 0,
                    backgroundColor: backgroundColor,
                    border: `1px solid ${fontColor}`,
                    borderRadius: "0.5rem",
                    padding: "0.5rem",
                    minWidth: "200px",
                    marginTop: "0.5rem",
                  }}
                >
                  <div
                    style={{
                      padding: "0.5rem",
                      borderBottom: `1px solid ${fontColor}`,
                    }}
                  >
                    <div style={{ marginBottom: "8px" }}>{userName}</div>
                    <div>
                      ID: {userId.slice(0, 8)}...
                      <button
                        onClick={copyIdToClipboard}
                        style={{
                          background: "transparent",
                          border: `1px solid ${fontColor}`,
                          color: fontColor,
                          padding: "0.25rem 0.5rem",
                          cursor: "pointer",
                          borderRadius: "0.25rem",
                          fontSize: "0.75rem",
                          marginLeft: "0.5rem",
                        }}
                      >
                        Copy ID
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={onLogout}
                    style={{
                      width: "100%",
                      background: "transparent",
                      border: "none",
                      color: fontColor,
                      padding: "0.5rem",
                      cursor: "pointer",
                      textAlign: "left",
                      borderRadius: "0.25rem",
                    }}
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="mobile-menu-button"
          onClick={() => setIsOpen(!isOpen)}
          style={{
            display: "none",
            background: "transparent",
            border: "none",
            color: fontColor,
            cursor: "pointer",
            padding: "0.5rem",
            "@media (max-width: 768px)": {
              display: "block",
            },
          }}
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div
          className="mobile-menu"
          style={{
            padding: "1rem",
            borderTop: `1px solid ${fontColor}`,
          }}
        >
          <CurrentTime fontColor={fontColor} isInNavbar={true} />
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
              marginTop: "1rem",
            }}
          >
            <button
              onClick={onSettingsClick}
              style={{
                background: "transparent",
                border: `1px solid ${fontColor}`,
                color: fontColor,
                padding: "0.5rem",
                cursor: "pointer",
                borderRadius: "0.25rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <Settings size={16} />
              Settings
            </button>
            <div
              style={{
                padding: "0.5rem",
                border: `1px solid ${fontColor}`,
                borderRadius: "0.25rem",
              }}
            >
              <div style={{ marginBottom: "8px" }}>{userName}</div>
              <div>
                ID: {userId.slice(0, 8)}...
                <button
                  onClick={copyIdToClipboard}
                  style={{
                    background: "transparent",
                    border: `1px solid ${fontColor}`,
                    color: fontColor,
                    padding: "0.25rem 0.5rem",
                    cursor: "pointer",
                    borderRadius: "0.25rem",
                    fontSize: "0.75rem",
                    marginLeft: "0.5rem",
                  }}
                >
                  Copy ID
                </button>
              </div>
            </div>
            <button
              onClick={onLogout}
              style={{
                background: "transparent",
                border: `1px solid ${fontColor}`,
                color: fontColor,
                padding: "0.5rem",
                cursor: "pointer",
                borderRadius: "0.25rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;

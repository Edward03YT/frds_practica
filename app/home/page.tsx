"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu,
  X,
  Home,
  User,
  Clipboard,
  Phone,
  Info,
  LogOut,
  Shield,
  Megaphone,
  Plus,
  Trash2,
  UserCog,
  ScrollText,
  Notebook,
} from "lucide-react";
import Calendar from "react-calendar";
import { useRouter } from "next/navigation";
import confetti from "canvas-confetti";
import "react-calendar/dist/Calendar.css";

// --- Componente Utilitare ---

function Button({
  children,
  onClick,
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center justify-center rounded-md border border-gray-300 px-3 py-2 text-sm font-medium shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50 disabled:pointer-events-none ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

interface Announcement {
  id: number;
  text: string;
  created_at?: string;
}

type MenuState = "closed" | "open";
const ANNOUNCEMENTS_STORAGE_KEY = "app_announcements";

export default function HomePage() {
  const [menuState, setMenuState] = useState<MenuState>("closed");
  const [username, setUsername] = useState<string>("");
  const [date, setDate] = useState<Date>(new Date());
  const [isAdmin, setIsAdmin] = useState(false);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [newAnnouncement, setNewAnnouncement] = useState("");
  const [userAnnouncements, setUserAnnouncements] = useState<any[]>([]);
  const [showGuidePopup, setShowGuidePopup] = useState(false);
  const [showPage, setShowPage] = useState(true);
  const [isModerator, setIsModerator] = useState(false);
  const router = useRouter();

  // 1. Verifică userul și rolul de la server (NU din localStorage!)
  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch('/api/me', { credentials: 'include' });
        const data = await res.json();
        if (!data.success) {
          setShowPage(false);
          setTimeout(() => router.push("/login"), 700);
          return;
        }
        setUsername(data.user.username || data.user.name || "User");
        setIsAdmin(data.user.is_admin === 1);
        setIsModerator(data.user.is_moderator === 1);
      } catch (error) {
        setShowPage(false);
        setTimeout(() => router.push("/login"), 700);
      }
    }
    fetchUser();
  }, [router]);

  // 2. Încarcă anunțurile generale de pe server
  async function loadAnnouncements() {
    try {
      const res = await fetch('/api/announcements', { credentials: "include" });
      const data = await res.json();
      if (data.success) {
        setAnnouncements(data.announcements);
      } else {
        setAnnouncements([]);
      }
    } catch {
      setAnnouncements([]);
    }
  }

  useEffect(() => {
    loadAnnouncements();
  }, []);

  // 3. Încarcă anunțurile individuale pentru userul logat (doar dacă userul e logat)
  useEffect(() => {
    async function fetchUserAnnouncements() {
      try {
        const res = await fetch('/api/me', { credentials: 'include' });
        const data = await res.json();
        if (data.success && data.user && data.user.id) {
          const res2 = await fetch(`/api/user-announcements?userId=${data.user.id}`);
          const data2 = await res2.json();
          if (data2.success) setUserAnnouncements(data2.announcements);
        }
      } catch { }
    }
    fetchUserAnnouncements();
  }, []);

  // 4. Ghid popup 
  useEffect(() => {
    async function checkFirstLogin() {
      try {
        // Verifică dacă e prima conectare
        const checkRes = await fetch('/api/check-first-login', { credentials: 'include' });
        const checkData = await checkRes.json();

        if (checkData.success && checkData.isFirstLogin) {
          setShowGuidePopup(true);

          // Actualizează last_ip
          await fetch('/api/update-last-ip', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' }
          });
        }
      } catch (error) {
        console.error('Error checking first login:', error);
      }
    }

    if (username) { // Așteaptă să fie setat username-ul
      checkFirstLogin();
    }
  }, [username]);

  // --- Funcționalitate Anunțuri Generale (Admin) ---

  const handleAddAnnouncement = async () => {
    if (newAnnouncement.trim() === "" || !isAdmin) return;
    confetti({ particleCount: 80, spread: 70, origin: { y: 0.7 } });
    const res = await fetch('/api/announcements', {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: newAnnouncement })
    });
    const data = await res.json();
    if (data.success) {
      setNewAnnouncement("");
      loadAnnouncements();
    } else {
      alert(data.error || "Eroare la adăugare");
    }
  };

  const handleDeleteAnnouncement = async (id: number) => {
    if (!isAdmin) return;
    const res = await fetch('/api/announcements', {
      method: "DELETE",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id })
    });
    const data = await res.json();
    if (data.success) {
      loadAnnouncements();
    } else {
      alert(data.error || "Eroare la ștergere");
    }
  };
  // --- Funcționalitate Meniu ---

  const toggleMenu = () => {
    setMenuState((prev) => (prev === "closed" ? "open" : "closed"));
  };

  const menuItems = [
    { icon: Home, label: "ACASA", href: "/home" },
    { icon: User, label: "PROFIL", href: "/profil" },
    { icon: Info, label: "GHID", href: "/ghid" },
    { icon: Clipboard, label: "RAPOARTE", href: "/rapoarte" },
    { icon: ScrollText, label: "DOCUMENTE", href: "/documente" },
    { icon: Notebook, label: "PAAP", href: "/paap" },
    { icon: Shield, label: "GDPR", href: "/politica-gdpr" },
    { icon: Phone, label: "CONTACT", href: "/contact" },
    { icon: LogOut, label: "DECONECTARE", href: "/login" },


  ];

  const sidebarVariants = {
    closed: {
      x: -280,
      width: 280,
      transition: { type: "spring" as const, stiffness: 300, damping: 30 },
    },
    open: {
      x: 0,
      width: 280,
      transition: { type: "spring" as const, stiffness: 300, damping: 30 },
    },
  };

  const hamburgerVariants = {
    closed: { rotate: 0, transition: { duration: 0.3 } },
    open: { rotate: 90, transition: { duration: 0.3 } },
  };

  // --- ANIMATII FADE IN/OUT ---
  const pageVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: 0.8 } },
    exit: { opacity: 0, transition: { duration: 0.7 } },
  };

  const titleVariants = {
    initial: { opacity: 0, y: -30 },
    animate: { opacity: 1, y: 0, transition: { duration: 1 } },
    exit: { opacity: 0, y: 30, transition: { duration: 0.7 } },
  };

  // --- RENDER ---
  return (
    <AnimatePresence mode="wait">
      {showPage && (
        <motion.div
          key="main-page"
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="relative min-h-screen overflow-x-hidden"
        >
          {/* Fundal cu imagine și overlay transparent */}
          <div
            className="fixed inset-0 bg-cover bg-center bg-no-repeat z-0"
            style={{
              backgroundImage: "url('/logo.webp')",
            }}
          />

          {/* Bule animate nebune */}
          <motion.div
            className="fixed top-[-100px] left-[-100px] w-[350px] h-[350px] bg-purple-500 rounded-full opacity-40 blur-3xl z-0"
            animate={{ x: [0, 80, -60, 0], y: [0, 60, -40, 0], scale: [1, 1.2, 0.9, 1] }}
            transition={{ repeat: Infinity, duration: 12, ease: "easeInOut" }}
          />
          <motion.div
            className="fixed bottom-[-120px] right-[-120px] w-[400px] h-[400px] bg-blue-400 rounded-full opacity-30 blur-3xl z-0"
            animate={{ x: [0, -100, 60, 0], y: [0, -80, 40, 0], scale: [1, 1.1, 0.8, 1] }}
            transition={{ repeat: Infinity, duration: 14, ease: "easeInOut", delay: 2 }}
          />
          <motion.div
            className="fixed top-[40%] left-[-80px] w-[220px] h-[220px] bg-pink-400 rounded-full opacity-30 blur-2xl z-0"
            animate={{ x: [0, 40, -30, 0], y: [0, 30, -20, 0], scale: [1, 1.15, 0.95, 1] }}
            transition={{ repeat: Infinity, duration: 10, ease: "easeInOut", delay: 4 }}
          />
          {showGuidePopup && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
              <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full text-center border-2 border-blue-600">
                <h2 className="text-2xl font-bold mb-4 text-blue-700 flex items-center justify-center gap-2">
                  <Info className="inline-block" /> Bun venit în aplicația MIS!
                </h2>
                <p className="mb-6 text-gray-800">
                  Aceasta este prima ta conectare în aplicație.<br />
                  Pentru a folosi corect platforma, te rugăm să consulți <span className="font-semibold text-blue-700">Ghidul de utilizare</span>.<br />
                  <span className="text-red-600 font-bold">Este obligatoriu să citești ghidul înainte de a folosi platforma!</span>
                </p>
                <div className="flex flex-col gap-2">
                  <Button
                    className="bg-blue-600 text-white hover:bg-blue-700"
                    onClick={() => {
                      setShowGuidePopup(false);
                      router.push("/ghid");
                    }}
                  >
                    Vezi Ghidul
                  </Button>
                  <Button
                    className="bg-gray-200 text-gray-800 hover:bg-gray-300"
                    onClick={() => setShowGuidePopup(false)}
                  >
                    Am înțeles
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Overlay transparent */}
          <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-10" />

          {/* Header */}
          <div className="bg-white/90 backdrop-blur-md shadow-lg relative z-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex items-center justify-between">
                {/* Placeholder pentru aliniere */}
                <div className="w-1/4"></div>

                {/* Titlu Central cu fade in/out */}
                <AnimatePresence mode="wait">
                  <motion.h1
                    key={username}
                    variants={titleVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="text-center font-bold text-black text-3xl md:text-4xl underline flex-1"
                    style={{
                      textShadow: "0 0 8px #6366f1, 0 0 16px #a21caf"
                    }}
                  >
                    Bine ai venit, {username}!
                  </motion.h1>
                </AnimatePresence>

                {/* Buton Admin Panel (Dreapta Sus) */}
                <div className="w-1/4 flex justify-end">
                  {(isAdmin || isModerator) && (
                    <Button
                      onClick={() => router.push("/admin-panel")}
                      className="bg-red-600 text-white hover:bg-red-700 border-red-700 focus:ring-red-500 hover:shadow-[0_0_16px_4px_#f87171] transition-all"
                    >
                      <UserCog className="h-5 w-5 mr-2" />
                      Admin Panel
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Hamburger Button */}
          <motion.div
            className="fixed top-4 left-4 md:top-6 md:left-8 lg:top-8 lg:left-10 z-50"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              onClick={toggleMenu}
              className="bg-white/90 backdrop-blur-md shadow-lg border-gray-200 hover:bg-white/95"
              aria-label={
                menuState === "closed" ? "Deschide meniul" : "Închide meniul"
              }
            >
              <motion.div variants={hamburgerVariants} animate={menuState}>
                {menuState === "closed" ? (
                  <Menu className="h-5 w-5 text-black" />
                ) : (
                  <X className="h-5 w-5 text-black" />
                )}
              </motion.div>
            </Button>
          </motion.div>

          {/* Sidebar (Meniu Lateral) */}
          <motion.div
            className="fixed top-0 left-0 h-full bg-gradient-to-br from-white/95 via-blue-100/80 to-purple-100/80 backdrop-blur-md shadow-xl z-40 border-r border-gray-200"
            variants={sidebarVariants}
            animate={menuState}
            initial="closed"
          >
            <div className="flex flex-col h-full">
              <div className="p-6 border-b border-gray-200" />
              <nav className="flex-1 p-4">
                <ul className="space-y-2">
                  {menuItems.map((item, index) => (
                    <motion.li
                      key={item.label}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{
                        opacity: 1,
                        x: 0,
                        transition: {
                          delay: menuState === "closed" ? 0 : index * 0.1,
                          duration: 0.3,
                        },
                      }}
                    >
                      <a
                        href={item.href}
                        className={`flex items-center gap-3 px-3 py-3 rounded-lg text-gray-700 hover:bg-gray-100/80 hover:text-gray-900 transition-colors ${menuState === "open" ? "" : "justify-center"
                          }`}
                        aria-label={item.label}
                      >
                        <item.icon className="h-5 w-5 flex-shrink-0" />
                        <AnimatePresence>
                          {menuState !== "closed" && (
                            <motion.span
                              initial={{ opacity: 0, width: 0 }}
                              animate={{
                                opacity: 1,
                                width: "auto",
                                transition: { duration: 0.3 },
                              }}
                              exit={{
                                opacity: 0,
                                width: 0,
                                transition: { duration: 0.2 },
                              }}
                              className="font-medium whitespace-nowrap"
                            >
                              {item.label}
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </a>
                    </motion.li>
                  ))}
                </ul>
              </nav>
              <div className="p-4 border-t border-gray-200">
                <motion.div
                  animate={{
                    opacity: menuState === "closed" ? 1 : 0,
                    transition: { duration: 0.2 },
                  }}
                >
                  {menuState === "closed" && (
                    <p className="text-sm text-gray-500 text-center">© 2025 FRDS</p>
                  )}
                </motion.div>
              </div>
            </div>
          </motion.div>

          {/* Main Content */}
          <motion.div
            className="transition-all duration-300 ease-in-out pt-16 relative z-20"
            animate={{
              paddingLeft: menuState === "open" ? 300 : 0,
            }}
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex gap-8 flex-wrap lg:flex-nowrap">

              {/* --- Anunțuri individuale pentru userul logat --- */}
              {userAnnouncements.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                  className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded w-full"
                >
                  <h3 className="font-bold text-red-700 mb-2 flex items-center">
                    <Megaphone className="mr-2" /> Anunțuri pentru tine
                  </h3>
                  {userAnnouncements.map(a => (
                    <div key={a.id} className="mb-2">
                      <div className="font-semibold text-black">{a.subject}</div>
                      <div className="text-black">{a.message}</div>
                      <div className="text-xs text-gray-500">
                        {(() => {
                          const date = new Date(a.created_at);
                          date.setHours(date.getHours() + 3); // Adaugă 3 ore pentru România
                          return date.toLocaleString("ro-RO", {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          });
                        })()}
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}

              {/* --- Secțiunea Anunțuri Generale (Stânga) --- */}
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="w-full lg:w-2/3 bg-white/90 backdrop-blur-md rounded-2xl shadow-xl p-6"
              >
                <h2 className="text-2xl font-semibold mb-4 text-gray-900 flex items-center gap-2">
                  <Megaphone className="h-6 w-6 text-blue-600" /> Anunțuri Importante
                </h2>

                {/* Formular Adăugare Anunț (Doar Admin) */}
                {isAdmin && (
                  <div className="mb-6 p-4 bg-blue-50/80 backdrop-blur-sm rounded-lg border border-blue-200">
                    <textarea
                      value={newAnnouncement}
                      onChange={(e) => setNewAnnouncement(e.target.value)}
                      placeholder="Adaugă un anunț nou..."
                      rows={3}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-black bg-white/90 backdrop-blur-sm" />
                    <Button
                      onClick={handleAddAnnouncement}
                      className="mt-2 bg-blue-600 text-white hover:bg-blue-700 border-blue-700 focus:ring-blue-500 hover:shadow-[0_0_16px_4px_#6366f1] transition-all"
                      disabled={!newAnnouncement.trim()}
                    >
                      <Plus className="h-4 w-4 mr-2" /> Adaugă Anunț
                    </Button>
                  </div>
                )}

                {/* Listă Anunțuri Generale */}
                <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                  {announcements.length > 0 ? (
                    announcements.map((announcement) => (
                      <motion.div
                        key={announcement.id}
                        whileHover={{
                          scale: 1.04,
                          boxShadow: "0 8px 32px 0 rgba(99,102,241,0.25)",
                          background: "linear-gradient(90deg, #e0e7ff 0%, #f3e8ff 100%)"
                        }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        className="p-4 bg-gray-50/80 backdrop-blur-sm rounded-lg shadow-sm border border-gray-200 flex justify-between items-center transition-all hover:shadow-md hover:bg-gray-50/90"
                      >
                        <div>
                          <p className="text-gray-800">{announcement.text}</p>
                          {announcement.created_at && (
                            <div className="text-xs text-gray-500 mt-1">
                              {(() => {
                                const date = new Date(announcement.created_at);
                                date.setHours(date.getHours() + 3); // Adaugă 3 ore pentru România
                                return date.toLocaleString("ro-RO", {
                                  year: 'numeric',
                                  month: '2-digit',
                                  day: '2-digit',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                });
                              })()}
                            </div>
                          )}
                        </div>
                        {isAdmin && (
                          <button
                            onClick={() => handleDeleteAnnouncement(announcement.id)}
                            className="ml-4 text-red-500 hover:text-red-700 transition-colors"
                            title="Șterge anunțul"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        )}
                      </motion.div>
                    ))
                  ) : (
                    <p className="text-gray-500 italic">Nu există anunțuri momentan.</p>
                  )}
                </div>
              </motion.div>

              {/* --- Calendar (Dreapta) --- */}
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="w-full lg:w-1/3 min-w-[320px] bg-white/90 backdrop-blur-md rounded-2xl shadow-xl p-6"
              >
                <h2 className="text-2xl font-semibold mb-4 text-gray-900 flex items-center gap-2">
                  📅 Calendar
                </h2>
                <Calendar
                  onChange={(value) => {
                    if (value instanceof Date) {
                      setDate(value);
                    } else if (Array.isArray(value) && value[0] instanceof Date) {
                      setDate(value[0]);
                    }
                  }}
                  value={date}
                  className="react-calendar w-full"
                  tileClassName={({ date, view }) => {
                    if (view === "month") {
                      const day = date.getDay();
                      if (day === 0 || day === 6) {
                        return "weekend-day";
                      }
                    }
                    return null;
                  }}
                />
              </motion.div>
            </div>

            {/* Footer */}
            <footer className="bg-gray-900 text-white py-12 mt-8">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-3 mb-4">
                    <div className="w-40 h-40 rounded-lg flex items-center justify-center">
                      <img
                        src="images-removebg-preview.webp"
                        alt="Imagine FRDS"
                        width={300}
                        height={180}
                        className="max-w-full max-h-[120vh] object-contain opacity-50"
                      />
                    </div>
                  </div>
                  <p className="text-gray-400 mb-6">© 2025 FRDS. Toate drepturile rezervate.</p>
                  <div className="flex justify-center space-x-6">
                    <a
                      href="mailto:office@frds.ro"
                      className="text-gray-400 hover:text-white transition-colors"
                      aria-label="Trimite email către office@frds.ro"
                    >
                      Contact
                    </a>
                    <a
                      href="https://www.frds.ro"
                      className="text-gray-400 hover:text-white transition-colors"
                      aria-label="Pagina Despre noi FRDS"
                    >
                      Despre noi
                    </a>
                  </div>
                </div>
              </div>
            </footer>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
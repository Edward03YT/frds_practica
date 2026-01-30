"use client";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu, X, Home, User, Clipboard, Phone, Info, LogOut, Shield, FileText, Youtube, ScrollText, Notebook
} from "lucide-react";
import { useRouter } from "next/navigation";

// Dynamic imports
const PDFViewer = dynamic(() => import("../components/PDFViewer"), {
  ssr: false,
  loading: () => <p className="text-center text-gray-500">Se încarcă PDF-ul...</p>,
});
const YouTubeEmbed = dynamic(() => import("../components/YouTubeEmbed"), {
  ssr: false,
  loading: () => <p className="text-center text-gray-500">Se încarcă video...</p>,
});

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  children: React.ReactNode;
};

function Button({ children, onClick, className = "", ...props }: ButtonProps) {
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
    transition: { type: "spring", stiffness: 300, damping: 30 } as const,
  },
  open: {
    x: 0,
    width: 280,
    transition: { type: "spring", stiffness: 300, damping: 30 } as const,
  },
};

const hamburgerVariants = {
  closed: { rotate: 0, transition: { duration: 0.3 } },
  open: { rotate: 90, transition: { duration: 0.3 } },
};

const pageVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.7 } },
  exit: { opacity: 0, transition: { duration: 0.5 } },
};

const cardVariants = {
  initial: { opacity: 0, y: 40 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.7 } },
  exit: { opacity: 0, y: 40, transition: { duration: 0.5 } },
};

const GuidePage = () => {
  const [menuState, setMenuState] = useState<"closed" | "open">("closed");
  const [showPDF, setShowPDF] = useState(false);
  const [showPage, setShowPage] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let active = true;

    const verifyAuth = async () => {
      try {
        // evită cache-ul și asigură trimiterea cookie-urilor
        const res = await fetch("/api/me", { credentials: "include", cache: "no-store" });
        if (!active) return;

        if (res.ok) {
          setShowPage(true); // ești autenticat
        } else {
          setShowPage(false);
          router.replace(`/login?next=${encodeURIComponent("/ghid")}`);
        }
      } catch {
        setShowPage(false);
        router.replace(`/login?next=${encodeURIComponent("/ghid")}`);
      }
    };

    // Poți porni cu showPage = false ca să nu „clipească” conținutul
    setShowPage(false);
    verifyAuth();

    return () => {
      active = false;
    };
  }, [router]);

  const toggleMenu = useCallback(() => {
    setMenuState((prev) => (prev === "closed" ? "open" : "closed"));
  }, []);

  return (
    <AnimatePresence mode="wait">
      {showPage && (
        <motion.div
          key="guide-page"
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50"
        >
          {/* Hamburger Button */}
          <motion.div
            className="fixed top-4 left-4 md:top-6 md:left-8 lg:top-8 lg:left-10 z-50"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              onClick={toggleMenu}
              className="bg-white shadow-lg border-gray-200 hover:bg-gray-50"
              aria-label={menuState === "closed" ? "Deschide meniul" : "Închide meniul"}
            >
              <motion.div variants={hamburgerVariants} animate={menuState}>
                {menuState === "closed" ? <Menu className="h-5 w-5 text-black" /> : <X className="h-5 w-5 text-black" />}
              </motion.div>
            </Button>
          </motion.div>

          {/* Sidebar */}
          <motion.nav
            className="fixed top-0 left-0 h-full bg-white shadow-xl z-40 border-r border-gray-200"
            variants={sidebarVariants}
            animate={menuState}
            initial="closed"
            aria-label="Meniu principal"
          >
            <div className="flex flex-col h-full">
              <div className="p-6 border-b border-gray-200" />
              <ul className="flex-1 p-4 space-y-2">
                {menuItems.map((item, index) => (
                  <motion.li
                    key={item.label}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{
                      opacity: 1,
                      x: 0,
                      transition: { delay: menuState === "closed" ? 0 : index * 0.1, duration: 0.3 },
                    }}
                  >
                    <Link
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-3 rounded-lg text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors ${menuState === "open" ? "" : "justify-center"}`}
                      aria-label={item.label}
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      <AnimatePresence>
                        {menuState !== "closed" && (
                          <motion.span
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: "auto", transition: { duration: 0.3 } }}
                            exit={{ opacity: 0, width: 0, transition: { duration: 0.2 } }}
                            className="font-medium whitespace-nowrap"
                          >
                            {item.label}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </Link>
                  </motion.li>
                ))}
              </ul>
              <div className="p-4 border-t border-gray-200">
                <motion.div
                  animate={{ opacity: menuState === "closed" ? 1 : 0, transition: { duration: 0.2 } }}
                >
                  {menuState === "closed" && (
                    <p className="text-sm text-gray-500 text-center">© 2025 FRDS</p>
                  )}
                </motion.div>
              </div>
            </div>
          </motion.nav>

          {/* Main Content */}
          <motion.main
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="transition-all duration-300 ease-in-out pt-8"
            style={{ paddingLeft: menuState === "closed" ? 0 : 280 }}
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
              <motion.header
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.7, delay: 0.1 }}
                className="text-center mb-16"
              >
                <div className="flex justify-center mb-4">
                  <Info className="w-14 h-14 text-blue-600" />
                </div>
                <h1 className="text-4xl font-bold text-gray-900 mb-4">Ghid de Utilizare</h1>
                <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                  Aici găsești resurse utile pentru a înțelege mai bine serviciile noastre și cum să le folosești eficient.
                </p>
              </motion.header>

              <div className="grid lg:grid-cols-2 gap-16">
                {/* YouTube Video Section */}
                <motion.section
                  variants={cardVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="bg-white rounded-2xl shadow-xl p-8 lg:p-10"
                  whileHover={{ scale: 1.01, boxShadow: "0 8px 32px 0 rgba(99,102,241,0.10)" }}
                  transition={{ type: "spring", stiffness: 200, damping: 20 }}
                  aria-labelledby="tutorial-video"
                >
                  <h2 id="tutorial-video" className="flex justify-center text-2xl font-bold text-gray-900 mb-8 items-center">
                    <Youtube className="mr-2 text-red-600" />
                    Tutorial Video
                  </h2>
                  <div className="aspect-w-16 aspect-h-9 mb-10 flex items-center justify-center">
                    <YouTubeEmbed videoId="uG5v0msnqJw" />
                  </div>
                  <div className="flex justify-center mb-4">
                    <p className="text-gray-600">
                      Vizualizează acest tutorial video pentru a înțelege mai bine cum funcționează platforma noastră.
                      Poți redimensiona player-ul sau îl poți viziona în modul fullscreen.
                    </p>
                  </div>
                </motion.section>

                {/* PDF Document Section */}
                <motion.section
                  variants={cardVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="bg-white rounded-2xl shadow-xl p-8 lg:p-10"
                  whileHover={{ scale: 1.01, boxShadow: "0 8px 32px 0 rgba(99,102,241,0.10)" }}
                  transition={{ type: "spring", stiffness: 200, damping: 20 }}
                  aria-labelledby="pdf-docs"
                >
                  <h2 id="pdf-docs" className="flex justify-center items-center text-2xl font-bold text-gray-900 mb-8">
                    <FileText className="mr-2 text-blue-600" />
                    Documentație PDF și TEMPLATE
                  </h2>
                  <div className="bg-gray-100 rounded-lg p-6 mb-6 flex flex-col items-center">
                    {!showPDF ? (
                      <Button
                        onClick={() => setShowPDF(true)}
                        className="bg-blue-600 text-white hover:bg-blue-700 mb-2"
                      >
                        <FileText className="mr-2" size={18} />
                        Vezi PDF în pagină
                      </Button>
                    ) : (
                      <PDFViewer src="/PDF.pdf" />
                    )}
                  </div>
                  <p className="text-center text-red-600 mb-4">
                    Descarcă documentul PDF complet și TEMPLATURILE.
                  </p>
                  <div className="flex flex-col md:flex-row flex-wrap justify-center items-center gap-4">
                    <a
                      href="/Template_Achizitii.xlsx"
                      download="Template_Achizitii_FRDS.xlsx"
                      className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      aria-label="Descarcă template pentru achiziții în format Excel"
                    >
                      <FileText className="mr-2" size={18} aria-hidden="true" />
                      Descarcă Template_Achizitii
                    </a>
                    <a
                      href="/Template_Financiar.xlsx"
                      download="Template_Financiar_FRDS.xlsx"
                      className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      aria-label="Descarcă template financiar în format Excel"
                    >
                      <FileText className="mr-2" size={18} aria-hidden="true" />
                      Descarcă Template_Financiar
                    </a>
                    <a
                      href="/PDF.pdf"
                      download="Ghid_Utilizare_FRDS.pdf"
                      className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      aria-label="Descarcă ghidul complet de utilizare în format PDF"
                    >
                      <FileText className="mr-2" size={18} aria-hidden="true" />
                      Descarcă PDF
                    </a>
                  </div>
                </motion.section>
              </div>
            </div>

            {/* Footer */}
            <footer className="bg-gray-900 text-white py-12 mt-8">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-3 mb-4">
                    <div className="w-40 h-40 rounded-lg flex items-center justify-center">
                      <Image
                        src="/images-removebg-preview.webp"
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
                      aria-label="Contactați-ne prin email la office@frds.ro"
                    >
                      Contact
                    </a>
                    <a
                      href="https://www.frds.ro"
                      className="text-gray-400 hover:text-white transition-colors"
                      rel="noopener noreferrer"
                      target="_blank"
                      aria-label="Vizitați site-ul oficial FRDS (se deschide în fereastră nouă)"
                    >
                      Despre noi
                    </a>
                  </div>
                </div>
              </div>
            </footer>
          </motion.main>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default GuidePage;
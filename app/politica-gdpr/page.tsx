"use client";

import Image from "next/image";
import React, { useEffect, useState, useCallback, memo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Facebook,
  Twitter,
  Linkedin,
  Youtube,
  Info,
  MapPin,
  Phone,
  Mail,
  Shield,
  Lock,
  Eye,
  FileText,
  Menu,
  X,
  Home,
  User,
  Clipboard,
  LogOut,
  ScrollText,
  Notebook,
} from "lucide-react";

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

type MenuState = "closed" | "open";


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

const MenuItem = memo(
  ({
    Icon,
    label,
    href,
    menuState,
    delay,
  }: {
    Icon: typeof Home;
    label: string;
    href: string;
    menuState: MenuState;
    delay: number;
  }) => (
    <motion.li
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.3 }}
      className="list-none"
    >
      <a
        href={href}
        className={`flex items-center gap-3 px-3 py-3 rounded-lg text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors ${menuState === "open" ? "justify-start" : "justify-center"
          }`}
        aria-label={label}
      >
        <Icon className="h-5 w-5 flex-shrink-0" />
        {menuState === "open" && (
          <span
            style={{
              transition: "opacity 0.3s ease, width 0.3s ease",
              opacity: menuState === "open" ? 1 : 0,
              width: menuState === "open" ? "auto" : 0,
              whiteSpace: "nowrap",
              overflow: "hidden",
              display: "inline-block",
            }}
            className="font-medium"
          >
            {label}
          </span>
        )}
      </a>
    </motion.li>
  )
);

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

const GDPRPage = () => {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [menuState, setMenuState] = useState<MenuState>("closed");
  const [showPage, setShowPage] = useState(true);

  const toggleMenu = useCallback(() => {
    setMenuState((prev) => (prev === "closed" ? "open" : "closed"));
  }, []);

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
          router.replace(`/login?next=${encodeURIComponent("/politica-gdpr")}`);
        }
      } catch {
        setShowPage(false);
        router.replace(`/login?next=${encodeURIComponent("/politica-gdpr")}`);
      }
    };

    // Poți porni cu showPage = false ca să nu „clipească” conținutul
    setShowPage(false);
    verifyAuth();

    return () => {
      active = false;
    };
  }, [router]);


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

  return (
    <AnimatePresence mode="wait">
      {showPage && (
        <motion.div
          key="gdpr-page"
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
                {menuState === "closed" ? (
                  <Menu className="h-5 w-5 text-black" />
                ) : (
                  <X className="h-5 w-5 text-black" />
                )}
              </motion.div>
            </Button>
          </motion.div>

          {/* Sidebar (Meniu Lateral) */}
          <motion.aside
            className="fixed top-0 left-0 h-full bg-white shadow-xl z-40 border-r border-gray-200 flex flex-col"
            variants={sidebarVariants}
            animate={menuState}
            initial="closed"
            aria-label="Meniu principal"
          >
            <div className="p-6 border-b border-gray-200" />
            <nav className="flex-1 p-4" aria-label="Navigație principală">
              <ul className="space-y-2">
                {menuItems.map((item, index) => (
                  <MenuItem
                    key={item.label}
                    Icon={item.icon}
                    label={item.label}
                    href={item.href}
                    menuState={menuState}
                    delay={menuState === "open" ? index * 0.1 : 0}
                  />
                ))}
              </ul>
            </nav>
            <div className="p-4 border-t border-gray-200 text-center">
              {menuState === "closed" && <p className="text-sm text-gray-500">© 2025 FRDS</p>}
            </div>
          </motion.aside>

          {/* Main Content */}
          <motion.main
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="transition-all duration-300 ease-in-out pt-8"
            style={{ paddingLeft: menuState === "closed" ? 0 : 280 }}
            aria-live="polite"
          >
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
              {/* Hero Section */}
              <motion.header
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.7, delay: 0.1 }}
                className="text-center mb-16"
              >
                <div className="flex justify-center mb-6">
                  <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
                    <Shield className="w-10 h-10 text-blue-600" />
                  </div>
                </div>
                <h2 className="text-4xl font-bold text-gray-900 mb-4">Politica privind GDPR</h2>
                <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                  Protecția datelor dumneavoastră cu caracter personal este importantă pentru noi
                </p>
              </motion.header>

              {/* Content Card */}
              <motion.article
                variants={cardVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="bg-white rounded-2xl shadow-xl p-8 lg:p-12 mb-12"
                whileHover={{ scale: 1.01, boxShadow: "0 8px 32px 0 rgba(99,102,241,0.10)" }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
              >
                {/* Introducere */}
                <section className="mb-10">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">Introducere</h3>
                  </div>
                  <p className="text-gray-700 leading-relaxed mb-6">
                    Noua lege a Uniunii Europene referitoare la protecția datelor cu caracter personal,
                    GDPR („General Data Protection Regulation") a intrat în vigoare pe 25 Mai 2016, dar a
                    început să își producă efectele din 25 Mai 2018...
                  </p>
                </section>

                {/* Protecția Datelor */}
                <section className="mb-10">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <Lock className="w-5 h-5 text-green-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">Protecția Datelor</h3>
                  </div>
                  <p className="text-gray-700 leading-relaxed mb-6">
                    Protecția datelor dumneavoastră cu caracter personal este importantă pentru noi...
                  </p>
                </section>

                {/* Atenție Deosebită */}
                <section className="mb-10">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Eye className="w-5 h-5 text-purple-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">Atenție Deosebită</h3>
                  </div>
                  <p className="text-gray-700 leading-relaxed">
                    Vă rugăm să acordați o atenție deosebită lecturării următoarei Politici...
                  </p>
                </section>

                {/* Contact */}
                <section className="bg-gray-50 rounded-xl p-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">
                    Contact pentru Date Personale
                  </h3>
                  <p className="text-gray-700 leading-relaxed mb-6">
                    Pentru orice întrebări sau solicitări legate de prelucrarea datelor tale personale...
                  </p>

                  <div className="grid md:grid-cols-3 gap-6">
                    {/* Telefon */}
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Phone className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">Telefon</h4>
                        <a
                          href="tel:+40213153415"
                          className="text-gray-600 hover:text-green-600 transition-colors text-sm"
                        >
                          0040213153415
                        </a>
                      </div>
                    </div>

                    {/* Email */}
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Mail className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">Email</h4>
                        <a
                          href="mailto:office@frds.ro"
                          className="text-gray-600 hover:text-purple-600 transition-colors text-sm"
                        >
                          office@frds.ro
                        </a>
                      </div>
                    </div>

                    {/* Adresă */}
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">Adresă</h4>
                        <address className="not-italic text-gray-600 text-sm leading-relaxed">
                          Str. Stavropoleos nr. 6, et. 4
                          <br />
                          Sector 3, București
                          <br />
                          Cod poștal 030084
                        </address>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Drepturi */}
                <section className="mt-8 p-6 bg-yellow-50 border border-yellow-200 rounded-xl flex items-start space-x-3">
                  <div className="w-6 h-6 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                    <Shield className="w-4 h-4 text-yellow-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-yellow-800 mb-2">Drepturile Tale</h4>
                    <p className="text-yellow-700 text-sm leading-relaxed">
                      Dacă consideri că drepturile tale au fost încălcate, ai dreptul de a depune o plângere la ANSPDCP.
                    </p>
                  </div>
                </section>
              </motion.article>

              {/* Social Media Section */}
              <motion.section
                variants={cardVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="bg-white rounded-2xl shadow-xl p-8 lg:p-10"
                whileHover={{ scale: 1.01, boxShadow: "0 8px 32px 0 rgba(99,102,241,0.10)" }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
              >
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">Rămâi conectat</h3>
                  <p className="text-gray-600">
                    Urmărește-ne pe rețelele sociale pentru cele mai recente actualizări
                  </p>
                </div>
                <div className="flex justify-center space-x-6">
                  <a
                    href="https://www.facebook.com/FondulRoman"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group"
                    aria-label="Facebook"
                  >
                    <Facebook
                      size={40}
                      className="text-blue-600 group-hover:text-blue-700 transition-colors"
                    />
                  </a>
                  <a
                    href="https://x.com/LocalDevProgram"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group"
                    aria-label="Twitter"
                  >
                    <Twitter
                      size={40}
                      className="text-blue-400 group-hover:text-blue-500 transition-colors"
                    />
                  </a>
                  <a
                    href="https://www.linkedin.com/company/fondul-roman-de-dezvoltare-sociala"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group"
                    aria-label="LinkedIn"
                  >
                    <Linkedin
                      size={40}
                      className="text-blue-700 group-hover:text-blue-800 transition-colors"
                    />
                  </a>
                  <a
                    href="https://www.youtube.com/channel/UCLbFJ3PIv5f_DSvQL2qSypg?view_as=subscriber"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group"
                    aria-label="YouTube"
                  >
                    <Youtube
                      size={40}
                      className="text-red-600 group-hover:text-red-700 transition-colors"
                    />
                  </a>
                </div>
              </motion.section>
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
                        priority={true}
                      />
                    </div>
                  </div>
                  <p className="text-gray-400 mb-6">© 2025 FRDS. Toate drepturile rezervate.</p>
                  <div className="flex justify-center space-x-6">
                    <a
                      href="mailto:office@frds.ro"
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      Contact
                    </a>
                    <a
                      href="https://www.frds.ro"
                      className="text-gray-400 hover:text-white transition-colors"
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

export default GDPRPage;
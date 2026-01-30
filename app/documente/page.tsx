"use client";
import Image from "next/image";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from "framer-motion";
import {
  Facebook, Twitter, Linkedin, Youtube, Info,
  User, FileText, DollarSign, ShoppingCart, File,
  Menu, X, Home, Clipboard, Phone, LogOut, Shield, ScrollText, Notebook,
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

interface UserData {
  username: string;
  email: string;
  id?: string;
}

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

const DocumentePage = () => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [menuState, setMenuState] = useState<MenuState>("closed");
  const [showPage, setShowPage] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch('/api/me', {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
        });

        const data = await res.json();
        console.log("API /api/auth/me response:", data);

        // Verifică succesul și existența userului
        if (!data.success || !data.user) {
          throw new Error('unauthenticated');
        }

        if (cancelled) return;
        setUserData(data.user);
      } catch (err) {
        if (cancelled) return;
        setShowPage(false);
        router.replace('/login?next=/documente');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);


  const handleFinancialDocs = () => {
    router.push('/doc-financiar');
  };

  const handlePurchaseDocs = () => {
    router.push('/doc-achizitii');
  };

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Se încarcă...</p>
        </div>
      </div>
    );
  }

  if (!userData) return null;

  return (
    <AnimatePresence mode="wait">
      {showPage && (
        <motion.div
          key="documente-page"
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
            className="fixed top-0 left-0 h-full bg-white shadow-xl z-40 border-r border-gray-200"
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
                        className={`flex items-center gap-3 px-3 py-3 rounded-lg text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors ${menuState === "open" ? "" : "justify-center"
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
            className="transition-all duration-300 ease-in-out pt-8"
            animate={{
              paddingLeft: menuState === "closed" ? "0" : 280,
            }}
          >
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
              {/* Hero Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.7, delay: 0.1 }}
                className="text-center mb-16"
              >
                <div className="flex justify-center mb-6">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                    <FileText className="w-10 h-10 text-green-600" />
                  </div>
                </div>
                <h2 className="text-4xl font-bold text-gray-900 mb-4">Documente</h2>
                <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                  Bună ziua, {userData.username}! Accesează și gestionează documentele tale
                </p>
              </motion.div>

              {/* Documente Section with aligned buttons */}
              <div className="grid md:grid-cols-2 gap-8 mb-16">
                {/* Documente Financiare */}
                <motion.div
                  variants={cardVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="bg-white rounded-2xl shadow-xl p-8 lg:p-12 flex flex-col hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                  whileHover={{ scale: 1.05, boxShadow: "0 8px 32px 0 rgba(99,102,241,0.10)" }}
                  transition={{ type: "spring", stiffness: 200, damping: 20 }}
                >
                  <div className="text-center">
                    <div className="w-24 h-24 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                      <DollarSign className="w-12 h-12 text-blue-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">Documente Financiare</h3>
                    <p className="text-gray-600 mb-8 leading-relaxed">
                      Accesează documentele financiare, bilanțurile și alte documente contabile importante
                    </p>
                  </div>
                  <button
                    onClick={handleFinancialDocs}
                    className="bg-blue-600 text-white py-4 px-6 rounded-xl font-semibold hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center space-x-3 shadow-lg hover:shadow-xl mt-auto"
                  >
                    <FileText className="w-5 h-5" />
                    <span>Vezi Documente Financiare</span>
                  </button>
                </motion.div>

                {/* Documente Achiziții */}
                <motion.div
                  variants={cardVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="bg-white rounded-2xl shadow-xl p-8 lg:p-12 flex flex-col hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                  whileHover={{ scale: 1.05, boxShadow: "0 8px 32px 0 rgba(99,102,241,0.10)" }}
                  transition={{ type: "spring", stiffness: 200, damping: 20 }}
                >
                  <div className="text-center">
                    <div className="w-24 h-24 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                      <ShoppingCart className="w-12 h-12 text-purple-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">Documente Achiziții</h3>
                    <p className="text-gray-600 mb-8 leading-relaxed">
                      Consultă documentele de achiziții, contractele și procesele de procurement
                    </p>
                  </div>
                  <button
                    onClick={handlePurchaseDocs}
                    className="bg-purple-600 text-white py-4 px-6 rounded-xl font-semibold hover:bg-purple-700 transition-colors duration-200 flex items-center justify-center space-x-3 shadow-lg hover:shadow-xl mt-auto"
                  >
                    <File className="w-5 h-5" />
                    <span>Vezi Documente Achiziții</span>
                  </button>
                </motion.div>
              </div>

              {/* Information Card */}
              <motion.div
                variants={cardVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="bg-white rounded-2xl shadow-xl p-8 lg:p-12 mb-12"
                whileHover={{ scale: 1.01, boxShadow: "0 8px 32px 0 rgba(99,102,241,0.10)" }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
              >
                <div className="text-center">
                  <div className="w-16 h-16 bg-yellow-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Info className="w-8 h-8 text-yellow-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">Informații Importante</h3>
                  <p className="text-gray-600 leading-relaxed max-w-2xl mx-auto">
                    Toate documentele sunt confidențiale și destinate doar utilizatorilor autorizați.
                    Pentru întrebări sau probleme tehnice, vă rugăm să contactați echipa de suport.
                  </p>
                </div>
              </motion.div>

              {/* Social Media Section */}
              <motion.div
                variants={cardVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="bg-white rounded-2xl shadow-xl p-8 lg:p-10"
                whileHover={{ scale: 1.01, boxShadow: "0 8px 32px 0 rgba(99,102,241,0.10)" }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
              >
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    Rămâi conectat
                  </h3>
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
                  >
                    <Facebook
                      size={40}
                      className="text-blue-600 group-hover:text-blue-700 transition-colors"
                      aria-label="Facebook"
                    />
                  </a>
                  <a
                    href="https://x.com/LocalDevProgram"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group"
                  >
                    <Twitter
                      size={40}
                      className="text-blue-400 group-hover:text-blue-500 transition-colors"
                      aria-label="Twitter"
                    />
                  </a>
                  <a
                    href="https://www.linkedin.com/company/fondul-roman-de-dezvoltare-sociala"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group"
                  >
                    <Linkedin
                      size={40}
                      className="text-blue-700 group-hover:text-blue-800 transition-colors"
                      aria-label="LinkedIn"
                    />
                  </a>
                  <a
                    href="https://www.youtube.com/channel/UCLbFJ3PIv5f_DSvQL2qSypg?view_as=subscriber"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group"
                  >
                    <Youtube
                      size={40}
                      className="text-red-600 group-hover:text-red-700 transition-colors"
                      aria-label="YouTube"
                    />
                  </a>
                </div>
              </motion.div>
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
                    <a href="mailto:office@frds.ro" className="text-gray-400 hover:text-white">Contact</a>
                    <a href="https://www.frds.ro" className="text-gray-400 hover:text-white">Despre noi</a>
                  </div>
                </div>
              </div>
            </footer>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DocumentePage;
"use client";

import React, { useState, useEffect, useCallback, memo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Facebook, Twitter, Notebook, Linkedin, Youtube, Info, MapPin, Phone, Mail, Map, Menu, X, Home, User, Clipboard, LogOut, Shield, Contact, ScrollText } from "lucide-react";


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

const problemTypes = [
  { value: "", label: "Alege tipul problemei" },
  { value: "X", label: "X" },
  { value: "Y", label: "Y" },
  { value: "Z", label: "Z" },
];

function Button({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className="inline-flex items-center justify-center rounded-md border border-gray-300 px-3 py-2 text-sm font-medium shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50 disabled:pointer-events-none"
      {...props}
    >
      {children}
    </button>
  );
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

const ContactPage = () => {
  const router = useRouter();
  const [menuState, setMenuState] = useState<"closed" | "open">("closed");
  const [problemType, setProblemType] = useState("");
  const [formData, setFormData] = useState({ firstName: "", lastName: "", email: "", subject: "", message: "" });
  const [showPage, setShowPage] = useState(true);

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
          router.replace(`/login?next=${encodeURIComponent("/contact")}`);
        }
      } catch {
        setShowPage(false);
        router.replace(`/login?next=${encodeURIComponent("/contact")}`);
      }
    };

    // Poți porni cu showPage = false ca să nu „clipească” conținutul
    setShowPage(false);
    verifyAuth();

    return () => {
      active = false;
    };
  }, [router]);


  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    if (res.ok) {
      setFormData({ firstName: "", lastName: "", email: "", subject: "", message: "" });
    }
  }, [formData]);

  const toggleMenu = useCallback(() => setMenuState((prev) => (prev === "closed" ? "open" : "closed")), []);

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
          key="contact-page"
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 font-sans"
        >
          {/* Hamburger Button */}
          <motion.div className="fixed top-4 left-4 z-50" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button onClick={toggleMenu} aria-label={menuState === "closed" ? "Deschide meniul" : "Închide meniul"}>
              <motion.div variants={hamburgerVariants} animate={menuState}>
                {menuState === "closed" ? <Menu className="h-5 w-5 text-black" /> : <X className="h-5 w-5 text-black" />}
              </motion.div>
            </Button>
          </motion.div>

          {/* Sidebar */}
          <motion.aside
            className="fixed top-0 left-0 h-full bg-white shadow-xl z-40 border-r border-gray-200"
            variants={sidebarVariants}
            animate={menuState}
            initial="closed"
            role="navigation"
            aria-label="Meniu principal"
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
                        transition: { delay: menuState === "closed" ? 0 : index * 0.1, duration: 0.3 },
                      }}
                    >
                      <Link href={item.href} className={`flex items-center gap-3 px-3 py-3 rounded-lg text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors ${menuState === "open" ? "" : "justify-center"}`}>
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
              </nav>
              <div className="p-4 border-t border-gray-200 text-center">
                {menuState === "closed" && <p className="text-sm text-gray-500">© 2025 FRDS</p>}
              </div>
            </div>
          </motion.aside>

          {/* Main Content */}
          <motion.main
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="pt-8 transition-all duration-300 ease-in-out"
            style={{ paddingLeft: menuState === "closed" ? 0 : 280 }}
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.7, delay: 0.1 }}
                className="text-center mb-16"
              >
                <div className="flex justify-center mb-4">
                  <Contact className="w-14 h-14 text-blue-600" />
                </div>
                <h2 className="text-4xl font-bold text-gray-900 mb-4">Contactează-ne</h2>
                <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                  Suntem aici pentru a răspunde întrebărilor tale și pentru a te ajuta cu orice informații de care ai nevoie.
                </p>
              </motion.div>

              <div className="grid lg:grid-cols-2 gap-16">
                {/* Contact Information */}
                <motion.div
                  variants={cardVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="bg-white rounded-2xl shadow-xl p-8 lg:p-10"
                  whileHover={{ scale: 1.01, boxShadow: "0 8px 32px 0 rgba(99,102,241,0.10)" }}
                  transition={{ type: "spring", stiffness: 200, damping: 20 }}
                >
                  <h3 className="text-2xl font-bold text-gray-900 mb-8">Informații de Contact</h3>
                  <div className="space-y-8">
                    {/* Address */}
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                          <MapPin className="w-6 h-6 text-blue-600" />
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Adresa</h4>
                        <p className="text-gray-600 leading-relaxed">
                          Str. Stavropoleos nr. 6, et. 4
                          <br />
                          Sector 3, București
                          <br />
                          Cod poștal 030084
                        </p>
                      </div>
                    </div>
                    {/* Phone */}
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                          <Phone className="w-6 h-6 text-green-600" />
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Telefon</h4>
                        <a
                          href="tel:+40213153415"
                          className="text-gray-600 hover:text-green-600 transition-colors"
                          aria-label="Telefon: 004 021 315 34 15"
                        >
                          004 021 315 34 15
                        </a>
                      </div>
                    </div>
                    {/* Email */}
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                          <Mail className="w-6 h-6 text-purple-600" />
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Email</h4>
                        <a
                          href="mailto:office@frds.ro"
                          className="text-gray-600 hover:text-purple-600 transition-colors"
                          aria-label="Email: office@frds.ro"
                        >
                          office@frds.ro
                        </a>
                      </div>
                    </div>
                    {/* Map */}
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                          <Map className="w-6 h-6 text-emerald-600" />
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Harta</h4>
                        <a
                          href="https://goo.gl/maps/XXXXX"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-600 hover:text-emerald-600 transition-colors"
                          aria-label="Deschide harta în Google Maps"
                        >
                          Vezi harta
                        </a>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-center space-x-6 flex-wrap gap-4 sm:gap-6 mt-10">
                    <iframe
                      title="Harta locației FRDS"
                      src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d423.5161818970296!2d26.099141042936626!3d44.431810140905384!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x40b1ff4063762393%3A0x5e6f3fa08b6cd89c!2sFRDS!5e0!3m2!1sro!2sro!4v1751536959805!5m2!1sro!2sro"
                      width="400"
                      height="400"
                      style={{ border: 0 }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    ></iframe>
                  </div>
                </motion.div>
                {/* Contact Form */}
                <motion.div
                  variants={cardVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="bg-white rounded-2xl shadow-xl p-8 lg:p-10"
                  whileHover={{ scale: 1.01, boxShadow: "0 8px 32px 0 rgba(99,102,241,0.10)" }}
                  transition={{ type: "spring", stiffness: 200, damping: 20 }}
                >
                  <h3 className="text-2xl font-bold text-gray-900 mb-8">Trimite-ne un mesaj</h3>
                  <form className="space-y-6" onSubmit={handleSubmit} noValidate>
                    <div className="grid sm:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">Prenume</label>
                        <input
                          type="text"
                          id="firstName"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg text-black focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          placeholder="Prenumele tău"
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">Nume</label>
                        <input
                          type="text"
                          id="lastName"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg text-black focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          placeholder="Numele tău"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg text-black focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="email@exemplu.com"
                        required
                        aria-describedby="emailHelp"
                      />
                    </div>
                    {/* Dropdown Tip Problemă */}
                    <div>
                      <label htmlFor="problemType" className="block text-sm font-medium text-black mb-2">Tip Problemă</label>
                      <select
                        id="problemType"
                        name="problemType"
                        value={problemType}
                        onChange={(e) => {
                          const selected = e.target.value;
                          setProblemType(selected);
                          setFormData((prev) => ({
                            ...prev,
                            subject: selected ? `[${selected}] ` : "",
                          }));
                        }}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg text-black bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        required
                      >
                        {problemTypes.map((option) => (
                          <option key={option.value} value={option.value} className="text-black bg-white">
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">Subiect</label>
                      <input
                        type="text"
                        id="subject"
                        name="subject"
                        value={formData.subject}
                        onChange={(e) => {
                          if (!problemType) {
                            setFormData((prev) => ({
                              ...prev,
                              subject: e.target.value,
                            }));
                            return;
                          }
                          const tag = `[${problemType}] `;
                          let value = e.target.value;
                          if (!value.startsWith(tag)) {
                            value = tag + value.replace(/^\[.*?\]\s?/, "");
                          }
                          setFormData((prev) => ({
                            ...prev,
                            subject: value,
                          }));
                        }}
                        onSelect={(e) => {
                          if (!problemType) return;
                          const tag = `[${problemType}] `;
                          const input = e.target as HTMLInputElement;
                          if (input.selectionStart! < tag.length) {
                            setTimeout(() => {
                              input.setSelectionRange(tag.length, tag.length);
                            }, 0);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (!problemType) return;
                          const tag = `[${problemType}] `;
                          const input = e.target as HTMLInputElement;
                          if (
                            (e.key === "Backspace" && input.selectionStart! <= tag.length) ||
                            (e.key === "Delete" && input.selectionStart! < tag.length)
                          ) {
                            e.preventDefault();
                            setTimeout(() => {
                              input.setSelectionRange(tag.length, tag.length);
                            }, 0);
                          }
                        }}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg text-black focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="Subiectul mesajului"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">Mesaj</label>
                      <textarea
                        id="message"
                        name="message"
                        rows={5}
                        value={formData.message}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 text-black focus:ring-blue-500 focus:border-transparent transition-all resize-vertical"
                        placeholder="Scrie mesajul tău aici..."
                        required
                      ></textarea>
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all transform hover:scale-[1.02]"
                    >
                      Trimite Mesajul
                    </button>
                  </form>
                </motion.div>
              </div>
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
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">Rămâi conectat</h3>
                  <p className="text-gray-600">
                    Urmărește-ne pe rețelele sociale pentru cele mai recente actualizări
                  </p>
                </div>
                <div className="flex justify-center space-x-6">
                  <a href="https://www.facebook.com/FondulRoman" target="_blank" rel="noopener noreferrer" className="group">
                    <Facebook size={40} className="text-blue-600 group-hover:text-blue-700 transition-colors" aria-label="Facebook" />
                  </a>
                  <a href="https://x.com/LocalDevProgram" target="_blank" rel="noopener noreferrer" className="group">
                    <Twitter size={40} className="text-blue-400 group-hover:text-blue-500 transition-colors" aria-label="Twitter" />
                  </a>
                  <a href="https://www.linkedin.com/company/fondul-roman-de-dezvoltare-sociala" target="_blank" rel="noopener noreferrer" className="group">
                    <Linkedin size={40} className="text-blue-700 group-hover:text-blue-800 transition-colors" aria-label="LinkedIn" />
                  </a>
                  <a href="https://www.youtube.com/channel/UCLbFJ3PIv5f_DSvQL2qSypg?view_as=subscriber" target="_blank" rel="noopener noreferrer" className="group">
                    <Youtube size={40} className="text-red-600 group-hover:text-red-700 transition-colors" aria-label="YouTube" />
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
                    <a href="mailto:office@frds.ro" className="text-gray-400 hover:text-white transition-colors" aria-label="Trimite email către office@frds.ro">Contact</a>
                    <a href="https://www.frds.ro" className="text-gray-400 hover:text-white transition-colors" aria-label="Pagina Despre noi FRDS">Despre noi</a>
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

export default ContactPage;
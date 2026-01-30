"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from "framer-motion";
import {
  Facebook, Twitter, Linkedin, Youtube, Info, Phone, Mail, User, Lock, Eye, EyeOff, Key, Settings, Save, MapPin,
  Menu, X, Home, Clipboard, Shield, Megaphone, LogOut, ScrollText,Notebook,
} from "lucide-react";
import Image from "next/image";

interface UserData {
  username: string;
  email: string;
  id?: string;
  cod_proiect?: string;
  telefon?: string;
  judet?: string;
  localitate?: string;
}

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

const ProfilePage = () => {
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [menuState, setMenuState] = useState<MenuState>("closed");
  const [formData, setFormData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPage, setShowPage] = useState(true);

  const router = useRouter();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Ia userul logat din /api/me (ca la /home)
        const resMe = await fetch('/api/me', { credentials: 'include' });
        const dataMe = await resMe.json();

        if (!dataMe.success || !dataMe.user || !dataMe.user.id) {
          setShowPage(false);
          setTimeout(() => router.push('/login'), 500);
          return;
        }

        // Ia detaliile userului din /api/users/[id] (cu cookie)
        const res = await fetch(`/api/users/${dataMe.user.id}`, {
          credentials: "include"
        });

        const data = await res.json();

        if (res.ok && data && data.data && data.data.user) {
          setUserData(data.data.user);
        } else {
          setShowPage(false);
          setTimeout(() => router.push('/login'), 500);
        }
      } catch (error) {
        setShowPage(false);
        setTimeout(() => router.push('/login'), 500);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [router]);

  useEffect(() => {
    if (passwordSuccess) {
      const timer = setTimeout(() => {
        setPasswordSuccess('');
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [passwordSuccess]);

  const validatePassword = (password: string) => {
    const minLength = password.length >= 8;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return minLength && hasUpper && hasLower && hasNumber && hasSpecial;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (passwordError) setPasswordError('');
    if (passwordSuccess) setPasswordSuccess('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!formData.oldPassword || !formData.newPassword || !formData.confirmPassword) {
      setPasswordError('Toate câmpurile sunt obligatorii');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setPasswordError('Parolele noi nu se potrivesc');
      return;
    }

    if (!validatePassword(formData.newPassword)) {
      setPasswordError('Parola nouă nu respectă cerințele de siguranță');
      return;
    }

    if (formData.oldPassword === formData.newPassword) {
      setPasswordError('Parola nouă trebuie să fie diferită de cea veche');
      return;
    }

    setIsChangingPassword(true);

    try {
      // Trimite request cu cookie (fără Authorization)
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: "include",
        body: JSON.stringify({
          oldPassword: formData.oldPassword,
          newPassword: formData.newPassword,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setPasswordSuccess('Parola a fost schimbată cu succes!');
        resetForm();
      } else {
        setPasswordError(data.error || 'Eroare la schimbarea parolei');
      }
    } catch (error) {
      setPasswordError('Eroare de conexiune. Încearcă din nou.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const resetForm = () => {
    setFormData({
      oldPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setPasswordError('');
    setPasswordSuccess('');
  };

  const handleLogout = () => {
    // Pentru logout, poți apela un endpoint de logout care șterge cookie-ul, sau doar redirect
    setShowPage(false);
    setTimeout(() => router.push('/login'), 500);
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

  if (!userData) {
    return null;
  }

  return (
    <AnimatePresence mode="wait">
      {showPage && (
        <motion.div
          key="profile-page"
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50"
        >
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.7 }}
            className="bg-white shadow-lg relative z-10"
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <div className="flex items-center justify-between">
                <div className="w-12"></div>
                <h1 className="text-xl font-bold text-gray-900 drop-shadow-md flex-1 text-center">
                  Profilul Meu
                </h1>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={handleLogout}
                    className="text-red-600 hover:text-red-800 transition-colors font-medium"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </motion.div>

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
            className="transition-all duration-300 ease-in-out"
            animate={{
              paddingLeft: menuState === "closed" ? "0" : "280px",
            }}
          >
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
              {/* Hero Section */}
              <motion.div
                variants={cardVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="text-center mb-16"
              >
                <div className="flex justify-center mb-6">
                  <motion.div
                    whileHover={{ scale: 1.08 }}
                    className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center shadow-lg"
                  >
                    <User className="w-10 h-10 text-blue-600" />
                  </motion.div>
                </div>
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.2 }}
                  className="text-4xl font-bold text-gray-900 mb-4"
                >
                  Profilul Meu
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.4 }}
                  className="text-xl text-gray-600 max-w-3xl mx-auto"
                >
                  Bună ziua, {userData.username}! Gestionează informațiile și setările contului tău
                </motion.p>
              </motion.div>

              {/* Profile Information Card */}
              <motion.div
                variants={cardVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="bg-white rounded-2xl shadow-xl p-8 lg:p-12 mb-8"
                whileHover={{ scale: 1.01, boxShadow: "0 8px 32px 0 rgba(99,102,241,0.10)" }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
              >
                <div className="mb-10">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <Settings className="w-5 h-5 text-green-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">Informații Profil</h3>
                  </div>
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Username */}
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <User className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">Username</h4>
                        <p className="text-gray-600 text-sm">{userData.username}</p>
                      </div>
                    </div>
                    {/* Email */}
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Mail className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">Email</h4>
                        <p className="text-gray-600 text-sm">{userData.email}</p>
                      </div>
                    </div>
                    {/* Cod Proiect */}
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Info className="w-5 h-5 text-yellow-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">Cod Proiect</h4>
                        <p className="text-gray-600 text-sm">{userData.cod_proiect || 'N/A'}</p>
                      </div>
                    </div>
                    {/* Telefon */}
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Phone className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">Telefon</h4>
                        <p className="text-gray-600 text-sm">{userData.telefon || 'N/A'}</p>
                      </div>
                    </div>
                    {/* Adresă */}
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-5 h-5 text-pink-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">Adresă</h4>
                        <p className="text-gray-600 text-sm">
                          {userData.judet && userData.localitate ? `${userData.judet}, ${userData.localitate}` : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Password Change Card */}
              <motion.div
                variants={cardVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="bg-white rounded-2xl shadow-xl p-8 lg:p-12 mb-12"
                whileHover={{ scale: 1.01, boxShadow: "0 8px 32px 0 rgba(99,102,241,0.10)" }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
              >
                <div className="mb-8">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                      <Key className="w-5 h-5 text-red-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">Schimbare Parolă</h3>
                  </div>
                  <p className="text-gray-700 leading-relaxed">
                    Pentru siguranța contului tău, te rugăm să folosești o parolă puternică care să conțină cel puțin 8 caractere.
                  </p>
                </div>
                {passwordSuccess && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg"
                  >
                    <p className="text-green-800 font-medium">{passwordSuccess}</p>
                  </motion.div>
                )}
                {passwordError && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg"
                  >
                    <p className="text-red-800 font-medium">{passwordError}</p>
                  </motion.div>
                )}
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Old Password */}
                  <div>
                    <label htmlFor="oldPassword" className="block text-sm font-medium text-gray-700 mb-2">
                      Parola Actuală
                    </label>
                    <div className="relative">
                      <input
                        type={showOldPassword ? "text" : "password"}
                        id="oldPassword"
                        name="oldPassword"
                        value={formData.oldPassword}
                        onChange={handleInputChange}
                        disabled={isChangingPassword}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors pr-12 disabled:opacity-50 text-black"
                        placeholder="Introdu parola actuală"
                      />
                      <button
                        type="button"
                        onClick={() => setShowOldPassword(!showOldPassword)}
                        aria-label={showOldPassword ? "Ascunde parola actuală" : "Arată parola actuală"}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 p-2 rounded"
                        style={{ minWidth: 40, minHeight: 40 }}
                      >
                        {showOldPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>
                  {/* New Password */}
                  <div>
                    <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                      Parola Nouă
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        id="newPassword"
                        name="newPassword"
                        value={formData.newPassword}
                        onChange={handleInputChange}
                        disabled={isChangingPassword}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors pr-12 disabled:opacity-50 text-black"
                        placeholder="Introdu parola nouă"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        aria-label={showNewPassword ? "Ascunde parola nouă" : "Arată parola nouă"}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 p-2 rounded"
                        style={{ minWidth: 40, minHeight: 40 }}
                      >
                        {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>
                  {/* Confirm New Password */}
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                      Confirmă Parola Nouă
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        id="confirmPassword"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        disabled={isChangingPassword}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors pr-12 disabled:opacity-50 text-black"
                        placeholder="Confirmă parola nouă"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        aria-label={showConfirmPassword ? "Ascunde confirmarea parolei" : "Arată confirmarea parolei"}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 p-2 rounded"
                        style={{ minWidth: 40, minHeight: 40 }}
                      >
                        {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>
                  {/* Password Requirements */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-800 mb-2">Cerințe pentru parolă:</h4>
                    <ul className="text-blue-700 text-sm space-y-1">
                      <li>• Minimum 8 caractere</li>
                      <li>• Cel puțin o literă mare</li>
                      <li>• Cel puțin o literă mică</li>
                      <li>• Cel puțin un număr</li>
                      <li>• Cel puțin un caracter special</li>
                    </ul>
                  </div>
                  {/* Buttons */}
                  <div className="flex space-x-4 pt-6">
                    <button
                      type="submit"
                      disabled={isChangingPassword}
                      className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Save size={20} />
                      <span>{isChangingPassword ? 'Se schimbă...' : 'Schimbă Parola'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={resetForm}
                      disabled={isChangingPassword}
                      className="flex-1 bg-gray-200 text-gray-800 py-3 px-6 rounded-lg font-medium hover:bg-gray-300 transition-colors disabled:opacity-50"
                    >
                      Anulează
                    </button>
                  </div>
                </form>
                <div className="mt-8 p-6 bg-yellow-50 border border-yellow-200 rounded-xl">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                      <Lock className="w-4 h-4 text-yellow-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-yellow-800 mb-2">Siguranță</h4>
                      <p className="text-yellow-700 text-sm leading-relaxed">
                        Nu partaja niciodată parola ta cu alte persoane. Echipa FRDS nu îți va cere niciodată parola prin email sau telefon.
                      </p>
                    </div>
                  </div>
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
          </motion.div>

          {/* Footer */}
          <footer className="bg-white border-t border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row items-center justify-between">
              <a href="/home" className="flex items-center space-x-3 hover:opacity-90 transition-opacity mb-4 md:mb-0">
                <Image
                  src="/logo.webp"
                  alt="FRDS Logo"
                  width={80}
                  height={80}
                  className="w-20 h-20 object-contain rounded-lg shadow-lg"
                  priority
                />
                <span className="text-lg font-semibold text-gray-900">FRDS</span>
              </a>
              <p className="text-sm text-gray-500 max-w-md text-center md:text-left">
                FRDS - Fondul Roman de Dezvoltare Socială | 2023-2025. Toate drepturile rezervate.
              </p>
              <Image
                src="/images-removebg-preview.webp"
                alt="Imagine FRDS"
                width={160}
                height={160}
                className="max-w-full max-h-[120vh] object-contain opacity-50"
              />
            </div>
          </footer>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ProfilePage;
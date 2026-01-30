"use client";
import Image from "next/image";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [show, setShow] = useState(true);
  const [shake, setShake] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setShake(false);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user, password }),
        credentials: 'include', // <-- esențial pentru cookie!
      });
      const data = await response.json();

      if (data.success) {
        // Setează cookie-ul și din JS (universal fix pentru mobile localhost)
        if (data.token) {
          document.cookie = `authToken=${data.token}; path=/; max-age=604800; samesite=lax`;
        }
        setShow(false);
        setTimeout(() => router.push("/home"), 800);
      } else {
        setError(data.error || "Eroare la autentificare");
        setShake(true);
        setTimeout(() => setShake(false), 600);
      }
    } catch (err) {
      setError("Eroare de conexiune. Încearcă din nou.");
      setShake(true);
      setTimeout(() => setShake(false), 600);
    } finally {
      setIsLoading(false);
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 60, scale: 0.98 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.8 }
    },
    exit: {
      opacity: 0,
      scale: 1.05,
      transition: { duration: 0.5 }
    },
    shake: {
      x: [0, -10, 10, -10, 10, 0],
      transition: { duration: 0.5 }
    },
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.main
          className="relative flex min-h-screen items-center justify-center overflow-hidden"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.7, ease: "easeInOut" }}
        >
          {/* Background cu gradient animat */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/60 via-purple-900/60 to-indigo-900/60">
            <div
              className="absolute inset-0 opacity-90"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
              }}
            ></div>
          </div>

          {/* Bule animate cu parallax */}
          <motion.div
            className="absolute top-0 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-50"
            animate={{ scale: [1, 1.1, 0.9, 1], x: [0, 30, -20, 0], y: [0, -50, 20, 0] }}
            transition={{ repeat: Infinity, duration: 7, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute top-0 -right-4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-80"
            animate={{ scale: [1, 1.1, 0.9, 1], x: [0, 30, -20, 0], y: [0, -50, 20, 0] }}
            transition={{ repeat: Infinity, duration: 7, ease: "easeInOut", delay: 2 }}
          />
          <motion.div
            className="absolute -bottom-8 left-20 w-72 h-72 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-80"
            animate={{ scale: [1, 1.1, 0.9, 1], x: [0, 30, -20, 0], y: [0, -50, 20, 0] }}
            transition={{ repeat: Infinity, duration: 7, ease: "easeInOut", delay: 4 }}
          />

          {/* Card principal cu animatii */}
          <motion.div
            className="relative z-10 w-full max-w-md px-4"
            variants={cardVariants}
            initial="hidden"
            animate={shake ? "shake" : "visible"}
            exit="exit"
          >
            {/* Logo */}
            <motion.div
              initial={{ opacity: 0, y: -30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.7 }}
              className="mb-8 text-center"
            >
              <Image
                src="/logo.webp"
                alt="Logo"
                width={80}
                height={80}
                className="mx-auto h-40 w-auto mb-4 drop-shadow-2xl"
                priority
              />
              <h1 className="text-4xl font-bold text-white mb-2 tracking-tight drop-shadow-lg">MIS FRDS</h1>
            </motion.div>

            {/* Form container cu glassmorphism */}
            <motion.form
              onSubmit={handleSubmit}
              className="backdrop-blur-lg bg-white/10 rounded-2xl shadow-2xl border border-white/20 p-8"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.7 }}
            >
              <AnimatePresence>
                {error && (
                  <motion.div
                    className="mb-6 p-4 text-sm text-red-200 bg-red-500/20 backdrop-blur border border-red-500/30 rounded-lg"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5, duration: 0.6 }}
                >
                  <label htmlFor="user" className="block text-sm font-medium text-blue-100 mb-2">
                    Utilizator
                  </label>
                  <input
                    type="text"
                    id="user"
                    value={user}
                    onChange={(e) => setUser(e.target.value)}
                    placeholder="Introdu numele de utilizator"
                    required
                    disabled={isLoading}
                    className="w-full px-4 py-3 bg-white/10 backdrop-blur border border-white/20 rounded-lg text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition duration-200 disabled:opacity-50 hover:shadow-[0_0_0_2px_#7c3aed] focus:shadow-[0_0_0_4px_#6366f1]"
                  />
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6, duration: 0.6 }}
                >
                  <label htmlFor="password" className="block text-sm font-medium text-blue-100 mb-2">
                    Parolă
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      disabled={isLoading}
                      className="w-full px-4 py-3 bg-white/10 backdrop-blur border border-white/20 rounded-lg text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition duration-200 disabled:opacity-50 hover:shadow-[0_0_0_2px_#7c3aed] focus:shadow-[0_0_0_4px_#6366f1] pr-12"
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-200 hover:text-white transition"
                      aria-label={showPassword ? "Ascunde parola" : "Afișează parola"}
                    >
                      {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
                    </button>
                  </div>
                </motion.div>
              </div>

              <motion.div
                className="mt-4 mb-6 text-right"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.5 }}
              >
                <a href="/forgot-password" className="text-sm text-blue-200 hover:text-white transition duration-200">
                  Ai uitat parola?
                </a>
              </motion.div>

              <motion.button
                type="submit"
                disabled={isLoading}
                whileHover={{ scale: 1.04, boxShadow: "0 0 16px #6366f1" }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Se încarcă...
                  </span>
                ) : 'Autentificare'}
              </motion.button>
            </motion.form>
          </motion.div>
        </motion.main>
      )}
    </AnimatePresence>
  );
}
"use client";
import Image from "next/image";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export default function ForgotPasswordPage() {
  const [user, setUser] = useState("");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [developmentToken, setDevelopmentToken] = useState("");
  const [showPage, setShowPage] = useState(true);

  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");
    setDevelopmentToken("");

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: user,
          email: email
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(data.message);
        if (data.developmentToken) {
          setDevelopmentToken(data.developmentToken);
        }
        setUser("");
        setEmail("");
      } else {
        setError(data.error || 'Eroare la procesarea cererii');
      }
    } catch (err) {
      setError('Eroare de conexiune. Încearcă din nou.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fade in/out pentru pagină și card
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

  return (
    <AnimatePresence mode="wait">
      {showPage && (
        <motion.main
          key="forgot-page"
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="relative flex min-h-screen items-center justify-center overflow-hidden"
        >
          {/* Background cu gradient animat */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
            <div className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
              }}
            ></div>
          </div>

          {/* Bule animate */}
          <motion.div
            className="absolute top-0 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20"
            animate={{ scale: [1, 1.1, 0.9, 1], x: [0, 30, -20, 0], y: [0, -50, 20, 0] }}
            transition={{ repeat: Infinity, duration: 7, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute top-0 -right-4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20"
            animate={{ scale: [1, 1.1, 0.9, 1], x: [0, 30, -20, 0], y: [0, -50, 20, 0] }}
            transition={{ repeat: Infinity, duration: 7, ease: "easeInOut", delay: 2 }}
          />
          <motion.div
            className="absolute -bottom-8 left-20 w-72 h-72 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-20"
            animate={{ scale: [1, 1.1, 0.9, 1], x: [0, 30, -20, 0], y: [0, -50, 20, 0] }}
            transition={{ repeat: Infinity, duration: 7, ease: "easeInOut", delay: 4 }}
          />

          {/* Container principal */}
          <motion.div
            className="relative z-10 w-full max-w-md px-4"
            variants={cardVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            {/* Logo */}
            <div className="mb-8 text-center">
              <Image
                src="/logo.webp"
                alt="FRDS Logo"
                width={146}
                height={86}
                className="mx-auto mb-4 drop-shadow-2xl"
                priority
              />
              <h1 className="text-4xl font-bold text-white mb-2">Resetare Parolă</h1>
            </div>

            {/* Form container cu glassmorphism */}
            <form
              onSubmit={handleSubmit}
              className="backdrop-blur-lg bg-white/10 rounded-2xl shadow-2xl border border-white/20 p-8"
            >
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="mb-6 p-4 text-sm text-red-200 bg-red-500/20 backdrop-blur border border-red-500/30 rounded-lg"
                >
                  {error}
                </motion.div>
              )}

              {success && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="mb-6 p-4 text-sm text-green-200 bg-green-500/20 backdrop-blur border border-green-500/30 rounded-lg"
                >
                  {success}
                </motion.div>
              )}

              {developmentToken && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="mb-6 p-4 text-sm text-yellow-200 bg-yellow-500/20 backdrop-blur border border-yellow-500/30 rounded-lg"
                >
                  <strong>Development Token:</strong><br />
                  <code className="break-all text-xs">{developmentToken}</code>
                </motion.div>
              )}

              <div className="space-y-6">
                <div>
                  <label
                    htmlFor="user"
                    className="block text-sm font-medium text-blue-100 mb-2"
                  >
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
                    className="w-full px-4 py-3 bg-white/10 backdrop-blur border border-white/20 rounded-lg text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition duration-200 disabled:opacity-50"
                  />
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-blue-100 mb-2"
                  >
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@exemplu.com"
                    required
                    disabled={isLoading}
                    className="w-full px-4 py-3 bg-white/10 backdrop-blur border border-white/20 rounded-lg text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition duration-200 disabled:opacity-50"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="mt-8 w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Se procesează...
                  </span>
                ) : 'Resetare parolă'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowPage(false);
                  setTimeout(() => router.push("/login"), 500);
                }}
                disabled={isLoading}
                className="mt-4 w-full py-3 px-4 bg-white/10 backdrop-blur border border-white/20 text-white font-medium rounded-lg hover:bg-white/20 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/50 disabled:opacity-50"
              >
                Înapoi la autentificare
              </button>
            </form>
          </motion.div>

          <style jsx>{`
            @keyframes blob {
              0% {
                transform: translate(0px, 0px) scale(1);
              }
              33% {
                transform: translate(30px, -50px) scale(1.1);
              }
              66% {
                transform: translate(-20px, 20px) scale(0.9);
              }
              100% {
                transform: translate(0px, 0px) scale(1);
              }
            }
            .animate-blob {
              animation: blob 7s infinite;
            }
            .animation-delay-2000 {
              animation-delay: 2s;
            }
            .animation-delay-4000 {
              animation-delay: 4s;
            }
          `}</style>
        </motion.main>
      )}
    </AnimatePresence>
  );
}
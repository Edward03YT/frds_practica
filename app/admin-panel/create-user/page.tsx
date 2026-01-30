"use client";

import React, { useEffect, useState } from "react";
import { Plus, Home, User, ArrowLeft, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

interface NewUser {
  username: string;
  name: string;
  email: string;
  password: string;
  is_admin: boolean;
  is_moderator: boolean;
  cod_proiect: string;
  localitate: string;
  judet: string;
  telefon: string;
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

export default function UserCreate() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [newUser, setNewUser] = useState<NewUser>({
    username: "",
    name: "",
    email: "",
    password: "",
    is_admin: false,
    is_moderator: false,
    cod_proiect: "",
    localitate: "",
    judet: "",
    telefon: "",
  });

  // Verifică dacă userul este admin (corect, din backend)
  useEffect(() => {
    async function checkAdmin() {
      try {
        const res = await fetch('/api/me', { credentials: 'include' });
        const data = await res.json();
        if (!data.success || !data.user || !data.user.is_admin) {
          router.replace('/home');
        }
      } catch {
        router.replace('/home');
      }
    }
    checkAdmin();
  }, [router]);

  const [showPassword, setShowPassword] = useState(false);

  async function addUser() {
    if (
      !newUser.username.trim() ||
      !newUser.name.trim() ||
      !newUser.email.trim() ||
      !newUser.password.trim() ||
      !newUser.cod_proiect.trim() ||
      !newUser.localitate.trim() ||
      !newUser.judet.trim() ||
      !newUser.telefon.trim()
    ) {
      alert("Completează toate câmpurile");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser),
      });
      const json = await res.json();

      if (json.success) {
        alert("Utilizator adăugat cu succes!");
        setNewUser({
          username: "",
          name: "",
          email: "",
          password: "",
          is_admin: false,
          is_moderator: false,
          cod_proiect: "",
          localitate: "",
          judet: "",
          telefon: "",
        });
      } else {
        alert(json.error || "Eroare la adăugarea utilizatorului");
      }
    } catch {
      alert("Eroare la comunicarea cu serverul");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="user-create-page"
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="min-h-screen bg-gray-50 text-gray-900 px-6 py-8"
      >
        {/* Header */}
        <motion.div
          variants={cardVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="flex justify-between items-center mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Creează Utilizator Nou</h1>
            <p className="text-gray-600 mt-2">Adaugă un utilizator nou în sistem</p>
          </div>
          <div className="flex gap-3">
            <Link href="/admin-panel">
              <button className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors">
                <ArrowLeft size={18} />
                Administrare Utilizatori
              </button>
            </Link>
            <Link href="/home">
              <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                <Home size={18} />
                Acasă
              </button>
            </Link>
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="max-w-2xl mx-auto">
          <motion.div
            variants={cardVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="bg-white p-8 rounded-lg shadow-sm border"
          >
            <div className="flex items-center mb-6">
              <div className="flex-shrink-0 h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <User className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <h2 className="text-xl font-semibold text-gray-900">Informații Utilizator</h2>
                <p className="text-gray-600">Completează toate câmpurile pentru a crea un utilizator nou</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Informații de bază */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Informații de Bază</h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Username *
                  </label>
                  <input
                    type="text"
                    placeholder="Username"
                    value={newUser.username}
                    onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nume complet *
                  </label>
                  <input
                    type="text"
                    placeholder="Nume complet"
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    placeholder="Email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Parolă *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Parolă"
                      value={newUser.password}
                      onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 p-1"
                      tabIndex={-1}
                      aria-label={showPassword ? "Ascunde parola" : "Arată parola"}
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center space-x-6">
                  <div className="flex items-center">
                    <input
                      id="is_admin"
                      type="checkbox"
                      checked={newUser.is_admin}
                      onChange={(e) => setNewUser({ ...newUser, is_admin: e.target.checked })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="is_admin" className="ml-2 block text-sm text-gray-900">
                      Administrator
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      id="is_moderator"
                      type="checkbox"
                      checked={newUser.is_moderator}
                      onChange={(e) => setNewUser({ ...newUser, is_moderator: e.target.checked })}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <label htmlFor="is_moderator" className="ml-2 block text-sm text-gray-900">
                      Moderator
                    </label>
                  </div>
                </div>
              </div>

              {/* Informații proiect */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Informații Proiect</h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cod Proiect *
                  </label>
                  <input
                    type="text"
                    placeholder="Cod Proiect"
                    value={newUser.cod_proiect}
                    onChange={(e) => setNewUser({ ...newUser, cod_proiect: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Localitate *
                  </label>
                  <input
                    type="text"
                    placeholder="Localitate"
                    value={newUser.localitate}
                    onChange={(e) => setNewUser({ ...newUser, localitate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Județ *
                  </label>
                  <input
                    type="text"
                    placeholder="Județ"
                    value={newUser.judet}
                    onChange={(e) => setNewUser({ ...newUser, judet: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Telefon *
                  </label>
                  <input
                    type="text"
                    placeholder="Telefon"
                    value={newUser.telefon}
                    onChange={(e) => setNewUser({ ...newUser, telefon: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Note */}
            <div className="mt-6 p-4 bg-blue-50 rounded-md">
              <p className="text-sm text-blue-800">
                <strong>Notă:</strong> Toate câmpurile marcate cu * sunt obligatorii. Utilizatorul va primi credențialele de conectare pe email.
              </p>
            </div>

            {/* Submit Button */}
            <div className="mt-8 flex justify-end gap-4">
              <Link href="/admin-panel/">
                <button
                  type="button"
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Anulează
                </button>
              </Link>
              <button
                onClick={addUser}
                disabled={loading}
                className="flex items-center justify-center px-6 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-700 hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Se procesează...
                  </>
                ) : (
                  <>
                    <Plus size={16} className="mr-2" />
                    Creează Utilizator
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  FileText,
  Calendar,
  User,
  Mail,
  Globe,
  Trash2,
  Download,
  FolderOpen,
  AlertCircle,
  Phone,
  MapPin,
  Megaphone,
  Eye,
  EyeOff,
  KeyRound
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Upload {
  id: number;
  file_name: string;
  page: string;
  uploaded_at: string;
}

interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  is_admin: number;
  is_moderator: number;
  created_at: string;
  updated_at: string;
  last_ip?: string;
  password: string;
  cod_proiect: string;
  localitate: string;
  judet: string;
  telefon: string;
}

interface UploadStats {
  total_files: number;
  pages_used: number;
  first_upload: string;
  last_upload: string;
}

interface UserDetailData {
  user: User;
  uploads: Upload[];
  uploadStats: UploadStats;
  filesByPage: { [key: string]: Upload[] };
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

// Funcție pentru formatarea datelor cu ajustarea de fus orar (+3 ore pentru România)
function formatDate(dateString: string): string {
  if (!dateString) return "N/A";
  const match = dateString.match(/^(\d{2})\.(\d{2})\.(\d{4}), (\d{2}):(\d{2}):(\d{2})$/);
  if (match) {
    const [, zi, luna, an, ora, minut, secunda] = match;
    const dateUTC = new Date(Date.UTC(
      parseInt(an, 10),
      parseInt(luna, 10) - 1,
      parseInt(zi, 10),
      parseInt(ora, 10),
      parseInt(minut, 10),
      parseInt(secunda, 10)
    ));
    const dateRO = new Date(dateUTC.getTime() + 3 * 60 * 60 * 1000);
    return dateRO.toLocaleString("ro-RO", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
  }
  let d = new Date(dateString);
  if (isNaN(d.getTime())) {
    d = new Date(dateString.replace(" ", "T"));
  }
  if (isNaN(d.getTime())) return "N/A";
  const dRO = new Date(d.getTime() + 3 * 60 * 60 * 1000);
  return dRO.toLocaleString("ro-RO", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
}

// Funcție pentru formatarea datelor fără ajustarea de fus orar (UTC)
function formatDateUTC(dateString: string): string {
  if (!dateString) return "N/A";
  const match = dateString.match(/^(\d{2})\.(\d{2})\.(\d{4}), (\d{2}):(\d{2}):(\d{2})$/);
  if (match) {
    const [, zi, luna, an, ora, minut, secunda] = match;
    const dateUTC = new Date(Date.UTC(
      parseInt(an, 10),
      parseInt(luna, 10) - 1,
      parseInt(zi, 10),
      parseInt(ora, 10),
      parseInt(minut, 10),
      parseInt(secunda, 10)
    ));
    return dateUTC.toLocaleString("ro-RO", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
  }
  let d = new Date(dateString);
  if (isNaN(d.getTime())) {
    d = new Date(dateString.replace(" ", "T"));
  }
  if (isNaN(d.getTime())) return "N/A";
  return d.toLocaleString("ro-RO", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
}

function AnnouncementSection({ userId }: { userId: number }) {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const fetchAnnouncements = async () => {
    setLoading(true);
    const res = await fetch(`/api/user-announcements?userId=${userId}`);
    const data = await res.json();
    if (data.success) setAnnouncements(data.announcements);
    setLoading(false);
  };

  useEffect(() => { fetchAnnouncements(); }, [userId]);

  const handleSend = async () => {
    if (!subject.trim() || !message.trim()) return;
    await fetch("/api/user-announcements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, subject, message }),
    });
    setSubject(""); setMessage("");
    fetchAnnouncements();
  };

  const handleDelete = async (id: number) => {
    await fetch("/api/user-announcements", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchAnnouncements();
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="mt-8 p-4 border-2 border-red-500 rounded-lg bg-red-50"
    >
      <div className="flex items-center mb-2">
        <Megaphone className="text-red-600 mr-2" />
        <span className="font-bold text-red-700">Anunțuri individuale</span>
      </div>
      <div className="flex flex-col md:flex-row gap-2 mb-2">
        <input
          className="border p-2 rounded flex-1 text-black"
          placeholder="Subiect"
          value={subject}
          onChange={e => setSubject(e.target.value)}
        />
        <input
          className="border p-2 rounded flex-1 text-black"
          placeholder="Mesaj"
          value={message}
          onChange={e => setMessage(e.target.value)}
        />
        <button
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          onClick={handleSend}
        >
          Trimite
        </button>
      </div>
      <div>
        {loading ? "Se încarcă..." : (
          announcements.length === 0 ? <div className="text-gray-500">Niciun anunț.</div> :
            announcements.map(a => (
              <div key={a.id} className="flex items-center justify-between border-b py-2">
                <div>
                  <div className="font-semibold text-black">{a.subject}</div>
                  <div className="text-black">{a.message}</div>
                  <div className="text-xs text-black">{formatDate(a.created_at)}</div>
                </div>
                <button onClick={() => handleDelete(a.id)} className="ml-2 text-red-600 hover:text-red-800">
                  <Trash2 />
                </button>
              </div>
            ))
        )}
      </div>
    </motion.div>
  );
}

export default function UserDetailPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;

  const [data, setData] = useState<UserDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPage, setShowPage] = useState(true);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);
  const [changePasswordError, setChangePasswordError] = useState("");
  const [changePasswordSuccess, setChangePasswordSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  // Adaugă state pentru utilizatorul curent (cel logat)
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  async function handleDownload(fileId: number, fileName: string) {
    try {
      const res = await fetch(`/api/files/${fileId}`, {
        method: "GET",
        credentials: "include"
      });
      if (!res.ok) {
        alert("Eroare la descărcare!");
        return;
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      alert("Eroare la descărcare!");
    }
  }

  useEffect(() => {
    const handler = () => {
      fetchUserDetails();
    };
    window.addEventListener("user-files-changed", handler);
    return () => window.removeEventListener("user-files-changed", handler);
  }, [userId]);

  useEffect(() => {
    async function checkAdmin() {
      const res = await fetch('/api/me');
      if (!res.ok) {
        setShowPage(false);
        setTimeout(() => router.replace("/home"), 500);
        return;
      }
      const data = await res.json();
      if (!data.user || (!data.user.is_admin && !data.user.is_moderator)) {
        setShowPage(false);
        setTimeout(() => router.replace("/home"), 500);
        return;
      }
      
      // Salvează informațiile utilizatorului curent
      setCurrentUser(data.user);
      
      fetchUserDetails();
    }
    checkAdmin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  async function fetchUserDetails() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/users/${userId}`);
      const json = await res.json();

      if (json.success) {
        setData(json.data);
      } else {
        setError(json.error || "Eroare la încărcarea detaliilor utilizatorului");
      }
    } catch (err) {
      setError("Eroare la comunicarea cu serverul");
    } finally {
      setLoading(false);
    }
  }

  async function deleteFile(uploadId: number) {
    if (!confirm("Sigur vrei să ștergi acest fișier?")) return;

    try {
      const res = await fetch(`/api/users/${userId}?uploadId=${uploadId}`, {
        method: "DELETE",
      });
      const json = await res.json();

      if (json.success) {
        alert("Fișierul a fost șters cu succes!");
        fetchUserDetails();
        window.dispatchEvent(new Event("user-files-changed"));
      } else {
        alert(json.error || "Eroare la ștergerea fișierului");
      }
    } catch {
      alert("Eroare la comunicarea cu serverul");
    }
  }

  async function deleteAllFiles() {
    if (!confirm("Sigur vrei să ștergi TOATE fișierele acestui utilizator? Această acțiune nu poate fi anulată!")) return;

    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
      });
      const json = await res.json();

      if (json.success) {
        alert("Toate fișierele au fost șterse cu succes!");
        fetchUserDetails();
      } else {
        alert(json.error || "Eroare la ștergerea fișierelor");
      }
    } catch {
      alert("Eroare la comunicarea cu serverul");
    }
  }

  function formatFileSize(bytes: number) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-gray-600">Se încarcă detaliile utilizatorului...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Eroare</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.push("/admin-panel/users")}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <ArrowLeft size={16} className="mr-2" />
            Înapoi la utilizatori
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const { user, uploads, uploadStats, filesByPage } = data;

  return (
    <AnimatePresence mode="wait">
      {showPage && (
        <motion.div
          key="user-detail-page"
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="min-h-screen bg-gray-50 py-8"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <motion.div
              variants={cardVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="mb-8"
            >
              <button
                onClick={() => router.push("/admin-panel")}
                className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
              >
                <ArrowLeft size={20} className="mr-2" />
                Înapoi la utilizatori
              </button>

              <div className="bg-white shadow rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="h-16 w-16 rounded-full bg-gray-300 flex items-center justify-center">
                      <User className="h-8 w-8 text-gray-500" />
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
                      <p className="text-gray-500">@{user.username}</p>
                      <div className="flex items-center mt-2">
                        {user.is_admin ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            <User size={12} className="mr-1" />
                            Administrator
                          </span>
                        ) : user.is_moderator ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                            <User size={12} className="mr-1" />
                            Moderator
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            <User size={12} className="mr-1" />
                            Utilizator
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {uploads.length > 0 && currentUser?.is_admin === 1 && (
                    <button
                      onClick={deleteAllFiles}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                    >
                      <Trash2 size={16} className="mr-2" />
                      Șterge toate fișierele
                    </button>
                  )}
                </div>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="flex items-center space-x-3">
                    <Mail className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Email</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <FileText className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Cod Proiect</p>
                      <p className="text-sm text-gray-500">{user.cod_proiect}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <MapPin className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Adresă</p>
                      <p className="text-sm text-gray-500">{user.judet}, {user.localitate}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Phone className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Telefon</p>
                      <p className="text-sm text-gray-500">{user.telefon}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Globe className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Ultimul IP</p>
                      <p className="text-sm text-gray-500">{user.last_ip || "N/A"}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Membru din</p>
                      <p className="text-sm text-gray-500">{formatDate(user.created_at)}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Ultima activitate</p>
                      <p className="text-sm text-gray-500">{formatDate(user.updated_at)}</p>
                    </div>
                  </div>
                </div>
              </div>
              <AnnouncementSection userId={user.id} />
            </motion.div>

            {/* Statistics */}
            <motion.div
              variants={cardVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"
            >
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <FileText className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total fișiere</p>
                    <p className="text-2xl font-bold text-gray-900">{uploadStats.total_files}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <Calendar className="h-8 w-8 text-orange-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Prima încărcare</p>
                    <p className="text-sm font-bold text-gray-900">
                      {uploadStats.first_upload ? formatDateUTC(uploadStats.first_upload) : "N/A"}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <Calendar className="h-8 w-8 text-purple-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Ultima încărcare</p>
                    <p className="text-sm font-bold text-gray-900">
                      {uploadStats.last_upload ? formatDateUTC(uploadStats.last_upload) : "N/A"}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow flex flex-col items-center justify-center">
                {/* Verifică dacă utilizatorul curent (cel logat) este admin, nu utilizatorul vizualizat */}
                {currentUser?.is_admin === 1 && (
                  <button
                    className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-base font-semibold transition-all duration-150"
                    onClick={() => {
                      setShowChangePassword(true);
                      setChangePasswordError("");
                      setChangePasswordSuccess("");
                      setNewPassword("");
                    }}
                  >
                    <KeyRound size={22} className="mr-1" />
                    Schimbă parola
                  </button>
                )}
              </div>

            </motion.div>

            {/* Files by Page */}
            {Object.keys(filesByPage).length > 0 ? (
              <motion.div
                variants={cardVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="space-y-6"
              >
                {Object.entries(filesByPage).map(([page, files]) => (
                  <div key={page} className="bg-white shadow rounded-lg">
                    <div className="px-6 py-4 border-b border-gray-200">
                      <h3 className="text-lg font-medium text-gray-900">
                        Pagina: {page}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {files.length} fișier{files.length !== 1 ? 'e' : ''}
                      </p>
                    </div>
                    <div className="divide-y divide-gray-200">
                      {files.map((file) => {
                        return (
                          <div key={file.id} className="px-6 py-4 flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <FileText className="h-5 w-5 text-gray-400" />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{file.file_name}</p>
                                <p className="text-sm text-gray-500">
                                  Încărcat la: {formatDateUTC(file.uploaded_at)}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {/* Buton Download */}
                              <button
                                onClick={() => handleDownload(file.id, file.file_name)}
                                className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
                                title="Descarcă fișierul"
                              >
                                <Download size={14} className="mr-1" />
                                Download
                              </button>
                              {/* Buton Șterge doar pentru admin - verifică utilizatorul curent */}
                              {currentUser?.is_admin === 1 && (
                                <button
                                  onClick={() => deleteFile(file.id)}
                                  className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200"
                                >
                                  <Trash2 size={14} className="mr-1" />
                                  Șterge
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}

              </motion.div>
            ) : (
              <motion.div
                variants={cardVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="bg-white shadow rounded-lg p-12"
              >
                <div className="text-center">
                  <FileText className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-4 text-lg font-medium text-gray-900">Niciun fișier încărcat</h3>
                  <p className="mt-2 text-sm text-gray-500">
                    Acest utilizator nu a încărcat încă niciun fișier.
                  </p>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}

      {showChangePassword && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-sm text-black">
            <h3 className="text-lg font-bold mb-4">Schimbă parola utilizatorului</h3>
            <div className="relative mb-3">
              <input
                type={showPassword ? "text" : "password"}
                className="w-full border px-3 py-2 rounded pr-12"
                placeholder="Parolă nouă"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 p-1"
                tabIndex={-1}
                aria-label={showPassword ? "Ascunde parola" : "Arată parola"}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {changePasswordError && (
              <div className="text-red-600 mb-2">{changePasswordError}</div>
            )}
            {changePasswordSuccess && (
              <div className="text-green-600 mb-2">{changePasswordSuccess}</div>
            )}
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 bg-gray-200 rounded"
                onClick={() => setShowChangePassword(false)}
              >
                Anulează
              </button>
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded"
                disabled={changePasswordLoading}
                onClick={async () => {
                  setChangePasswordError("");
                  setChangePasswordSuccess("");
                  if (!newPassword.trim() || newPassword.length < 8) {
                    setChangePasswordError("Parola trebuie să aibă minim 8 caractere.");
                    return;
                  }
                  setChangePasswordLoading(true);
                  try {
                    const res = await fetch(`/api/users/${user.id}/change-password`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ newPassword }),
                    });
                    const data = await res.json();
                    if (data.success) {
                      setChangePasswordSuccess("Parola a fost schimbată cu succes!");
                      setTimeout(() => {
                        setShowChangePassword(false);
                      }, 1500);
                    } else {
                      setChangePasswordError(data.error || "Eroare la schimbarea parolei.");
                    }
                  } catch {
                    setChangePasswordError("Eroare la comunicarea cu serverul.");
                  } finally {
                    setChangePasswordLoading(false);
                  }
                }}
              >
                {changePasswordLoading ? "Se schimbă..." : "Schimbă"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
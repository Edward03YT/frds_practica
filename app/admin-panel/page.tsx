"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Trash2, Home, FolderSearch, FileText, Calendar, User, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { debounce } from "lodash";

interface Upload {
  id: number;
  file_name: string;
  page: string;
  uploaded_at: string;
}

interface UserType {
  id: number;
  username: string;
  name: string;
  email: string;
  is_admin: number;
  is_moderator: number;
  created_at: string;
  updated_at: string;
  last_ip?: string;
  uploaded_files?: Upload[];
  files_count?: number;
  cod_proiect?: string;
  telefon?: string;
  judet?: string;
  localitate?: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface Stats {
  totalUsers: number;
  totalAdmins: number;
  totalFiles: number;
  filteredTotal?: number;
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

export default function AdminUsers() {
  const router = useRouter();

  const [users, setUsers] = useState<UserType[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [userTypeFilter, setUserTypeFilter] = useState<"all" | "admin" | "user" | "moderator">("all");
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [stats, setStats] = useState<Stats | null>(null);
  const [codProiectFilter, setCodProiectFilter] = useState("");
  const [showPage, setShowPage] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isModerator, setIsModerator] = useState(false);

  // Verifică dacă userul e admin (pe baza /api/me, nu localStorage!)
  useEffect(() => {
    async function checkAdmin() {
      try {
        const res = await fetch("/api/me", { credentials: "include" });
        const data = await res.json();
        if (
          !data.success ||
          (!data.user.is_admin && !data.user.is_moderator)
        ) {
          setShowPage(false);
          setTimeout(() => router.replace("/home"), 500);
        } else {
          setIsAdmin(data.user.is_admin === 1);
          setIsModerator(data.user.is_moderator === 1);
        }
      } catch {
        setShowPage(false);
        setTimeout(() => router.replace("/home"), 500);
      }
    }
    checkAdmin();
  }, [router]);

  const buildApiUrl = (pageNumber: number, search: string, filter: string, codProiect: string) => {
    const params = new URLSearchParams({
      page: pageNumber.toString(),
      limit: "10",
    });

    if (search.trim()) {
      params.append("search", search.trim());
    }

    if (filter !== "all") {
      params.append("filter", filter);
    }

    if (codProiect.trim()) {
      params.append("cod_proiect", codProiect.trim());
    }

    return `/api/users?${params.toString()}`;
  };

  async function fetchUsers(
    pageNumber: number,
    search: string = searchTerm,
    filter: string = userTypeFilter,
    codProiect: string = codProiectFilter
  ) {
    setLoading(true);
    try {
      const url = buildApiUrl(pageNumber, search, filter, codProiectFilter);
      const res = await fetch(url, { credentials: "include" }); // trimite cookie-ul JWT
      const json = await res.json();

      if (json.success) {
        setUsers(json.data.users);
        setPagination(json.data.pagination);
        setPage(json.data.pagination.page);
        setStats(json.data.stats);
      } else {
        alert(json.error || "Eroare la încărcarea utilizatorilor");
      }
    } catch {
      alert("Eroare la comunicarea cu serverul");
    }
    setLoading(false);
  }

  const debouncedSearch = useCallback(
    debounce((searchValue: string) => {
      setPage(1);
      fetchUsers(1, searchValue, userTypeFilter);
    }, 500),
    [userTypeFilter]
  );


  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    debouncedSearch(value);
  };
  useEffect(() => {
    fetchUsers(page, searchTerm, userTypeFilter, codProiectFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, userTypeFilter, codProiectFilter]);

  useEffect(() => {
    const handler = () => {
      fetchUsers(page, searchTerm, userTypeFilter, codProiectFilter);
    };
    window.addEventListener("excel-upload-success", handler);
    return () => window.removeEventListener("excel-upload-success", handler);
  }, [page, searchTerm, userTypeFilter, codProiectFilter]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as "all" | "admin" | "user" | "moderator";
    setUserTypeFilter(value);
    setPage(1);
  };

  async function deleteUser(id: number) {
    if (!confirm("Sigur vrei să ștergi acest utilizator? Toate fișierele sale vor fi șterse de asemenea.")) return;
    try {
      const res = await fetch(`/api/users?id=${id}`, { method: "DELETE", credentials: "include" });
      const json = await res.json();

      if (json.success) {
        alert("Utilizator șters cu succes.");
        fetchUsers(page, searchTerm, userTypeFilter);
      } else {
        alert(json.error || "Eroare la ștergerea utilizatorului");
      }
    } catch {
      alert("Eroare la comunicarea cu serverul");
    }
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString + 'Z');
    return date.toLocaleString("ro-RO", {
      timeZone: "Europe/Bucharest",
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function getUserBadge(user: UserType) {
    if (user.is_admin) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
          <User size={12} className="mr-1" />
          Admin
        </span>
      );
    }
    if (user.is_moderator) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
          <User size={12} className="mr-1" />
          Moderator
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        <User size={12} className="mr-1" />
        User
      </span>
    );
  }

  return (
    <AnimatePresence mode="wait">
      {showPage && (
        <motion.div
          key="admin-users-page"
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
              <h1 className="text-3xl font-bold text-gray-900">Administrare Utilizatori</h1>
              <p className="text-gray-600 mt-2">Gestionează utilizatorii și fișierele acestora</p>
              <div className="mt-4 flex flex-col md:flex-row md:items-center gap-4">
                {/* Search input */}
                <div className="relative w-full md:w-1/3">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    placeholder="Caută utilizator..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="relative w-full md:w-1/3">
                  <input
                    type="text"
                    placeholder="Filtrează după Cod Proiect (ex: PRJ001)"
                    value={codProiectFilter}
                    onChange={e => {
                      setCodProiectFilter(e.target.value);
                      setPage(1);
                    }}
                    className="w-full pl-3 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
                  />
                </div>
                {/* Filter dropdown */}
                <div>
                  <label htmlFor="user-type-filter" className="sr-only">
                    Filtrează tipul de utilizator
                  </label>
                  <select
                    id="user-type-filter"
                    value={userTypeFilter}
                    onChange={handleFilterChange}
                    aria-label="Filtrează tipul de utilizator"
                    className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">Toți utilizatorii</option>
                    <option value="admin">Doar administratori</option>
                    <option value="moderator">Doar moderatori</option>
                    <option value="user">Doar utilizatori normali</option>
                  </select>
                </div>
              </div>
            </div>
            {/* Butoane din dreapta */}
            <div className="flex items-center gap-3">
              {isAdmin && (
                <Link href="/admin-panel/create-user">
                  <button className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors">
                    <User size={18} />
                    Creează utilizatori
                  </button>
                </Link>
              )}
              <Link href="/home">
                <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                  <Home size={18} />
                  Acasă
                </button>
              </Link>
            </div>
          </motion.div>

          {/* Statistics */}
          {stats && pagination && (
            <motion.div
              variants={cardVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
            >
              <div className="bg-white p-4 rounded-lg shadow-sm border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Utilizatori</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
                  </div>
                  <User className="w-8 h-8 text-blue-600" />
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Fișiere Totale</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalFiles}</p>
                  </div>
                  <FileText className="w-8 h-8 text-green-600" />
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Administratori</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalAdmins}</p>
                  </div>
                  <User className="w-8 h-8 text-purple-600" />
                </div>
              </div>
            </motion.div>
          )}

          {/* Users Table */}
          <motion.div
            variants={cardVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="w-full"
          >
            {loading ? (
              <div className="bg-white p-8 rounded-lg shadow-sm border">
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2">Se încarcă utilizatorii...</span>
                </div>
              </div>
            ) : (
              <>
                <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Utilizator
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Contact
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Detalii Proiect
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Fișiere
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Ultima activitate
                          </th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Acțiuni
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {users.map((user) => (
                          <tr key={user.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10">
                                  <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                    <User className="h-5 w-5 text-gray-500" />
                                  </div>
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                  <div className="text-sm text-gray-500">@{user.username}</div>
                                  <div className="mt-1">{getUserBadge(user)}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-900">{user.email}</div>
                              <div className="text-sm text-gray-500">
                                IP: {user.last_ip || "N/A"}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-900">Cod: {user.cod_proiect || "N/A"}</div>
                              <div className="text-sm text-gray-500">Loc: {user.localitate || "N/A"}</div>
                              <div className="text-sm text-gray-500">Județ: {user.judet || "N/A"}</div>
                              <div className="text-sm text-gray-500">Tel: {user.telefon || "N/A"}</div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center">
                                <FileText className="h-4 w-4 text-gray-400 mr-2" />
                                <span className="text-sm font-medium text-gray-900">
                                  {user.files_count || 0}
                                </span>
                                <span className="text-sm text-gray-500 ml-1">fișiere</span>
                              </div>
                              {user.uploaded_files && user.uploaded_files.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-1">
                                  {user.uploaded_files.map(f => (
                                    <span key={f.id} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                      {f.file_name} ({new Date(f.uploaded_at).toLocaleDateString("ro-RO")})
                                    </span>
                                  ))}
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              <div className="flex items-center">
                                <Calendar className="h-4 w-4 mr-2" />
                                {formatDate(user.updated_at)}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <div className="flex justify-center space-x-2">
                                <button
                                  onClick={() => router.push(`/admin-panel/users/${user.id}`)}
                                  className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                  <FolderSearch size={14} className="mr-1" />
                                  Detalii
                                </button>
                                {isAdmin && (
                                  <button
                                    onClick={() => deleteUser(user.id)}
                                    className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                  >
                                    <Trash2 size={14} className="mr-1" />
                                    Șterge
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Pagination */}
                {pagination && (
                  <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 mt-4 rounded-lg shadow-sm">
                    <div className="flex-1 flex justify-between sm:hidden">
                      <button
                        disabled={!pagination.hasPrev}
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                      >
                        Anterior
                      </button>
                      <button
                        disabled={!pagination.hasNext}
                        onClick={() => setPage(p => pagination ? Math.min(pagination.totalPages, p + 1) : p + 1)}
                        className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                      >
                        Următor
                      </button>
                    </div>
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm text-gray-700">
                          Afișând <span className="font-medium">{((page - 1) * pagination.limit) + 1}</span> până la{' '}
                          <span className="font-medium">{Math.min(page * pagination.limit, pagination.total)}</span> din{' '}
                          <span className="font-medium">{pagination.total}</span> rezultate
                        </p>
                      </div>
                      <div>
                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                          <button
                            disabled={!pagination.hasPrev}
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                          >
                            Anterior
                          </button>
                          <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                            {pagination.page}
                          </span>
                          <button
                            disabled={!pagination.hasNext}
                            onClick={() => setPage(p => pagination ? Math.min(pagination.totalPages, p + 1) : p + 1)}
                            className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                          >
                            Următor
                          </button>
                        </nav>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
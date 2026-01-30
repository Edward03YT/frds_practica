'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  Folder, FileText, Upload, Search, Grid, List, Home, ChevronRight, ChevronDown,
  User, Info, ScrollText, Notebook, Shield, Phone, LogOut, Clipboard, Download, Trash2, Pencil, Plus
} from 'lucide-react'

type PdfStatus = 'DRAFT' | 'TRIMIS' | 'IN CURS VERI' | 'VALID'

interface PdfDoc {
  file?: File | null
  url: string
  isSigned: boolean | null
  id: string
  fileName?: string
  uploadedAt?: string
  description?: string
}

interface Dosar {
  id: number
  denumire: string
  autoritate: string
  tip: string
  numarAnunt: string
  pdfDocs: PdfDoc[]
}

const menuItems = [
  { icon: Home, label: 'ACASA', href: '/home' },
  { icon: User, label: 'PROFIL', href: '/profil' },
  { icon: Info, label: 'GHID', href: '/ghid' },
  { icon: Clipboard, label: 'RAPOARTE', href: '/rapoarte' },
  { icon: ScrollText, label: 'DOCUMENTE', href: '/documente' },
  { icon: Notebook, label: 'PAAP', href: '/paap' },
  { icon: Shield, label: 'GDPR', href: '/politica-gdpr' },
  { icon: Phone, label: 'CONTACT', href: '/contact' },
  { icon: LogOut, label: 'DECONECTARE', href: '/login' },
]

// Instrucțiuni (custom pentru achiziții)
const instructiuni = `
1. Dosare achiziții
- Folosește butonul "Adaugă dosar" pentru a crea un dosar nou (Denumire, Autoritate, Tip, Număr anunț).
- Poți încărca PDF-uri în dosarul selectat folosind butonul "Încarcă PDF-uri".
- Acceptăm doar PDF-uri semnate digital. PDF-urile fără semnătură digitală sunt respinse.

2. PDF-uri
- Upload: doar .pdf; este verificată prezența semnăturii digitale (/Type /Sig, Adobe.PPKLite, PKCS7).
- Preview/Download: poți descărca și previzualiza direct.
- Ștergere: șterge din dosarul selectat (dacă backend-ul suportă, se trimite și DELETE la /api/pdf-files/:id).

3. Excel
- Afișăm "Total rânduri Excel" pentru utilizatorul curent.
- Butonul VALIDARE apare când numărul de dosare coincide cu numărul de rânduri din Excel.`

export default function DocAchizitiiManager() {
  // Navbar/UX identic cu doc-financiar
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedFolders, setExpandedFolders] = useState<{ [k: string]: boolean }>({ 'dosare-achizitii': true })
  const [showInfo, setShowInfo] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isLoadingFiles, setIsLoadingFiles] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  // App state (păstrăm funcționalitățile)
  const [currentUser, setCurrentUser] = useState<{ username: string, role: string } | null>(null)
  const [nrRanduriExcel, setNrRanduriExcel] = useState<number | null>(null)
  const [dosare, setDosare] = useState<Dosar[]>([])
  const [selectedDosarId, setSelectedDosarId] = useState<number | null>(null)
  const [selectedPdfIds, setSelectedPdfIds] = useState<string[]>([])

  // Modale Adaugă/Editează dosar
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState<{ open: boolean, dosar: Dosar | null }>({ open: false, dosar: null })

  const [addForm, setAddForm] = useState({
    denumire: '',
    autoritate: '',
    tip: '',
    numarAnunt: '',
    pdfDocs: [] as PdfDoc[]
  })
  const [addError, setAddError] = useState<string | null>(null)
  const addFileInputRef = useRef<HTMLInputElement>(null)

  const [editForm, setEditForm] = useState({
    denumire: '',
    autoritate: '',
    tip: '',
    numarAnunt: '',
    pdfDocs: [] as PdfDoc[]
  })
  const [editError, setEditError] = useState<string | null>(null)
  const editFileInputRef = useRef<HTMLInputElement>(null)

  // Derivate
  const selectedDosar = useMemo(
    () => dosare.find(d => d.id === selectedDosarId) || null,
    [dosare, selectedDosarId]
  )
  const currentFiles = selectedDosar ? selectedDosar.pdfDocs : []
  const filteredFiles = currentFiles.filter(f =>
    (f.fileName || 'Fără nume').toLowerCase().includes(searchTerm.toLowerCase())
  )

  useEffect(() => {
    fetch('/api/me')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.user) setCurrentUser(data.user)
        else setCurrentUser(null)
      })
  }, [])

  useEffect(() => {
    if (!currentUser) return
    const userId = currentUser.username

    // rows din Excel
    fetch(`/api/excel-rows?userId=${encodeURIComponent(userId)}`)
      .then(res => res.json())
      .then(data => {
        // replică logică: setăm doar dacă e fișier pt achiziții
        if (data.fileName && /ach/i.test(data.fileName)) {
          setNrRanduriExcel(data.rows)
        } else {
          setNrRanduriExcel(null)
        }
      })

    // dosare si pdf-urile lor
    fetchDosare(userId)
  }, [currentUser])

  const fetchDosare = (userId: string) => {
    fetch(`/api/dosare?userId=${encodeURIComponent(userId)}`)
      .then(res => res.json())
      .then(async data => {
        const dosareWithPdfs: Dosar[] = await Promise.all(
          (data.dosare || []).map(async (dosar: any) => {
            const dosarCamel = {
              ...dosar,
              numarAnunt: dosar.numarAnunt ?? dosar.numar_anunt ?? '',
            }
            const res = await fetch(`/api/pdf-files?dosarId=${dosar.id}`)
            const pdfData = await res.json()
            const pdfDocs: PdfDoc[] = (pdfData.files || []).map((f: any) => ({
              file: null,
              url: `/api/pdf-files/${f.id}`,
              isSigned: true, // ca în varianta veche
              id: f.id.toString(),
              fileName: f.file_name,
              uploadedAt: f.uploaded_at,
              description: f.description,
            }))
            return { ...dosarCamel, pdfDocs }
          })
        )
        setDosare(dosareWithPdfs)
      })
  }

  const refetchSingleDosarPdfs = async (dosarId: number) => {
    const res = await fetch(`/api/pdf-files?dosarId=${dosarId}`)
    const pdfData = await res.json()
    const pdfDocs: PdfDoc[] = (pdfData.files || []).map((f: any) => ({
      file: null,
      url: `/api/pdf-files/${f.id}`,
      isSigned: true,
      id: f.id.toString(),
      fileName: f.file_name,
      uploadedAt: f.uploaded_at,
      description: f.description,
    }))
    setDosare(prev => prev.map(d => d.id === dosarId ? { ...d, pdfDocs } : d))
  }

  // Detectează semnătură digitală în PDF (ca în pagina veche)
  const detectDigitalSignature = async (file: File) => {
    try {
      const buffer = await file.arrayBuffer()
      const text = new TextDecoder().decode(buffer)
      if (text.includes('/Type /Sig') || text.includes('/Adobe.PPKLite') || text.includes('PKCS7')) {
        return true
      }
    } catch { /* noop */ }
    return false
  }

  const toggleFolderExpansion = (name: string) => {
    setExpandedFolders(prev => ({ ...prev, [name]: !prev[name] }))
  }

  const selectDosar = (id: number) => {
    setSelectedDosarId(id)
    setSelectedPdfIds([])
    setSearchTerm('')
  }

  const toggleSelection = (pdfId: string) => {
    setSelectedPdfIds(prev =>
      prev.includes(pdfId) ? prev.filter(id => id !== pdfId) : [...prev, pdfId]
    )
  }

  const selectAll = () => {
    if (selectedPdfIds.length === filteredFiles.length) {
      setSelectedPdfIds([])
    } else {
      setSelectedPdfIds(filteredFiles.map(f => f.id))
    }
  }

  async function uploadPdf(pdf: File, userId: string, dosarId?: number, description?: string) {
    const formData = new FormData()
    formData.append('file', pdf)
    formData.append('userId', userId)
    if (dosarId) formData.append('dosarId', dosarId.toString())
    if (description) formData.append('description', description)

    const res = await fetch('/api/pdf-files', { method: 'POST', body: formData })
    if (!res.ok) {
      throw new Error('Eroare la upload PDF')
    }
  }

  // Upload din header (1:1 cu doc-financiar), dar spre /api/pdf-files + semnătură digitală
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedDosarId || !currentUser || !e.target.files) return

    setUploadError(null)
    const files = Array.from(e.target.files).filter(f => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'))
    if (files.length === 0) {
      setUploadError('Te rog selectează doar fișiere de tip PDF.')
      e.target.value = ''
      return
    }

    setIsUploading(true)
    let errors: string[] = []
    try {
      for (const file of files) {
        const signed = await detectDigitalSignature(file)
        if (!signed) {
          errors.push(`"${file.name}" nu este semnat digital. A fost omis.`)
          continue
        }
        await uploadPdf(file, currentUser.username, selectedDosarId)
      }
      await refetchSingleDosarPdfs(selectedDosarId)
      if (errors.length) setUploadError(errors.join(' '))
    } catch (err: any) {
      setUploadError(err.message || 'A eșuat încărcarea fișierelor.')
    } finally {
      setIsUploading(false)
      e.target.value = ''
    }
  }

  const handleDownload = (pdf: PdfDoc) => {
    // Deschide direct URL-ul (serverul poate seta Content-Disposition)
    const a = document.createElement('a')
    a.href = pdf.url
    a.target = '_blank'
    a.rel = 'noopener'
    a.download = pdf.fileName || 'document.pdf'
    document.body.appendChild(a)
    a.click()
    a.remove()
  }

  const handleDownloadSelected = async () => {
    if (!selectedDosar || selectedPdfIds.length === 0) return
    for (const id of selectedPdfIds) {
      const pdf = selectedDosar.pdfDocs.find(p => p.id === id)
      if (pdf) handleDownload(pdf)
    }
  }

  const handleDeletePdfFromDosar = async (dosarId: number, pdfId: string) => {
    // încearcă DELETE către backend, dar dacă nu există endpoint, șterge local (comportament vechi)
    try {
      const res = await fetch(`/api/pdf-files/${encodeURIComponent(pdfId)}`, { method: 'DELETE' })
      if (!res.ok) {
        // fallback local
        setDosare(prev => prev.map(d =>
          d.id === dosarId ? { ...d, pdfDocs: d.pdfDocs.filter(p => p.id !== pdfId) } : d
        ))
      } else {
        setDosare(prev => prev.map(d =>
          d.id === dosarId ? { ...d, pdfDocs: d.pdfDocs.filter(p => p.id !== pdfId) } : d
        ))
      }
    } catch {
      setDosare(prev => prev.map(d =>
        d.id === dosarId ? { ...d, pdfDocs: d.pdfDocs.filter(p => p.id !== pdfId) } : d
      ))
    }
  }

  const handleDeleteFiles = async () => {
    if (!selectedDosar || selectedPdfIds.length === 0) return
    if (!window.confirm('Sigur vrei să ștergi fișierele selectate?')) return

    for (const id of selectedPdfIds) {
      await handleDeletePdfFromDosar(selectedDosar.id, id)
    }
    setSelectedPdfIds([])
  }

  const handleDeleteDosar = async (dosarId: number) => {
    if (!window.confirm('Sigur vrei să ștergi acest dosar?')) return
    try {
      const res = await fetch(`/api/dosare/${dosarId}`, { method: 'DELETE' })
      if (!res.ok) {
        alert('Eroare la ștergerea dosarului din backend!')
        return
      }
      setDosare(prev => prev.filter(d => d.id !== dosarId))
      if (selectedDosarId === dosarId) {
        setSelectedDosarId(null)
        setSelectedPdfIds([])
      }
    } catch {
      alert('Eroare de rețea la ștergere!')
    }
  }

  // Add Dosar (modal) – la fel ca în vechiul flux, dar UI ca în doc-financiar
  const handleAddInput = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setAddForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }
  const handleAddFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setAddError(null)
    const files = e.target.files
    if (!files) return
    const temp: PdfDoc[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
        setAddError('Se acceptă doar fișiere PDF.')
        continue
      }
      const signed = await detectDigitalSignature(file)
      if (!signed) {
        setAddError('PDF-urile trebuie să fie semnate digital! Cele nesemnate au fost omise.')
        continue
      }
      temp.push({
        file,
        url: URL.createObjectURL(file),
        isSigned: signed,
        id: `${file.name}-${file.size}-${file.lastModified}-${Math.random()}`
      })
    }
    setAddForm(prev => ({ ...prev, pdfDocs: [...prev.pdfDocs, ...temp] }))
  }
  const handleRemoveAddPdf = (idx: number) => {
    setAddForm(prev => ({ ...prev, pdfDocs: prev.pdfDocs.filter((_, i) => i !== idx) }))
  }
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setAddError(null)
    if (!currentUser) { setAddError('Utilizator negăsit.'); return }
    if (!addForm.denumire || !addForm.autoritate || !addForm.tip || !addForm.numarAnunt || addForm.pdfDocs.length === 0) {
      setAddError('Completează toate câmpurile și atașează cel puțin un fișier PDF.')
      return
    }
    const res = await fetch('/api/dosare', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: currentUser?.username,
        denumire: addForm.denumire,
        autoritate: addForm.autoritate,
        tip: addForm.tip,
        numarAnunt: addForm.numarAnunt,
      })
    })
    const data = await res.json()
    if (data.success) {
      const dosarId = data.dosarId
      // upload toate PDF-urile semnate
      for (const pdf of addForm.pdfDocs) {
        if (pdf.file) {
          await uploadPdf(pdf.file, currentUser.username, dosarId)
        }
      }
      // refetch
      fetchDosare(currentUser.username)
      setShowAddModal(false)
      setAddForm({ denumire: '', autoritate: '', tip: '', numarAnunt: '', pdfDocs: [] })
      setAddError(null)
      setSelectedDosarId(dosarId)
    }
  }

  // Edit Dosar (modal)
  const openEditModal = (dosar: Dosar) => {
    setEditForm({
      denumire: dosar.denumire,
      autoritate: dosar.autoritate,
      tip: dosar.tip,
      numarAnunt: dosar.numarAnunt,
      pdfDocs: [...dosar.pdfDocs], // doar pentru afișare; upload-urile noi se vor trimite imediat
    })
    setEditError(null)
    setShowEditModal({ open: true, dosar })
  }
  const handleEditInput = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setEditForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }
  const handleEditFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditError(null)
    if (!showEditModal.dosar || !currentUser) return
    const files = e.target.files
    if (!files) return
    const newDocs: PdfDoc[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
        setEditError('Se acceptă doar fișiere PDF.')
        continue
      }
      const signed = await detectDigitalSignature(file)
      if (!signed) {
        setEditError('PDF-urile trebuie să fie semnate digital! Cele nesemnate au fost omise.')
        continue
      }
      try {
        await uploadPdf(file, currentUser.username, showEditModal.dosar.id)
        newDocs.push({
          file,
          url: URL.createObjectURL(file),
          isSigned: signed,
          id: `${file.name}-${file.size}-${file.lastModified}-${Math.random()}`,
          fileName: file.name
        })
      } catch {
        setEditError('Eroare la upload în editare.')
      }
    }
    // Doar pentru feedback vizual în modal; lista reală e din backend și se va actualiza la submit/close
    setEditForm(prev => ({ ...prev, pdfDocs: [...prev.pdfDocs, ...newDocs] }))
    await refetchSingleDosarPdfs(showEditModal.dosar.id)
  }
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // În versiunea veche nu exista PUT; păstrăm consistența și updatăm local
    setDosare(prev => prev.map(d =>
      d.id === showEditModal.dosar?.id
        ? { ...d, denumire: editForm.denumire, autoritate: editForm.autoritate, tip: editForm.tip, numarAnunt: editForm.numarAnunt }
        : d
    ))
    setShowEditModal({ open: false, dosar: null })
  }
  return (
    <>
      {/* NAVBAR SUS */}
      <div className="sticky top-0 z-50 bg-white shadow border-b">
        <nav className="max-w-7xl mx-full flex items-center px-4 py-2">
          <div className="flex items-center gap-2">
            {menuItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="flex items-center gap-1 px-3 py-2 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors font-medium text-sm"
              >
                <item.icon className="w-5 h-5" />
                <span className="hidden sm:inline">{item.label}</span>
              </a>
            ))}
          </div>
        </nav>
      </div>

      {/* SHORTCUTS SUS DREAPTA PESTE NAVBAR */}
      <div className="fixed top-1 right-4 z-[999] flex gap-2">
        <a href="/rap-achizitii">
          <button
            className="flex items-center gap-2 bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold shadow-lg hover:bg-blue-800 transition"
            type="button"
          >
            <FileText className="w-5 h-5" />
            RAPORT ACHIZIȚII
          </button>
        </a>
        <a href="/paap">
          <button
            className="flex items-center gap-2 bg-purple-700 text-white px-4 py-2 rounded-lg font-semibold shadow-lg hover:bg-purple-800 transition"
            type="button"
          >
            <ScrollText className="w-5 h-5" />
            PAAP
          </button>
        </a>
      </div>
      <div className="min-h-screen bg-gray-50">

        {/* Header */}
        <div className="bg-white border-b border-gray-200 shadow-sm">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <h1 className="text-2xl font-bold text-gray-900">Dosare achiziții</h1>
                  <div className="relative ml-2">
                    <button
                      onClick={() => setShowInfo(true)}
                      className="flex items-center px-3 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium transition"
                      type="button"
                    >
                      <Info size={20} className="mr-1" />
                      Instrucțiuni
                    </button>
                    {showInfo && (
                      <div className="fixed inset-0 z-50 flex items-center justify-center">
                        <div
                          className="absolute inset-0 bg-black/30 backdrop-blur-sm transition"
                          onClick={() => setShowInfo(false)}
                        />
                        <div className="relative z-10 bg-white rounded-2xl shadow-2xl max-w-4xl w-full mx-4 p-0 flex flex-col">
                          <div className="flex items-center justify-between px-8 pt-8 pb-4 border-b">
                            <div className="flex items-center">
                              <Info size={28} className="text-blue-600 mr-3" />
                              <span className="text-xl md:text-2xl font-semibold text-gray-900">Instrucțiuni Dosare Achiziții</span>
                            </div>
                            <button
                              onClick={() => setShowInfo(false)}
                              className="text-gray-400 hover:text-gray-700 text-3xl font-bold ml-4"
                              aria-label="Închide"
                            >
                              X
                            </button>
                          </div>
                          <div className="px-8 py-6 overflow-y-auto" style={{ maxHeight: '70vh' }}>
                            <div className="text-gray-800 text-base font-sans leading-relaxed text-left whitespace-pre-line">
                              {instructiuni}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <span>Total dosare: {dosare.length}</span>
                  <span className="mx-1">•</span>
                  <span>Total rânduri Excel: {typeof nrRanduriExcel === 'number' ? nrRanduriExcel : '-'}</span>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                {typeof nrRanduriExcel === 'number' && dosare.length === nrRanduriExcel && (
                  <button
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
                    type="button"
                  >
                    VALIDARE
                  </button>
                )}
                {!(typeof nrRanduriExcel === 'number' && dosare.length === nrRanduriExcel) && (
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Adaugă dosar</span>
                  </button>
                )}
                {selectedDosar && (
                  <>
                    <input
                      type="file"
                      multiple
                      accept=".pdf,application/pdf"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="pdf-upload-achizitii"
                      disabled={isUploading}
                    />
                    <label
                      htmlFor="pdf-upload-achizitii"
                      className={`px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2 cursor-pointer ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <Upload className="w-4 h-4" />
                      <span>{isUploading ? 'Se încarcă...' : 'Încarcă PDF-uri'}</span>
                    </label>
                    <button
                      onClick={() => openEditModal(selectedDosar)}
                      className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 flex items-center space-x-2"
                      title="Modifică dosar"
                    >
                      <Pencil className="w-4 h-4" />
                      <span>Modifică</span>
                    </button>
                    <button
                      onClick={() => handleDeleteDosar(selectedDosar.id)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center space-x-2"
                      title="Șterge dosar"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Șterge</span>
                    </button>
                  </>
                )}
                {uploadError && (
                  <div className="text-red-600 text-sm font-medium">{uploadError}</div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex">
          {/* Sidebar (identic vizual) */}
          <div className="w-80 bg-white border-r border-gray-200 min-h-screen">
            <div className="p-4">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <button onClick={() => toggleFolderExpansion('dosare-achizitii')} className="p-1 hover:bg-gray-100 rounded">
                    {expandedFolders['dosare-achizitii'] ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
                  </button>
                  <Folder className="w-5 h-5 text-blue-500" />
                  <span className="font-medium text-gray-900">dosare-achizitii</span>
                </div>
                {expandedFolders['dosare-achizitii'] && (
                  <div className="ml-6 space-y-1">
                    {dosare.map((d) => (
                      <div key={d.id}>
                        <div
                          className={`flex items-center space-x-2 p-2 rounded-lg cursor-pointer hover:bg-gray-100 ${selectedDosarId === d.id ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}`}
                          onClick={() => selectDosar(d.id)}
                        >
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleFolderExpansion(`dosar-${d.id}`) }}
                            className="p-1"
                          >
                            {expandedFolders[`dosar-${d.id}`] ? <ChevronDown className="w-3 h-3 text-gray-400" /> : <ChevronRight className="w-3 h-3 text-gray-400" />}
                          </button>
                          <Folder className={`w-4 h-4 ${selectedDosarId === d.id ? 'text-blue-600' : 'text-blue-500'}`} />
                          <span className="text-sm font-medium truncate">{d.denumire}</span>
                          {d.pdfDocs.length > 0 && (
                            <span className="text-xs bg-gray-200 text-black px-2 py-1 rounded-full ml-auto">
                              {d.pdfDocs.length}
                            </span>
                          )}
                        </div>
                        {expandedFolders[`dosar-${d.id}`] && d.pdfDocs.length > 0 && (
                          <div className="ml-6 space-y-1">
                            {d.pdfDocs.map((file) => (
                              <div key={file.id} className="flex items-center space-x-2 p-2 text-sm text-black hover:bg-gray-50 rounded">
                                <div className="w-3"></div>
                                <FileText className="w-4 h-4 text-red-500" />
                                <span className="truncate">{file.fileName || 'Fără nume'}</span>
                                <span className="text-xs text-gray-400 ml-auto">{file.uploadedAt || '-'}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Toolbar */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder={selectedDosar ? "Caută în fișierele curente..." : "Selectează un dosar"}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      disabled={!selectedDosar}
                      className="text-black pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-80 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                  </div>
                  {selectedDosar && filteredFiles.length > 0 && (
                    <button onClick={selectAll} className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900">
                      {selectedPdfIds.length === filteredFiles.length ? 'Deselectează Tot' : 'Selectează Tot'}
                    </button>
                  )}
                </div>
                {selectedDosar && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 rounded ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                      <List className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 rounded ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                      <Grid className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* File List Area */}
            <div className="p-6">
              {selectedPdfIds.length > 0 && selectedDosar && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-blue-700 font-medium">{selectedPdfIds.length} fișier(e) selectat(e)</span>
                    <div className="space-x-2">
                      <button
                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 ml-2"
                        onClick={handleDownloadSelected}
                      >
                        Descarcă
                      </button>
                      <button
                        className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                        onClick={handleDeleteFiles}
                      >
                        Șterge
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {!selectedDosar ? (
                <div className="text-center py-12">
                  <Folder className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Selectează un dosar</h3>
                  <p className="text-gray-500">Alege un dosar din stânga pentru a vedea conținutul și a încărca fișiere.</p>
                </div>
              ) : isLoadingFiles ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 animate-pulse">Se încarcă fișierele...</p>
                </div>
              ) : (
                <>
                  {viewMode === 'list' && filteredFiles.length > 0 && (
                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="px-6 py-3 text-left w-12">
                              <input
                                type="checkbox"
                                checked={filteredFiles.length > 0 && selectedPdfIds.length === filteredFiles.length}
                                onChange={selectAll}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nume</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data Încărcării</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Autoritate</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tip</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Număr anunț</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {filteredFiles.map((file) => (
                            <tr
                              key={file.id}
                              className={`hover:bg-gray-50 cursor-pointer ${selectedPdfIds.includes(file.id) ? 'bg-blue-50' : ''}`}

                            >
                              <td className="px-6 py-4">
                                <input
                                  type="checkbox"
                                  checked={selectedPdfIds.includes(file.id)}
                                  onChange={() => { }}
                                  onClick={() => toggleSelection(file.id)}

                                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <FileText className="w-5 h-5 text-red-500 mr-3 flex-shrink-0" />
                                  <span className="text-sm font-medium text-gray-900 truncate">{file.fileName || 'Fără nume'}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{file.uploadedAt || '-'}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{selectedDosar?.autoritate || '-'}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{selectedDosar?.tip || '-'}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{selectedDosar?.numarAnunt || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {viewMode === 'grid' && filteredFiles.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                      {filteredFiles.map((file) => (
                        <div
                          key={file.id}
                          className={`bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md cursor-pointer transition-shadow ${selectedPdfIds.includes(file.id) ? 'ring-2 ring-blue-500 bg-blue-50' : ''}`}
                          onClick={() => toggleSelection(file.id)}
                        >
                          <div className="flex flex-col items-center text-center">
                            <FileText className="w-12 h-12 text-red-500 mb-3" />
                            <h3 className="text-sm font-medium text-gray-900 mb-1 line-clamp-2">{file.fileName || 'Fără nume'}</h3>
                            <p className="text-xs text-gray-500">{file.uploadedAt || '-'}</p>
                            <p className="text-xs text-gray-400 mt-1">-</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {filteredFiles.length === 0 && (
                    <div className="text-center py-12">
                      <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">{searchTerm ? 'Niciun rezultat găsit' : 'Nu există fișiere PDF'}</h3>
                      <p className="text-gray-500">{searchTerm ? `Niciun fișier nu corespunde căutării "${searchTerm}"` : 'Încarcă fișiere PDF pentru a începe.'}</p>
                      {!searchTerm && selectedDosar && (
                        <label
                          htmlFor="pdf-upload-achizitii"
                          className="inline-flex items-center px-4 py-2 mt-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Încarcă primul PDF
                        </label>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Modal Adaugă Dosar */}
        {
          showAddModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => { setShowAddModal(false); setAddError(null); }} />
              <div className="relative z-10 bg-white rounded-2xl shadow-2xl max-w-xl w-full mx-4 p-0 flex flex-col">
                <div className="flex items-center justify-between px-8 pt-8 pb-4 border-b">
                  <div className="flex items-center">
                    <Folder className="text-blue-600 mr-3" />
                    <span className="text-xl md:text-2xl font-semibold text-gray-900">Adaugă dosar achiziție</span>
                  </div>
                  <button
                    onClick={() => { setShowAddModal(false); setAddError(null); }}
                    className="text-gray-400 hover:text-gray-700 text-3xl font-bold ml-4"
                    aria-label="Închide"
                  >
                    X
                  </button>
                </div>
                <form onSubmit={handleAddSubmit} className="px-8 py-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-black">Denumire</label>
                    <input
                      type="text"
                      name="denumire"
                      value={addForm.denumire}
                      onChange={handleAddInput}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-black"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-black">Autoritate contractantă</label>
                    <input
                      type="text"
                      name="autoritate"
                      value={addForm.autoritate}
                      onChange={handleAddInput}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-black"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-black">Tip</label>
                    <select
                      name="tip"
                      value={addForm.tip}
                      onChange={handleAddInput}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-black"
                      required
                    >
                      <option value="">Selectează tipul</option>
                      <option value="Publică">Publică</option>
                      <option value="Directă">Directă</option>
                      <option value="Beneficiar privat">Beneficiar privat</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-black">Număr anunț</label>
                    <input
                      type="text"
                      name="numarAnunt"
                      value={addForm.numarAnunt}
                      onChange={handleAddInput}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-black"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-black mb-1">Documente PDF</label>
                    <div className="flex items-center gap-2 mb-2">
                      <button
                        type="button"
                        className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition"
                        onClick={() => addFileInputRef.current?.click()}
                      >
                        <Upload className="w-5 h-5" />
                        Adaugă documente PDF
                      </button>
                      <input
                        type="file"
                        accept="application/pdf"
                        multiple
                        onChange={handleAddFiles}
                        className="hidden"
                        ref={addFileInputRef}
                      />
                    </div>
                    {addForm.pdfDocs.length > 0 && (
                      <ul className="space-y-2">
                        {addForm.pdfDocs.map((pdf, idx) => (
                          <li key={pdf.id} className="flex items-center gap-2">
                            <FileText className="w-5 h-5 text-gray-500" />
                            <span className="text-sm text-black">{pdf.fileName || pdf.file?.name || 'Fără nume'}</span>
                            <button type="button" className="ml-2 p-1 rounded hover:bg-gray-100" onClick={() => handleRemoveAddPdf(idx)}>
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  {addError && <div className="text-red-500 text-sm">{addError}</div>}
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                    >
                      Salvează
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )
        }

        {/* Modal Modifică Dosar */}
        {
          showEditModal.open && showEditModal.dosar && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div
                className="absolute inset-0 bg-black/30 backdrop-blur-sm"
                onClick={() => setShowEditModal({ open: false, dosar: null })}
              />
              <div className="relative z-10 bg-white rounded-2xl shadow-2xl max-w-xl w-full mx-4 p-0 flex flex-col">
                <div className="flex items-center justify-between px-8 pt-8 pb-4 border-b">
                  <div className="flex items-center">
                    <Pencil className="text-yellow-600 mr-3" />
                    <span className="text-xl md:text-2xl font-semibold text-gray-900">Modifică dosar</span>
                  </div>
                  <button
                    onClick={() => setShowEditModal({ open: false, dosar: null })}
                    className="text-gray-400 hover:text-gray-700 text-3xl font-bold ml-4"
                    aria-label="Închide"
                  >
                    X
                  </button>
                </div>
                <form onSubmit={handleEditSubmit} className="px-8 py-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-black">Denumire</label>
                    <input
                      type="text"
                      name="denumire"
                      value={editForm.denumire}
                      onChange={handleEditInput}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-black"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-black">Autoritate contractantă</label>
                    <input
                      type="text"
                      name="autoritate"
                      value={editForm.autoritate}
                      onChange={handleEditInput}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-black"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-black">Tip</label>
                    <select
                      name="tip"
                      value={editForm.tip}
                      onChange={handleEditInput}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-black"
                      required
                    >
                      <option value="">Selectează tipul</option>
                      <option value="Publică">Publică</option>
                      <option value="Directă">Directă</option>
                      <option value="Beneficiar privat">Beneficiar privat</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-black">Număr anunț</label>
                    <input
                      type="text"
                      name="numarAnunt"
                      value={editForm.numarAnunt}
                      onChange={handleEditInput}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-black"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-black mb-1">Documente PDF</label>
                    <div className="flex items-center gap-2 mb-2">
                      <button
                        type="button"
                        className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition"
                        onClick={() => editFileInputRef.current?.click()}
                      >
                        <Upload className="w-5 h-5" />
                        Adaugă documente PDF
                      </button>
                      <input
                        type="file"
                        accept="application/pdf"
                        multiple
                        onChange={handleEditFiles}
                        className="hidden"
                        ref={editFileInputRef}
                      />
                    </div>
                    {editForm.pdfDocs.length > 0 && (
                      <ul className="space-y-2">
                        {editForm.pdfDocs.map((pdf) => (
                          <li key={pdf.id} className="flex items-center gap-2">
                            <FileText className="w-5 h-5 text-gray-500" />
                            <span className="text-sm">{pdf.fileName || pdf.file?.name || 'Fără nume'}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  {editError && <div className="text-red-500 text-sm">{editError}</div>}
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      className="bg-gray-200 text-black px-6 py-2 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                      onClick={() => setShowEditModal({ open: false, dosar: null })}
                    >
                      Anulează
                    </button>
                    <button
                      type="submit"
                      className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                    >
                      Salvează
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )
        }
      </div >
    </>
  )
}
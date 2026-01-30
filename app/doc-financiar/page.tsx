'use client'

import React, { useState, useEffect } from 'react'
import { Folder, FileText, Download, Upload, Search, Grid, List, Home, ChevronRight, ChevronDown, User, Info, ScrollText, Notebook, Shield, Phone, LogOut, Clipboard } from 'lucide-react'
// Interfețele pentru tipurile de date
interface FileItem {
    name: string
    dateModified: string
    type: 'File folder' | 'file'
    size?: string
}

interface PDFFile {
    name: string
    dateModified: string
    size: string
}

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

// Lista statică de foldere
const folders: FileItem[] = [
    { name: 'Doc_just_cap1', dateModified: '12.08.2025 12:46', type: 'File folder' },
    { name: 'Doc_just_cap2', dateModified: '12.08.2025 12:47', type: 'File folder' },
    { name: 'Doc_just_cap2_cost_ind', dateModified: '12.08.2025 12:54', type: 'File folder' },
    { name: 'Doc_just_cap3', dateModified: '12.08.2025 12:48', type: 'File folder' },
    { name: 'Doc_just_cap4', dateModified: '12.08.2025 12:49', type: 'File folder' },
    { name: 'Doc_just_cap5', dateModified: '12.08.2025 12:50', type: 'File folder' },
    { name: 'Doc_just_cap6', dateModified: '12.08.2025 12:51', type: 'File folder' },
    { name: 'Extrase_de_cont', dateModified: '12.08.2025 12:45', type: 'File folder' },
    { name: 'Rap_Audit+(part extern)', dateModified: '12.08.2025 12:43', type: 'File folder' },
    { name: 'Rap_Financiar', dateModified: '12.08.2025 12:43', type: 'File folder' }

]

export default function DocFinanciarManager() {
    // Stările componentei, inclusiv cele noi pentru încărcare
    const [selectedItems, setSelectedItems] = useState<string[]>([])
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedFolder, setSelectedFolder] = useState<string | null>(null)
    const [folderFiles, setFolderFiles] = useState<{ [key: string]: PDFFile[] }>({})
    const [isUploading, setIsUploading] = useState(false)
    const [isLoadingFiles, setIsLoadingFiles] = useState(false)
    const [expandedFolders, setExpandedFolders] = useState<{ [key: string]: boolean }>({ 'doc-financiar': true })
    const [uploadError, setUploadError] = useState<string | null>(null)
    const [showInfo, setShowInfo] = useState(false);

    const instructiuni = `
1. Rap_audit + (part extern)

Exclusiv format electronic (fișier PDF) – copie scanată a documentelor originale.

Raportul auditorului proiectului trebuie să conțină cel puțin datele solicitate prin formatul furnizat de OP (Anexa 7).

Raportul de audit va fi însoțit de:

Copie a carnetului de auditor, vizat la zi (pentru persoane fizice)

Dovada plății cotizației la zi (pentru persoane juridice)

În cazul partenerului extern, este suficientă o copie a raportului de audit însoțit de Anexa 8.4.

2. Rap_financiar

Anexa 8

Raport financiar cu toate anexele:

Fișier PDF – copie scanată a documentului original

Fișier Excel editabil

3. Extrase_de_cont

Format electronic (fișier PDF) – copie scanată a documentului original.

4. Documente justificative (cap. 1–6 și costuri indirecte)

Doc_just_cap1 – Exclusiv format electronic (PDF) – copie scanată a documentelor originale păstrate la nivelul PP/partenerului

Doc_just_cap2 – Exclusiv format electronic (PDF) – copie scanată a documentelor originale păstrate la nivelul PP/partenerului

Doc_just_cap3 – Exclusiv format electronic (PDF) – copie scanată a documentelor originale păstrate la nivelul PP/partenerului

Doc_just_cap4 – Exclusiv format electronic (PDF) – copie scanată a documentelor originale păstrate la nivelul PP/partenerului

Doc_just_cap5 – Exclusiv format electronic (PDF) – copie scanată a documentelor originale păstrate la nivelul PP/partenerului

Doc_just_cap6 – Exclusiv format electronic (PDF) – copie scanată a documentelor originale păstrate la nivelul PP/partenerului

Doc_just_cap2_cost_ind – Exclusiv format electronic (PDF) – copie scanată a documentelor originale păstrate la nivelul PP/partenerului, pentru metoda costurilor reale
`;

    // Logica de filtrare a fișierelor afișate
    const currentFiles = selectedFolder ? folderFiles[selectedFolder] || [] : []
    const filteredFiles = currentFiles.filter(file =>
        file.name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    // Hook pentru a prelua fișierele când un folder este selectat
    useEffect(() => {
        if (!selectedFolder) return;

        // Nu re-încărcăm dacă avem deja datele (optimizare)
        if (folderFiles[selectedFolder]) return;

        const fetchFiles = async () => {
            setIsLoadingFiles(true);
            try {
                const response = await fetch(`/api/get-documents?section=${encodeURIComponent(selectedFolder)}`);
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Nu s-au putut prelua fișierele.');
                }
                const data = await response.json();
                setFolderFiles(prev => ({
                    ...prev,
                    [selectedFolder]: data.documents,
                }));
            } catch (error) {
                console.error(error);
                alert((error as Error).message);
            } finally {
                setIsLoadingFiles(false);
            }
        };

        fetchFiles();
    }, [selectedFolder, folderFiles]);


    // Funcții de bază pentru interacțiune
    const toggleSelection = (itemName: string) => {
        setSelectedItems(prev =>
            prev.includes(itemName)
                ? prev.filter(item => item !== itemName)
                : [...prev, itemName]
        )
    }

    const selectAll = () => {
        if (selectedItems.length === filteredFiles.length) {
            setSelectedItems([])
        } else {
            setSelectedItems(filteredFiles.map(file => file.name))
        }
    }

    const selectFolder = (folderName: string) => {
        setSelectedFolder(folderName);
        setSelectedItems([]); // Resetează selecția la schimbarea folderului
        setSearchTerm(''); // Resetează căutarea
    }

    const toggleFolderExpansion = (folderName: string) => {
        setExpandedFolders(prev => ({ ...prev, [folderName]: !prev[folderName] }))
    }

    // Funcția de upload conectată la API
    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!selectedFolder || !event.target.files) return;

        setUploadError(null); // Resetează eroarea la fiecare upload nou

        const filesToUpload = Array.from(event.target.files).filter(file => file.type === 'application/pdf');
        if (filesToUpload.length === 0) {
            setUploadError("Te rog selectează doar fișiere de tip PDF.");
            return;
        }

        setIsUploading(true);

        const formData = new FormData();
        formData.append('selectedFolder', selectedFolder);
        filesToUpload.forEach(file => {
            formData.append('files', file);
        });

        try {
            const response = await fetch('/api/pdf_fina', {
                method: 'POST',
                body: formData,
            });

            const result = await response.json();

            if (!response.ok) {
                setUploadError(result.error || 'A eșuat încărcarea fișierelor.');
                return;
            }

            const newFiles: PDFFile[] = result.uploadedFiles;
            setFolderFiles(prev => ({
                ...prev,
                [selectedFolder]: [...(prev[selectedFolder] || []), ...newFiles],
            }));
            setUploadError(null);
            alert(result.message);

        } catch (error) {
            console.error('Eroare la upload:', error);
            setUploadError((error as Error).message);
        } finally {
            setIsUploading(false);
            event.target.value = '';
        }
    };

    const handleDeleteFiles = async () => {
        if (!selectedFolder || selectedItems.length === 0) return;

        if (!window.confirm("Sigur vrei să ștergi fișierele selectate?")) return;

        for (const fileName of selectedItems) {
            try {
                const response = await fetch('/api/pdf_fina', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        fileName,
                        sectionName: selectedFolder
                    }),
                });
                const result = await response.json();

                if (!response.ok) {
                    alert(result.error || `Eroare la ștergerea fișierului ${fileName}`);
                } else {
                    // Elimină fișierul șters din listă
                    setFolderFiles(prev => ({
                        ...prev,
                        [selectedFolder]: (prev[selectedFolder] || []).filter(f => f.name !== fileName)
                    }));
                }
            } catch (error) {
                alert(`Eroare la ștergerea fișierului ${fileName}: ${(error as Error).message}`);
            }
        }
        setSelectedItems([]); // Deselectează tot după ștergere
    };

    const handleDownload = async (fileName: string) => {
        if (!selectedFolder) return;
        try {
            const response = await fetch(`/api/pdf_fina?fileName=${encodeURIComponent(fileName)}&sectionName=${encodeURIComponent(selectedFolder)}`);
            if (!response.ok) {
                const errorData = await response.json();
                alert(errorData.error || 'Eroare la descărcare.');
                return;
            }
            const blob = await response.blob();
            // Creează un link temporar și declanșează download-ul
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            alert((error as Error).message);
        }
    };

    const handleDownloadSelected = async () => {
        if (!selectedFolder || selectedItems.length === 0) return;
        for (const fileName of selectedItems) {
            await handleDownload(fileName);
        }
    };
    return (
        <div className="min-h-screen bg-gray-50">
            {/* SHORTCUT SUS DREAPTA */}
            <div className="fixed top-1 right-4 z-[999] flex gap-2">
                <a href="/rap-financiar">
                    <button
                        className="flex items-center gap-2 bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold shadow-lg hover:bg-blue-800 transition"
                        type="button"
                    >
                        <FileText className="w-5 h-5" />
                        RAPORT FINANCIAR
                    </button>
                </a>
            </div>
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

            {/* Header */}
            <div className="bg-white border-b border-gray-200 shadow-sm">
                <div className="px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center">
                                <h1 className="text-2xl font-bold text-gray-900">Documente Financiare</h1>
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
                                            {/* Blur background */}
                                            <div
                                                className="absolute inset-0 bg-black/30 backdrop-blur-sm transition"
                                                onClick={() => setShowInfo(false)}
                                            />
                                            {/* Modal content */}
                                            <div className="relative z-10 bg-white rounded-2xl shadow-2xl max-w-4xl w-full mx-4 p-0 flex flex-col">
                                                {/* Header cu X și titlu */}
                                                <div className="flex items-center justify-between px-8 pt-8 pb-4 border-b">
                                                    <div className="flex items-center">
                                                        <Info size={28} className="text-blue-600 mr-3" />
                                                        <span className="text-xl md:text-2xl font-semibold text-gray-900">Instrucțiuni Documente Financiare</span>
                                                    </div>
                                                    <button
                                                        onClick={() => setShowInfo(false)}
                                                        className="text-gray-400 hover:text-gray-700 text-3xl font-bold ml-4"
                                                        aria-label="Închide"
                                                    >
                                                        X
                                                    </button>
                                                </div>
                                                {/* Conținut scrollabil */}
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
                                {/* poți adăuga alte elemente aici */}
                            </div>
                        </div>
                        {/* restul codului tău pentru butoane upload etc */}
                        <div className="flex items-center space-x-3">
                            {selectedFolder && (
                                <>
                                    <input
                                        type="file"
                                        multiple
                                        accept=".pdf"
                                        onChange={handleFileUpload}
                                        className="hidden"
                                        id="pdf-upload"
                                        disabled={isUploading}
                                    />
                                    <label
                                        htmlFor="pdf-upload"
                                        className={`px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2 cursor-pointer ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        <Upload className="w-4 h-4" />
                                        <span>{isUploading ? 'Se încarcă...' : 'Încarcă PDF-uri'}</span>
                                    </label>
                                    {uploadError && (
                                        <div className="text-red-600 mt-2 text-sm font-medium">{uploadError}</div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex">
                {/* Sidebar */}
                <div className="w-80 bg-white border-r border-gray-200 min-h-screen">
                    <div className="p-4">
                        <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                                <button onClick={() => toggleFolderExpansion('doc-financiar')} className="p-1 hover:bg-gray-100 rounded">
                                    {expandedFolders['doc-financiar'] ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
                                </button>
                                <Folder className="w-5 h-5 text-blue-500" />
                                <span className="font-medium text-gray-900">doc-financiar</span>
                            </div>
                            {expandedFolders['doc-financiar'] && (
                                <div className="ml-6 space-y-1">
                                    {folders.map((folder) => (
                                        <div key={folder.name}>
                                            <div
                                                className={`flex items-center space-x-2 p-2 rounded-lg cursor-pointer hover:bg-gray-100 ${selectedFolder === folder.name ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}`}
                                                onClick={() => selectFolder(folder.name)}
                                            >
                                                <button onClick={(e) => { e.stopPropagation(); toggleFolderExpansion(folder.name) }} className="p-1">
                                                    {expandedFolders[folder.name] ? <ChevronDown className="w-3 h-3 text-gray-400" /> : <ChevronRight className="w-3 h-3 text-gray-400" />}
                                                </button>
                                                <Folder className={`w-4 h-4 ${selectedFolder === folder.name ? 'text-blue-600' : 'text-blue-500'}`} />
                                                <span className="text-sm font-medium truncate">{folder.name}</span>
                                                {folderFiles[folder.name] && folderFiles[folder.name].length > 0 && (
                                                    <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full ml-auto">
                                                        {folderFiles[folder.name].length}
                                                    </span>
                                                )}
                                            </div>
                                            {expandedFolders[folder.name] && folderFiles[folder.name] && (
                                                <div className="ml-6 space-y-1">
                                                    {folderFiles[folder.name].map((file) => (
                                                        <div key={file.name} className="flex items-center space-x-2 p-2 text-sm text-gray-600 hover:bg-gray-50 rounded">
                                                            <div className="w-3"></div>
                                                            <FileText className="w-4 h-4 text-red-500" />
                                                            <span className="truncate">{file.name}</span>
                                                            <span className="text-xs text-gray-400 ml-auto">{file.size}</span>
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
                                        placeholder={selectedFolder ? "Caută în fișierele curente..." : "Selectează un folder"}
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        disabled={!selectedFolder}
                                        className="text-black pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-80 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                    />
                                </div>
                                {selectedFolder && filteredFiles.length > 0 && (
                                    <button onClick={selectAll} className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900">
                                        {selectedItems.length === filteredFiles.length ? 'Deselectează Tot' : 'Selectează Tot'}
                                    </button>
                                )}
                            </div>
                            {selectedFolder && (
                                <div className="flex items-center space-x-2">
                                    <button onClick={() => setViewMode('list')} className={`p-2 rounded ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}> <List className="w-4 h-4" /> </button>
                                    <button onClick={() => setViewMode('grid')} className={`p-2 rounded ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}> <Grid className="w-4 h-4" /> </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* File List Area */}
                    <div className="p-6">
                        {selectedItems.length > 0 && selectedFolder && (
                            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                <div className="flex items-center justify-between">
                                    <span className="text-blue-700 font-medium">{selectedItems.length} fișier(e) selectat(e)</span>
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

                        {!selectedFolder ? (
                            <div className="text-center py-12">
                                <Folder className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">Selectează un folder</h3>
                                <p className="text-gray-500">Alege un folder din stânga pentru a vedea conținutul și a încărca fișiere.</p>
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
                                                    <th className="px-6 py-3 text-left w-12"><input type="checkbox" checked={filteredFiles.length > 0 && selectedItems.length === filteredFiles.length} onChange={selectAll} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" /></th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nume</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data Modificării</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tip</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mărime</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {filteredFiles.map((file) => (
                                                    <tr key={file.name} className={`hover:bg-gray-50 cursor-pointer ${selectedItems.includes(file.name) ? 'bg-blue-50' : ''}`} onClick={() => toggleSelection(file.name)}>
                                                        <td className="px-6 py-4"><input type="checkbox" checked={selectedItems.includes(file.name)} onChange={() => { }} onClick={(e) => e.stopPropagation()} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" /></td>
                                                        <td className="px-6 py-4 whitespace-nowrap"><div className="flex items-center"><FileText className="w-5 h-5 text-red-500 mr-3 flex-shrink-0" /><span className="text-sm font-medium text-gray-900 truncate">{file.name}</span></div></td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{file.dateModified}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Fișier PDF</td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{file.size}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                                {viewMode === 'grid' && filteredFiles.length > 0 && (
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                                        {filteredFiles.map((file) => (
                                            <div key={file.name} className={`bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md cursor-pointer transition-shadow ${selectedItems.includes(file.name) ? 'ring-2 ring-blue-500 bg-blue-50' : ''}`} onClick={() => toggleSelection(file.name)}>
                                                <div className="flex flex-col items-center text-center">
                                                    <FileText className="w-12 h-12 text-red-500 mb-3" /><h3 className="text-sm font-medium text-gray-900 mb-1 line-clamp-2">{file.name}</h3><p className="text-xs text-gray-500">{file.dateModified}</p><p className="text-xs text-gray-400 mt-1">{file.size}</p>
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
                                        {!searchTerm && (
                                            <label htmlFor="pdf-upload" className="inline-flex items-center px-4 py-2 mt-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer"><Upload className="w-4 h-4 mr-2" />Încarcă primul PDF</label>
                                        )}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
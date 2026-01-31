"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Menu, X, FileText, UploadCloud, Home, Download, Trash2, Pencil, FolderSearch, Filter, Check, FolderOpen, Save, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";

// --- Tipuri ---
interface StoredFile {
    id: number;
    name: string;
}

type ActiveFilters = {
    [colIndex: number]: Set<string>;
};

// --- Buton ---
function Button({ children, className = "", ...props }: any) {
    return (
        <button
            type="button"
            className={`inline-flex items-center justify-center rounded-md border border-gray-300 px-3 py-2 text-sm font-medium shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none ${className}`}
            {...props}
        >
            {children}
        </button>
    );
}
// --- Upload Excel ---
function ExcelUploadButton({ onChange }: { onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) {
    return (
        <label className="cursor-pointer inline-flex flex-col items-center space-y-2 bg-blue-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-blue-700 transition duration-200 shadow-md">
            <UploadCloud className="w-5 h-5" />
            <span>Încarcă Excel</span>
            <input
                type="file"
                accept=".xlsx,.xls"
                onChange={onChange}
                className="hidden"
            />
        </label>
    );
}

// --- FilterMenu ---
interface FilterMenuProps {
    colIndex: number;
    allData: any[][];
    activeSelections: Set<string>;
    onApply: (colIndex: number, selections: Set<string>) => void;
    onClose: () => void;
}

const FilterMenu = ({ colIndex, allData, activeSelections, onApply, onClose }: FilterMenuProps) => {
    const menuRef = useRef<HTMLDivElement>(null);

    const uniqueValues = useMemo(() => {
        const values = new Set<string>();
        allData.forEach((row, idx) => {
            if (idx === 0 || idx === 1) return;
            const value = row[colIndex] == null ? '' : String(row[colIndex]);
            values.add(value);
        });
        const arrayValues = Array.from(values);
        const isNumeric = arrayValues.every(v => v === '' || !isNaN(Number(v)));
        return arrayValues.sort((a, b) => {
            if (isNumeric) {
                const aNum = a === '' ? Number.NEGATIVE_INFINITY : Number(a);
                const bNum = b === '' ? Number.NEGATIVE_INFINITY : Number(b);
                return aNum - bNum;
            } else {
                return a.localeCompare(b, 'ro', { numeric: true });
            }
        });
    }, [allData, colIndex]);

    const [tempSelections, setTempSelections] = useState<Set<string>>(new Set(activeSelections));
    const isAllSelected = tempSelections.size === uniqueValues.length;

    const handleSelectAll = () => {
        if (isAllSelected) {
            setTempSelections(new Set());
        } else {
            setTempSelections(new Set(uniqueValues));
        }
    };

    const handleToggle = (value: string) => {
        setTempSelections(prev => {
            const newSelections = new Set(prev);
            if (newSelections.has(value)) {
                newSelections.delete(value);
            } else {
                newSelections.add(value);
            }
            return newSelections;
        });
    };

    const applyFilter = () => {
        if (tempSelections.size === uniqueValues.length) {
            onApply(colIndex, new Set());
        } else {
            onApply(colIndex, tempSelections);
        }
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [onClose]);

    return (
        <div
            ref={menuRef}
            className="absolute top-full left-0 mt-1 w-60 bg-white border border-gray-300 rounded-md shadow-lg z-50"
            onClick={(e) => e.stopPropagation()}
        >
            <div className="p-2 border-b">
                <label className="flex items-center space-x-2 cursor-pointer text-sm font-medium text-blue-600 hover:text-blue-800">
                    <input
                        type="checkbox"
                        checked={isAllSelected}
                        onChange={handleSelectAll}
                        className="form-checkbox h-4 w-4 text-blue-600"
                    />
                    <span>(Select All)</span>
                </label>
            </div>
            <div className="max-h-60 overflow-y-auto p-2">
                {uniqueValues.map(value => (
                    <label key={value} className="flex items-center space-x-2 p-1 cursor-pointer hover:bg-gray-100 rounded">
                        <input
                            type="checkbox"
                            checked={tempSelections.has(value)}
                            onChange={() => handleToggle(value)}
                            className="form-checkbox h-4 w-4 text-blue-600"
                        />
                        <span className="text-sm text-gray-800 truncate" title={value}>
                            {value === '' ? '(Blanks)' : value}
                        </span>
                    </label>
                ))}
            </div>
            <div className="p-2 border-t flex justify-end space-x-2">
                <Button onClick={applyFilter} className="bg-green-500 text-white hover:bg-green-600">
                    <Check className="w-4 h-4 mr-1" /> OK
                </Button>
                <Button onClick={onClose} className="bg-gray-200 hover:bg-gray-300">
                    Anulează
                </Button>
            </div>
        </div>
    );
};

// --- VALIDARE ---
function validateCell(
    cellValue: any,
    colIndex: number,
    rowIndex: number,
    worksheetName: string,
    sheetNames: string[],
    row?: any[]
) {
    if (rowIndex === 0 || rowIndex === 1) return null;

    // Validează doar pe worksheet-ul 1 (primul din sheetNames)
    if (worksheetName !== sheetNames[0]) return null;

    const value = (cellValue ?? '').toString().trim();

    // Validare: al treilea caracter din prima coloană == coloana 2
    if (colIndex === 0 && row) {
        const col2 = (row[1] ?? '').toString().trim().toUpperCase();
        const thirdChar = value.length >= 3 ? value[2].toUpperCase() : '';
        if (col2 && thirdChar && thirdChar !== col2) {
            return `A treia literă (${thirdChar}) nu corespunde cu coloana 2 (${col2})`;
        }
    }
    // Reguli comune
    if (colIndex === 1) {
        if (!['P', 'S', 'L'].includes(value)) {
            return "Valoarea trebuie să fie P, S sau L";
        }
    }
    if (colIndex === 2) {
        if (!/^PP$|^P\d+$/.test(value)) return "Trebuie să fie PP sau P1, P2, ...";
    }
    if (colIndex === 5) {
        if (!/^[\d,.]+$/.test(value)) return "Doar cifre, , și .";
    }
    if (colIndex === 6) {
        if (!/^[\d.]+$/.test(value)) return "Doar cifre și .";
    }
    if (colIndex === 8) {
        if (!/^\d{2}\/\d{2}\/\d{4}$/.test(value)) return "Format dată: DD/MM/YYYY";
    }
    if (colIndex === 9) {
        if (!/^\d{2}\/\d{2}\/\d{4}$/.test(value)) return "Format dată: DD/MM/YYYY";
    }
    if (colIndex === 10) {
        if (!/^online$|^offline$/i.test(value)) return "Doar online sau offline";
    }

    return null;
}

type ActionsDropdownProps = {
    onEdit: () => void;
    onSave: () => void;
    onDownload: () => void;
    onUpload: () => void;
    onDelete: () => void;
    disabled?: boolean;
};

function ActionsDropdown({
    onEdit,
    onSave,
    onDownload,
    onUpload,
    onDelete,
    disabled = false,
}: ActionsDropdownProps) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                setOpen(false);
            }
        }
        if (open) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [open]);

    return (
        <div className="relative" ref={ref}>
            <Button
                className="bg-blue-700 text-white hover:bg-blue-800"
                onClick={() => setOpen((v) => !v)}
                disabled={disabled}
            >
                <span className="mr-2">Acțiuni</span>
                <svg className="w-4 h-4 inline" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M5.25 7.5L10 12.25L14.75 7.5H5.25Z" />
                </svg>
            </Button>
            {open && (
                <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-200 rounded shadow-lg z-50">
                    <button
                        className="w-full text-left px-4 py-2 hover:bg-green-50 flex items-center text-green-700 font-semibold"
                        onClick={() => { setOpen(false); onEdit(); }}
                    >
                        <Pencil className="w-4 h-4 mr-2 text-green-700" /> Editează
                    </button>
                    <button
                        className="w-full text-left px-4 py-2 hover:bg-blue-50 flex items-center text-blue-700 font-semibold"
                        onClick={() => { setOpen(false); onSave(); }}
                    >
                        <Save className="w-4 h-4 mr-2 text-blue-700" /> Salvează
                    </button>
                    <button
                        className="w-full text-left px-4 py-2 hover:bg-yellow-50 flex items-center text-yellow-600 font-semibold"
                        onClick={() => { setOpen(false); onDownload(); }}
                    >
                        <Download className="w-4 h-4 mr-2 text-yellow-600" /> Download
                    </button>
                    <button
                        className="w-full text-left px-4 py-2 hover:bg-purple-50 flex items-center text-purple-700 font-semibold"
                        onClick={() => { setOpen(false); onUpload(); }}
                    >
                        <Upload className="w-4 h-4 mr-2 text-purple-700" /> Upload
                    </button>
                    <button
                        className="w-full text-left px-4 py-2 hover:bg-red-50 flex items-center text-red-700 font-semibold"
                        onClick={() => { setOpen(false); onDelete(); }}
                    >
                        <Trash2 className="w-4 h-4 mr-2 text-red-700" /> Șterge
                    </button>
                </div>
            )}
        </div>
    );
}


// --- Componenta principală ---
const PaapPage = () => {
    const [menuState, setMenuState] = useState<"closed" | "open">("closed");
    const [excelData, setExcelData] = useState<any[][]>([]);
    const [sheetNames, setSheetNames] = useState<string[]>([]);
    const [selectedSheet, setSelectedSheet] = useState<string | null>(null);
    const [allSheetsData, setAllSheetsData] = useState<{ [sheet: string]: any[][] }>({});
    const [editMode, setEditMode] = useState(false);
    const [fileName, setFileName] = useState<string | null>(null);
    const [storedFiles, setStoredFiles] = useState<StoredFile[]>([]);
    const [currentFileIndex, setCurrentFileIndex] = useState<number | null>(null);
    const [sortAsc, setSortAsc] = useState<boolean | null>(null);
    const [lockedRows, setLockedRows] = useState<number>(0);
    const [sumePAAP, setSumePAAP] = useState({ produse: 0, servicii: 0, lucrari: 0, intreg: 0 });
    const [numInitialRows, setNumInitialRows] = useState(0);
    const [isUploaded, setIsUploaded] = useState(false);
    const [isLockedAfterUpload, setIsLockedAfterUpload] = useState(false);

    // --- Filtrare ---
    const [activeFilters, setActiveFilters] = useState<ActiveFilters>({});
    const [filterMenuOpenColIndex, setFilterMenuOpenColIndex] = useState<number | null>(null);

    const router = useRouter();

    const toggleMenu = () => {
        setMenuState(prev => prev === "closed" ? "open" : "closed");
    };

    const handleAddRow = () => {
        setExcelData((prev: any[][]) => {
            const emptyRow = Array(prev[0]?.length || 12).fill("");
            const newData = [...prev, emptyRow];
            setAllSheetsData((prevSheets: { [sheet: string]: any[][] }) => {
                const updatedSheets = {
                    ...prevSheets,
                    [selectedSheet!]: newData
                };
                // Actualizează worksheetul 4 cu sumele
                return updateWorksheet4Sums(updatedSheets, sheetNames);
            });
            return newData;
        });
    };

    const handleUploadDetaliat = async () => {
        console.log('🚀 [UPLOAD] Starting handleUploadDetaliat');

        // 1. Confirmarea
        const confirmUpload = window.confirm("Sigur dorești să faci upload în baza de date?");
        if (!confirmUpload) {
            console.log('❌ [UPLOAD] User cancelled upload');
            return;
        }

        console.log('✅ [UPLOAD] User confirmed upload');
        console.log('📊 [UPLOAD] Current state:');
        console.log('  - fileName:', fileName);
        console.log('  - sheetNames:', sheetNames);
        console.log('  - allSheetsData keys:', Object.keys(allSheetsData));

        // 2. Generare Excel
        try {
            console.log('📝 [UPLOAD] Generating Excel workbook...');
            const wb = XLSX.utils.book_new();
            Object.entries(allSheetsData).forEach(([sheet, data]) => {
                console.log(`  - Adding sheet "${sheet}" with ${data.length} rows`);
                const ws = XLSX.utils.aoa_to_sheet(data);
                XLSX.utils.book_append_sheet(wb, ws, sheet);
            });
            const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
            console.log('✅ [UPLOAD] Excel workbook generated successfully');

            // 3. Upload detaliat
            console.log('📤 [UPLOAD] Preparing FormData for detailed upload...');
            const formData = new FormData();
            formData.append("file", new Blob([wbout], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), (fileName || "paap") + "_detaliat.xlsx");

            console.log('🌐 [UPLOAD] Sending request to /api/paap_detaliat...');
            const resp = await fetch('/api/paap_detaliat', {
                method: "POST",
                body: formData,
            });

            console.log('📨 [UPLOAD] Detailed upload response status:', resp.status);

            if (!resp.ok) {
                const errorData = await resp.json();
                console.error('❌ [UPLOAD] Detailed upload failed:', errorData);
                alert("Eroare la upload detaliat: " + (errorData.error || "necunoscută"));
                return;
            }

            console.log('✅ [UPLOAD] Detailed upload successful');

            // 4. Verificare și procesare totaluri
            console.log('🔍 [UPLOAD] Checking for totaluri data...');
            console.log('  - sheetNames.length:', sheetNames.length);
            console.log('  - sheetNames[1]:', sheetNames[1]);
            console.log('  - allSheetsData[sheetNames[1]] exists:', !!allSheetsData[sheetNames[1]]);

            if (sheetNames[1] && allSheetsData[sheetNames[1]]) {
                const ws4 = allSheetsData[sheetNames[1]];
                console.log('📋 [UPLOAD] Worksheet 4 data:');
                console.log('  - Total rows:', ws4.length);
                console.log('  - First 10 rows:', ws4.slice(0, 10));

                if (ws4.length > 5) {
                    console.log('📊 [UPLOAD] Processing totaluri from rows 2-5...');

                    const totaluri = [2, 3, 4, 5].map(idx => {
                        const row = ws4[idx] || [];
                        const tip = row[0] ? row[0].toString().trim() : '';
                        const sumaStr = row[1] ? row[1].toString().trim() : '0';
                        const suma = parseFloat(sumaStr.replace(/\./g, '').replace(',', '.')) || 0;

                        console.log(`  Row ${idx}: ["${row[0]}", "${row[1]}"] => tip="${tip}", suma=${suma}`);
                        return { tip, suma };
                    }).filter(t => {
                        const isValid = t.tip && t.tip.length > 0;
                        console.log(`  Filtering: tip="${t.tip}", suma=${t.suma} => ${isValid ? 'KEEP' : 'REMOVE'}`);
                        return isValid;
                    });

                    console.log('📊 [UPLOAD] Final totaluri to send:', totaluri);

                    if (totaluri.length === 0) {
                        console.warn('⚠️ [UPLOAD] No valid totaluri found to send');
                        alert("Nu s-au găsit totaluri valide în worksheet 4!");
                        return;
                    }

                    // 5. Trimitere totaluri
                    console.log('🌐 [UPLOAD] Sending totaluri to /api/paap_totaluri...');
                    console.log('📤 [UPLOAD] Request payload:', JSON.stringify({ totaluri }, null, 2));

                    const totaluriResp = await fetch('/api/paap_totaluri', {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Accept": "application/json"
                        },
                        body: JSON.stringify({ totaluri })
                    });

                    console.log('📨 [UPLOAD] Totaluri response status:', totaluriResp.status);
                    console.log('📨 [UPLOAD] Totaluri response headers:', [...totaluriResp.headers.entries()]);

                    const totaluriData = await totaluriResp.json();
                    console.log('📨 [UPLOAD] Totaluri response data:', totaluriData);

                    if (!totaluriResp.ok) {
                        console.error('❌ [UPLOAD] Totaluri upload failed:', totaluriData);
                        alert("Eroare la salvarea totalurilor: " + (totaluriData.error || "necunoscută"));
                        return;
                    } else {
                        console.log('✅ [UPLOAD] Totaluri saved successfully');
                    }
                } else {
                    console.warn('⚠️ [UPLOAD] Worksheet 4 does not have enough rows (need > 5, got ' + ws4.length + ')');
                    alert("Worksheet 4 nu are suficiente rânduri pentru totaluri!");
                }
            } else {
                console.warn('⚠️ [UPLOAD] Worksheet 4 not found or empty');
                if (!sheetNames[1]) {
                    console.warn('  - sheetNames[1] is undefined');
                }
                if (!allSheetsData[sheetNames[1]]) {
                    console.warn('  - allSheetsData[sheetNames[1]] is undefined');
                }
                alert("Nu s-a găsit worksheet 4 cu totalurile!");
            }

            // 6. Success
            console.log('🎉 [UPLOAD] Upload process completed successfully');
            alert("Datele au fost încărcate în baza de date detaliată și totalurile au fost salvate!");
            setIsLockedAfterUpload(true);

        } catch (error) {
            console.error('💥 [UPLOAD] Fatal error during upload:', error);
            if (typeof error === "object" && error !== null && "stack" in error) {
                console.error('Stack trace:', (error as { stack?: string }).stack);
            }
            if (error instanceof Error) {
                alert("Eroare la upload: " + error.message);
            } else {
                alert("Eroare la upload: " + String(error));
            }
        }
    };

    function updateWorksheet4Sums(
        sheets: { [sheet: string]: any[][] },
        sheetNames: string[]
    ): { [sheet: string]: any[][] } {
        if (sheetNames.length < 2) return sheets;

        const ws1 = sheets[sheetNames[0]] || [];

        let sumaProduse = 0, sumaServicii = 0, sumaLucrari = 0;

        for (let r = 2; r < ws1.length; r++) {
            const tip = (ws1[r][1] ?? '').toString().trim().toUpperCase();
            const val = (ws1[r][5] ?? '').toString().replace(/\./g, '').replace(',', '.');
            const num = parseFloat(val);
            if (!isNaN(num)) {
                if (tip === 'P') sumaProduse += num;
                if (tip === 'S') sumaServicii += num;
                if (tip === 'L') sumaLucrari += num;
            }
        }

        const ws2 = sheets[sheetNames[1]] ? sheets[sheetNames[1]].map((row: any[]) => [...row]) : [];
        while (ws2.length < 6) ws2.push([]);

        // Nu modificăm header/subheader
        ws2[2][0] = "Achiz Produse";
        ws2[2][1] = sumaProduse.toLocaleString("ro-RO", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        ws2[3][0] = "Achiz Servicii";
        ws2[3][1] = sumaServicii.toLocaleString("ro-RO", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        ws2[4][0] = "Achiz Lucrari";
        ws2[4][1] = sumaLucrari.toLocaleString("ro-RO", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        ws2[5][0] = "Achiz Intreg";
        ws2[5][1] = (sumaProduse + sumaServicii + sumaLucrari).toLocaleString("ro-RO", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

        return {
            ...sheets,
            [sheetNames[1]]: ws2,
        };
    }
    const handleSelectFile = async (idx: number) => {
        const file = storedFiles[idx];
        if (!file) return;

        setCurrentFileIndex(idx);
        setFileName(file.name);

        const resp = await fetch(`/api/paap?download=${encodeURIComponent(file.name)}`);
        if (!resp.ok) {
            alert("Nu s-a putut descărca fișierul!");
            setSheetNames([]);
            setSelectedSheet(null);
            setAllSheetsData({});
            setExcelData([]);
            return;
        }
        const blob = await resp.blob();
        const arrayBuffer = await blob.arrayBuffer();
        const wb = XLSX.read(arrayBuffer, { type: "array" });

        const sheets: { [sheet: string]: any[][] } = {};
        const names: string[] = [];

        wb.SheetNames.forEach(sheetName => {
            const ws = wb.Sheets[sheetName];
            const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
            sheets[sheetName] = data as any[][];
            names.push(sheetName);
        });

        // --- Actualizează sumele și worksheet-ul 2 ---

        const updatedSheets = updateWorksheet4Sums(sheets, names);

        setSheetNames(names);
        setAllSheetsData(updatedSheets);
        if (names.length > 0) {
            setSelectedSheet(names[0]);
            setExcelData(updatedSheets[names[0]]);
            setSumePAAP(calcSumePAAP(updatedSheets[names[0]]));
            setNumInitialRows(updatedSheets[names[0]].length);
            setIsLockedAfterUpload(false);
        }
    };

    useEffect(() => {
        fetch('/api/paap', { credentials: "include" })
            .then(res => res.json())
            .then(async (files) => {
                setStoredFiles(files);
                if (files.length > 0) {
                    // Selectează ultimul fișier (cel mai nou)
                    const lastIdx = 0; // dacă lista e deja sortată descrescător după updated_at
                    setCurrentFileIndex(lastIdx);
                    setFileName(files[lastIdx].name);

                    // Încarcă automat datele Excel pentru ultimul fișier
                    const resp = await fetch(`/api/paap?download=${encodeURIComponent(files[lastIdx].name)}`);
                    if (!resp.ok) {
                        setSheetNames([]);
                        setSelectedSheet(null);
                        setAllSheetsData({});
                        setExcelData([]);
                        return;
                    }
                    const blob = await resp.blob();
                    const arrayBuffer = await blob.arrayBuffer();
                    const wb = XLSX.read(arrayBuffer, { type: "array" });

                    const sheets: { [sheet: string]: any[][] } = {};
                    const names: string[] = [];

                    wb.SheetNames.forEach(sheetName => {
                        const ws = wb.Sheets[sheetName];
                        const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
                        sheets[sheetName] = data as any[][];
                        names.push(sheetName);
                    });

                    const updatedSheets = updateWorksheet4Sums(sheets, names);

                    setSheetNames(names);
                    setAllSheetsData(updatedSheets);
                    if (names.length > 0) {
                        setSelectedSheet(names[0]);
                        setExcelData(updatedSheets[names[0]]);
                        setSumePAAP(calcSumePAAP(updatedSheets[names[0]]));
                        setNumInitialRows(updatedSheets[names[0]].length);
                        setIsLockedAfterUpload(false);
                    }
                }
            });
    }, []);

    // Upload Excel
    const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (evt) => {
            const bstr = evt.target?.result;
            const wb = XLSX.read(bstr, { type: "binary" });

            // Calculează NR_Inregistari pe primele 3 worksheeturi
            let NR_Inregistari = 0;
            for (let i = 0; i < Math.min(3, wb.SheetNames.length); i++) {
                const sheet = wb.Sheets[wb.SheetNames[i]];
                const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
                NR_Inregistari += Math.max(0, data.length - 2);
            }



            const formData = new FormData();
            formData.append("file", file);
            formData.append("name", file.name);
            formData.append("user", "test");
            formData.append("NR_Inregistari", NR_Inregistari.toString());

            await fetch('/api/paap', {
                method: "POST",
                body: formData
            });

            // Reîncarcă lista de fișiere
            const files = await fetch('/api/paap').then(res => res.json());
            setStoredFiles(files);
            setCurrentFileIndex(files.length - 1);

            // Încarcă și datele Excel pentru fișierul nou
            const resp = await fetch(`/api/paap?download=${encodeURIComponent(file.name)}`);
            if (!resp.ok) {
                alert("Nu s-a putut descărca fișierul!");
                return;
            }
            const blob = await resp.blob();
            const arrayBuffer = await blob.arrayBuffer();
            const wb2 = XLSX.read(arrayBuffer, { type: "array" });

            const sheets: { [sheet: string]: any[][] } = {};
            const names: string[] = [];

            wb2.SheetNames.forEach(sheetName => {
                const ws = wb2.Sheets[sheetName];
                const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
                sheets[sheetName] = data as any[][];
                names.push(sheetName);
            });
            setFileName(file.name);
            const updatedSheets = updateWorksheet4Sums(sheets, names);
            setSheetNames(names);
            setAllSheetsData(updatedSheets);
            if (names.length > 0) {
                setSelectedSheet(names[0]);
                setExcelData(updatedSheets[names[0]]);
                setSumePAAP(calcSumePAAP(updatedSheets[names[0]]));
                setNumInitialRows(updatedSheets[names[0]].length); // <-- ADAUGĂ ASTA
            }
        };
        reader.readAsBinaryString(file);
    }, []);

    const handleSheetSelect = (sheet: string) => {
        setSelectedSheet(sheet);
        setExcelData(allSheetsData[sheet] || []);
        setActiveFilters({});
        setFilterMenuOpenColIndex(null);
    };

    const sortFilesByName = useCallback((ascending: boolean) => {
        const sorted = [...storedFiles].sort((a, b) =>
            ascending ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
        );
        setStoredFiles(sorted);
        setSortAsc(ascending);
    }, [storedFiles]);

    // Calculează sumele pentru produse, servicii, lucrari, intreg din worksheet
    function calcSumePAAP(data: any[][]) {
        let produse = 0, servicii = 0, lucrari = 0;
        for (let r = 2; r < data.length; r++) {
            const tip = (data[r][1] ?? '').toString().trim().toUpperCase();
            const val = (data[r][5] ?? '').toString().replace(/\./g, '').replace(',', '.');
            const num = parseFloat(val);
            if (!isNaN(num)) {
                if (tip === 'P') produse += num;
                if (tip === 'S') servicii += num;
                if (tip === 'L') lucrari += num;
            }
        }
        return {
            produse,
            servicii,
            lucrari,
            intreg: produse + servicii + lucrari
        };
    }

    const handleCellChange = (value: string, rowIndex: number, colIndex: number) => {
        setExcelData(prev => {
            const newData = prev.map(row => [...row]);
            newData[rowIndex][colIndex] = value;

            // === AUTOSAVE LOCAL ===
            // Creează un storageKey unic pentru fișier și sheet (poți folosi fileName și selectedSheet)
            if (fileName && selectedSheet) {
                const storageKey = `autosave_paap_${fileName}_${selectedSheet}`;
                try {
                    localStorage.setItem(storageKey, JSON.stringify(newData));
                } catch (e) {
                    console.error("Eroare la autosave:", e);
                }
            }

            setAllSheetsData(prevSheets => {
                const updatedSheets = {
                    ...prevSheets,
                    [selectedSheet!]: newData
                };
                // Actualizează sumele pentru interfață
                if (sheetNames.length > 0) {
                    setSumePAAP(calcSumePAAP(updatedSheets[sheetNames[0]] || []));
                }
                return updateWorksheet4Sums(updatedSheets, sheetNames);
            });
            return newData;
        });
    };

    useEffect(() => {
        if (fileName && selectedSheet) {
            const storageKey = `autosave_paap_${fileName}_${selectedSheet}`;
            const saved = localStorage.getItem(storageKey);
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    setExcelData(parsed);
                } catch { }
            }
        }
         
    }, [fileName, selectedSheet]);

    const handleDownload = () => {
        const wb = XLSX.utils.book_new();
        Object.entries(allSheetsData).forEach(([sheet, data]) => {
            const ws = XLSX.utils.aoa_to_sheet(data);
            XLSX.utils.book_append_sheet(wb, ws, sheet);
        });
        XLSX.writeFile(wb, (fileName || "paap") + "_editat.xlsx");
    };

    const handleDelete = async () => {
        if (currentFileIndex === null) return;
        const file = storedFiles[currentFileIndex];
        if (!file?.id) {
            alert("Nu există id pentru fișierul selectat!");
            return;
        }

        // Confirmare înainte de ștergere
        const confirmDelete = window.confirm(`Sigur vrei să ștergi fișierul "${file.name}"?`);
        if (!confirmDelete) return;

        // Șterge din baza de date
        const resp = await fetch('/api/paap', {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: file.id })
        });

        const data = await resp.json();

        if (data.success) {
            alert("Fișierul a fost șters cu succes!");
        } else {
            alert("Eroare la ștergere: " + (data.error || "necunoscută"));
        }

        // Reîncarcă lista de fișiere
        const files = await fetch('/api/paap').then(res => res.json());
        setStoredFiles(files);

        // Dacă mai există fișiere, selectează primul
        if (files.length > 0) {
            setCurrentFileIndex(0);
            setFileName(files[0].name);
            setSheetNames([]);
            setSelectedSheet(null);
            setAllSheetsData({});
            setExcelData([]);
        } else {
            setCurrentFileIndex(null);
            setFileName(null);
            setSheetNames([]);
            setSelectedSheet(null);
            setAllSheetsData({});
            setExcelData([]);
        }
    };

    // --- Filtrare ---
    const handleApplyFilter = useCallback((colIndex: number, selectedValues: Set<string>) => {
        setActiveFilters(prev => {
            const newFilters = { ...prev };
            if (selectedValues.size > 0) {
                newFilters[colIndex] = selectedValues;
            } else {
                delete newFilters[colIndex];
            }
            return newFilters;
        });
        setFilterMenuOpenColIndex(null);
    }, []);

    const handleFilterIconClick = (e: React.MouseEvent, colIndex: number) => {
        e.stopPropagation();
        if (filterMenuOpenColIndex === colIndex) {
            setFilterMenuOpenColIndex(null);
        } else {
            setFilterMenuOpenColIndex(colIndex);
        }
    };

    // --- Filtrare date ---
    const filteredData = useMemo(() => {
        if (excelData.length === 0) return [];
        const headerRows = excelData.slice(0, 2);
        const filteredRows = excelData
            .slice(2)
            .filter(row =>
                Object.entries(activeFilters).every(([colIndexStr, filterValues]) => {
                    const colIndex = parseInt(colIndexStr);
                    const cellValue = row[colIndex] == null ? '' : String(row[colIndex]);
                    return filterValues.has(cellValue);
                })
            );
        return [...headerRows, ...filteredRows];
    }, [excelData, activeFilters]);

    // --- Validare ---
    const validationErrors = useMemo(() => {
        const errors: { [rowIndex: number]: { [colIndex: number]: string } } = {};
        if (!selectedSheet) return errors;
        const wsIndex = sheetNames.indexOf(selectedSheet);
        if (wsIndex > 2) return errors;
        filteredData.forEach((row, rowIndex) => {
            row.forEach((cell, colIndex) => {
                const err = validateCell(cell, colIndex, rowIndex, selectedSheet, sheetNames, row);
                if (err) {
                    if (!errors[rowIndex]) errors[rowIndex] = {};
                    errors[rowIndex][colIndex] = err;
                }
            });
        });
        return errors;
    }, [filteredData, selectedSheet, sheetNames]);

    const allWorksheetsValidationErrors = useMemo(() => {
        let total = 0;
        if (!allSheetsData || !Array.isArray(sheetNames) || sheetNames.length === 0) return 0;
        for (const sheet of sheetNames.slice(0, 3)) {
            const data = allSheetsData[sheet] || [];
            data.forEach((row, rowIndex) => {
                row.forEach((cell, colIndex) => {
                    const err = validateCell(cell, colIndex, rowIndex, sheet, sheetNames);
                    if (err) total++;
                });
            });
        }
        return total;
    }, [allSheetsData, sheetNames]);

    const totalValidationErrors = useMemo(() => {
        let count = 0;
        Object.values(validationErrors).forEach(rowErr =>
            count += Object.keys(rowErr).length
        );
        return count;
    }, [validationErrors]);

    const handleSave = async () => {
        const confirmSave = window.confirm("Sigur dorești să salvezi modificările?");
        if (!confirmSave) return;
        if (currentFileIndex === null) return;
        const file = storedFiles[currentFileIndex];

        // 1. Sincronizează sheetul curent în allSheetsData
        const updatedSheets = {
            ...allSheetsData,
            [selectedSheet!]: excelData
        };

        // 2. Generează fișierul Excel cu toate sheet-urile
        const wb = XLSX.utils.book_new();
        Object.entries(updatedSheets).forEach(([sheet, data]) => {
            const ws = XLSX.utils.aoa_to_sheet(data);
            XLSX.utils.book_append_sheet(wb, ws, sheet);
        });
        const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });

        // 3. Calculează NR_Inregistari doar pentru worksheet-ul 1
        let NR_Inregistari = 0;
        if (sheetNames.length > 0) {
            const data = updatedSheets[sheetNames[0]];
            NR_Inregistari = Math.max(0, (data?.length || 0) - 2);
        }

        // 4. Trimite ca FormData la backend
        const formData = new FormData();
        formData.append("id", file.id.toString());
        formData.append("name", fileName || file.name);
        formData.append("file", new Blob([wbout], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), fileName || file.name);
        formData.append("NR_Inregistari", NR_Inregistari.toString());

        // 5. Salvează pe backend și așteaptă răspunsul
        const saveResp = await fetch('/api/paap', {
            method: "PUT",
            body: formData
        });

        if (!saveResp.ok) {
            alert("Eroare la salvare!");
            return;
        }

        alert("Datele au fost salvate în baza de date!");

        // 6. Reîncarcă lista de fișiere
        const files = await fetch('/api/paap').then(res => res.json());
        setStoredFiles(files);

        // 7. Reîncarcă datele Excel pentru fișierul curent (ca să vezi datele reale din backend)
        const resp = await fetch(`/api/paap?download=${encodeURIComponent(fileName || file.name)}`);
        if (resp.ok) {
            const blob = await resp.blob();
            const arrayBuffer = await blob.arrayBuffer();
            const wb2 = XLSX.read(arrayBuffer, { type: "array" });

            const sheets: { [sheet: string]: any[][] } = {};
            const names: string[] = [];

            wb2.SheetNames.forEach(sheetName => {
                const ws = wb2.Sheets[sheetName];
                const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
                sheets[sheetName] = data as any[][];
                names.push(sheetName);
            });

            const updatedSheets2 = updateWorksheet4Sums(sheets, names);
            setSheetNames(names);
            setAllSheetsData(updatedSheets2);
            if (names.length > 0) {
                setSelectedSheet(names[0]);
                setExcelData(updatedSheets2[names[0]]);
                setSumePAAP(calcSumePAAP(updatedSheets2[names[0]]));
                setNumInitialRows(updatedSheets2[names[0]].length);
                setIsLockedAfterUpload(false);
            }
        }
    };


    // --- Coloane A, B, C... (maxim 12) ---
    const columnHeaders = Array.isArray(filteredData[0])
        ? Array.from({ length: Math.min(filteredData[0].length, 12) }, (_, i) =>
            String.fromCharCode(65 + i)
        )
        : [];

    // --- Render tabel ---
    const renderTable = () => (
        <div
            className="w-full bg-white rounded-lg shadow p-4 h-screen-minus-220 min-h-500 flex flex-col">
            <div className="mb-2 text-sm text-gray-700 font-semibold">
                Total rânduri: {filteredData.length > 2 ? filteredData.length - 2 : 0}
            </div>
            <div
                className="relative w-full flex-1 overflow-x-auto overflow-y-auto pl-8"
                style={{ maxHeight: "calc(78vh - 40px)" }}
            >
                <table className="min-w-max border-collapse border border-gray-300 bg-white">
                    <thead>
                        <tr>
                            <th className="w-12 text-center font-medium text-gray-700 border border-gray-300 md:sticky md:left-0 md:z-20 md:bg-gray-200"></th>
                            {columnHeaders.map((header, colIndex) => {
                                const isFilterActive = !!activeFilters[colIndex];
                                const isMenuOpen = filterMenuOpenColIndex === colIndex;
                                const width = (colIndex === 3 || colIndex === 4) ? "220px" : "120px";
                                return (
                                    <th
                                        key={colIndex}
                                        className="sticky top-0 z-30 border border-gray-300 px-3 py-2 font-semibold text-gray-700 text-center bg-gray-100"
                                        style={{ minWidth: width, width: width }}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span>{header}</span>
                                            <button
                                                onClick={e => handleFilterIconClick(e, colIndex)}
                                                className={`p-1 rounded transition-colors ${isFilterActive ? 'text-blue-600 hover:bg-blue-200' : 'text-gray-400 hover:bg-gray-300'}`}
                                                title="Filtrează"
                                                aria-label={`Filtrează coloana ${header}`}
                                            >
                                                <Filter className="w-4 h-4" />
                                            </button>
                                        </div>
                                        {isMenuOpen && (
                                            <FilterMenu
                                                colIndex={colIndex}
                                                allData={excelData}
                                                activeSelections={activeFilters[colIndex] || new Set()}
                                                onApply={handleApplyFilter}
                                                onClose={() => setFilterMenuOpenColIndex(null)}
                                            />
                                        )}
                                    </th>
                                );
                            })}
                        </tr>
                    </thead>
                    <tbody>
                        {/* Header galben sticky */}
                        {filteredData[0] && (
                            <tr className="bg-yellow-300 text-black" style={{ position: "sticky", top: 0, zIndex: 21 }}>
                                <td
                                    className="w-12 text-center font-medium text-gray-700 border border-gray-300 bg-yellow-300 md:sticky md:left-0 md:z-20"
                                    style={{ background: "#fde047" }}
                                ></td>
                                {filteredData[0].slice(0, 12).map((cell, colIndex) => {
                                    const width = (colIndex === 3 || colIndex === 4) ? "220px" : "120px";
                                    return (
                                        <td
                                            key={colIndex}
                                            className="border px-2 py-1 text-center font-bold text-black bg-yellow-300"
                                            style={{ minWidth: width, width: width }}
                                        >
                                            {cell}
                                        </td>
                                    );
                                })}
                            </tr>
                        )}
                        {/* Subheader galben sticky */}
                        {filteredData[1] && (
                            <tr className="bg-yellow-200 text-black" style={{ position: "sticky", top: 40, zIndex: 20 }}>
                                <td
                                    className="w-12 font-medium border border-gray-300 bg-yellow-200 md:sticky md:left-0 md:z-20"
                                    style={{ background: "#fef08a" }}
                                ></td>
                                {filteredData[1].slice(0, 12).map((cell, colIndex) => {
                                    const width = (colIndex === 3 || colIndex === 4) ? "220px" : "120px";
                                    return (
                                        <td
                                            key={colIndex}
                                            className="border px-2 py-1 text-center font-bold text-black bg-yellow-200"
                                            style={{ minWidth: width, width: width }}
                                        >
                                            {cell}
                                        </td>
                                    );
                                })}
                            </tr>
                        )}
                        {/* restul rândurilor */}
                        {filteredData.slice(2).map((row, rowIndex) => (
                            <tr key={rowIndex + 2}>
                                <td className="w-12 text-center font-medium text-gray-700 border border-gray-300 md:sticky md:left-0 md:z-10 md:bg-gray-100">
                                    {rowIndex + 1}
                                </td>
                                {row.slice(0, 12).map((cell: any, colIndex: number) => {
                                    const error = validationErrors[rowIndex + 2]?.[colIndex];
                                    const width = (colIndex === 3 || colIndex === 4) ? "220px" : "120px";
                                    return (
                                        <td
                                            key={colIndex}
                                            className={`border border-gray-300 px-2 py-1 text-black ${error ? "border-2 border-red-500 bg-red-50" : ""}`}
                                            style={{ minWidth: width, width: width }}
                                            title={error || undefined}
                                        >
                                            {editMode && (rowIndex + 2) >= lockedRows && sheetNames.indexOf(selectedSheet!) < 3 && sheetNames.indexOf(selectedSheet!) !== 1 ? (
                                                isLockedAfterUpload
                                                    ? (
                                                        // Dacă e blocat după upload, doar col 5 editabil la rânduri vechi, la rânduri noi totul editabil
                                                        (rowIndex + 2) < numInitialRows
                                                            ? (colIndex === 5 ? (
                                                                <input
                                                                    type="text"
                                                                    value={cell}
                                                                    onChange={e => handleCellChange(e.target.value, rowIndex + 2, colIndex)}
                                                                    className="w-full px-1 py-0.5 border-0 rounded focus:ring-1 outline-none text-center bg-transparent text-black"
                                                                    style={{ color: "#000000" }}
                                                                />
                                                            ) : (
                                                                <span>
                                                                    {cell}
                                                                    {error && (
                                                                        <span className="ml-1 text-red-500" title={error}>✗</span>
                                                                    )}
                                                                </span>
                                                            ))
                                                            : (
                                                                <input
                                                                    type="text"
                                                                    value={cell}
                                                                    onChange={e => handleCellChange(e.target.value, rowIndex + 2, colIndex)}
                                                                    className="w-full px-1 py-0.5 border-0 rounded focus:ring-1 outline-none text-center bg-transparent text-black"
                                                                    style={{ color: "#000000" }}
                                                                />
                                                            )
                                                    )
                                                    : (
                                                        // Dacă nu e blocat, poți edita orice
                                                        <input
                                                            type="text"
                                                            value={cell}
                                                            onChange={e => handleCellChange(e.target.value, rowIndex + 2, colIndex)}
                                                            className="w-full px-1 py-0.5 border-0 rounded focus:ring-1 outline-none text-center bg-transparent text-black"
                                                            style={{ color: "#000000" }}
                                                        />
                                                    )
                                            ) : (
                                                <span>
                                                    {cell}
                                                    {error && (
                                                        <span className="ml-1 text-red-500" title={error}>✗</span>
                                                    )}
                                                </span>
                                            )}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                        {/* Buton de adăugare rând nou */}
                        <tr>
                            <td className="w-12 text-center border-none bg-transparent md:sticky md:left-0 md:z-10">
                                {editMode && sheetNames.indexOf(selectedSheet!) < 3 && sheetNames.indexOf(selectedSheet!) !== 1 && (
                                    <button
                                        type="button"
                                        onClick={handleAddRow}
                                        className="mx-auto flex items-center justify-center rounded-full bg-blue-600 hover:bg-blue-700 text-white w-8 h-8 shadow transition"
                                        title="Adaugă rând nou"
                                    >
                                        <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                                            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                        </svg>
                                    </button>
                                )}
                            </td>
                            {/* Celule goale pentru restul coloanelor */}
                            {columnHeaders.map((_, colIndex) => (
                                <td key={colIndex}></td>
                            ))}
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );

    return (
        <div className="relative h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 overflow-hidden">
            {/* Butoane dreapta sus, vizibile mereu */}
            <div
                className="fixed top-4 right-4 z-50 flex flex-row gap-3"
                style={{ minWidth: 460, minHeight: 48 }} // rezervă spațiu pentru ambele butoane
            >
                <Button
                    className="bg-blue-700 text-white hover:bg-blue-800 shadow-lg px-5 py-2 font-bold min-w-[220px] min-h-[44px]"
                    onClick={() => router.push('/doc-achizitii')}
                >
                    <FolderOpen className="w-5 h-5 mr-2" />
                    DOSARE ACHIZIȚII
                </Button>
                <Button
                    className="bg-blue-700 text-white hover:bg-blue-800 shadow-lg px-5 py-2 font-bold min-w-[220px] min-h-[44px]"
                    onClick={() => router.push('/rap-achizitii')}
                >
                    <FileText className="w-5 h-5 mr-2" />
                    RAPORT ACHIZIȚII
                </Button>
            </div>
            {/* Mesaj validare sus */}
            {excelData.length > 0 && (
                <div className="w-full flex justify-center items-center pt-8 pb-4">
                    {allWorksheetsValidationErrors === 0 ? (
                        <div className="bg-green-100 border border-green-300 text-green-800 rounded-lg px-4 py-2 flex items-center gap-2 font-semibold">
                            <Check className="w-5 h-5 text-green-600" />
                            Toate worksheet-urile sunt valide!
                        </div>
                    ) : (
                        <div className="bg-red-100 border border-red-300 text-red-800 rounded-lg px-4 py-2 flex items-center gap-2 font-semibold">
                            <span className="font-bold">{allWorksheetsValidationErrors}</span>
                            {allWorksheetsValidationErrors === 1 ? "eroare de validare" : "erori de validare"} în fișier !
                        </div>
                    )}
                </div>
            )}

            {/* Menu Toggle Button */}
            <div className="fixed top-4 left-4 z-50">
                <Button
                    onClick={toggleMenu}
                    className="bg-white shadow-lg border-gray-200 hover:bg-gray-50"
                    aria-label={menuState === "closed" ? "Deschide meniul" : "Închide meniul"}
                >
                    {menuState === "closed" ? (
                        <Menu className="h-5 w-5 text-gray-700" />
                    ) : (
                        <X className="h-5 w-5 text-gray-700" />
                    )}
                </Button>
            </div>

            {/* Sidebar  */}
            <div
                className={`fixed top-0 left-0 h-full w-[280px] bg-white shadow-xl z-40 border-r border-gray-200 transform transition-transform duration-300 ${menuState === "open" ? "translate-x-0" : "-translate-x-full"
                    }`}
            >
                <div className="flex flex-col h-full p-6">
                    <div className="flex justify-center mb-6">
                        <a href="/home" className="inline-flex">
                            <Button className="bg-blue-600 text-white hover:bg-blue-700 shadow-md px-4 py-2">
                                <Home className="w-4 h-4 mr-2" />
                                Home
                            </Button>
                        </a>
                    </div>

                    <div className="text-center mb-6">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FileText className="w-8 h-8 text-blue-600" />
                        </div>
                        <h1 className="text-xl font-bold text-gray-900">Fișiere PAAP</h1>
                    </div>

                    <div className="flex flex-col gap-3 mb-6">
                        <ExcelUploadButton onChange={handleFileUpload} />

                        <Button
                            onClick={() => sortFilesByName(!(sortAsc ?? true))}
                            className="bg-purple-600 text-white hover:bg-purple-700 w-full"
                        >
                            {sortAsc === null
                                ? "🔃 Sortează fișiere"
                                : sortAsc
                                    ? "⬇️ Alfabetic descrescător"
                                    : "⬆️ Alfabetic crescător"}
                        </Button>
                    </div>

                    <div className="flex-1">
                        <div className="flex items-center mb-2">
                            <FolderSearch className="w-4 h-4 text-gray-600 mr-2" />
                            <span className="text-sm font-medium text-gray-700">Fișiere</span>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3 max-h-64 overflow-y-auto">
                            {storedFiles.length === 0 ? (
                                <p className="text-sm text-gray-500 text-center">Niciun fișier încărcat</p>
                            ) : (
                                storedFiles.map((file, idx) => (
                                    <div
                                        key={file.id}
                                        onClick={() => handleSelectFile(idx)}
                                        className={`cursor-pointer px-3 py-2 rounded-md mb-1 text-sm transition-colors ${currentFileIndex === idx
                                            ? "bg-blue-500 text-white font-medium"
                                            : "hover:bg-gray-200 text-gray-700"
                                            }`}
                                    >
                                        {file.name}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Bara de butoane sus */}
            <div className="w-full flex flex-row flex-wrap gap-2 items-center px-4 pt-4 pb-2 bg-transparent z-30">
                <div className="flex flex-wrap gap-2">
                    {sheetNames.length > 0 && sheetNames.map((sheet) => (
                        <Button
                            key={sheet}
                            onClick={() => handleSheetSelect(sheet)}
                            className={`rounded-md px-3 py-2 text-sm font-medium shadow-sm border ${selectedSheet === sheet
                                ? "bg-blue-600 text-white border-blue-700"
                                : "bg-gray-100 text-gray-700 border-gray-300 hover:bg-blue-100"
                                }`}
                        >
                            {sheet}
                        </Button>
                    ))}
                    {Object.keys(activeFilters).length > 0 && (
                        <Button onClick={() => setActiveFilters({})} className="bg-yellow-500 text-white hover:bg-yellow-600">
                            <X className="w-4 h-4 mr-1" /> Șterge Filtre
                        </Button>
                    )}
                </div>
                <div className="flex-1"></div>
                {excelData.length > 0 && (
                    <ActionsDropdown
                        onEdit={() => setEditMode(prev => !prev)}
                        onSave={handleSave}
                        onDownload={handleDownload}
                        onUpload={handleUploadDetaliat}
                        onDelete={handleDelete}
                    />
                )}
            </div>

            {/* Main content area */}
            {excelData.length > 0 ? (
                renderTable()
            ) : (
                <div
                    className="w-full bg-white rounded-lg shadow p-4 flex flex-col items-center justify-center"
                    style={{ height: `calc(100vh - 220px)`, minHeight: '500px' }}>
                    <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                        <FileText className="w-12 h-12 text-blue-500" />
                    </div>
                    <h2 className="text-lg font-semibold text-gray-700 mb-2">Niciun fișier PAAP încărcat</h2>
                    <p className="text-gray-500 text-sm mb-4 text-center max-w-xs">
                        Încarcă un fișier Excel PAAP folosind butonul din stânga pentru a începe să lucrezi cu datele.
                    </p>
                    <span className="text-xs text-gray-400">Format acceptat: .xlsx, .xls</span>
                    <div className="mt-4">
                        <ExcelUploadButton onChange={handleFileUpload} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default PaapPage;
"use client";

import React, { useState, useEffect, ReactNode, MouseEventHandler, useMemo, useCallback, useRef } from "react";
import { Menu, X, FileText, UploadCloud, FolderSearch, Home, Save, Upload, Download, Trash2, Filter, Check, AlertTriangle, Pencil, ScrollText } from "lucide-react";
import { useRouter } from "next/navigation";





interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  className?: string;
}

interface StoredFile {
  name: string;
  sheetNames: string[];
  sheetsData: { [sheetName: string]: any[][] };
  locked?: boolean;
}


type ActiveFilters = {
  [colIndex: number]: Set<string>;
};

// Interface pentru errori de validare
interface ValidationErrors {
  [rowIndex: number]: {
    [colIndex: number]: string;
  };
}

function Button({ children, onClick, className = "", ...props }: ButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center justify-center rounded-md border border-gray-300 px-3 py-2 text-sm font-medium shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

function ExcelUploadButton({ onChange }: { onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) {
  return (
    <label className="cursor-pointer inline-flex flex-col items-center space-y-2 bg-blue-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-blue-700 transition duration-200 shadow-md">
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



function formatExcelDateToDDMMYYYY(value: any): string {
  // Dacă e deja string în formatul corect, returnează
  if (typeof value === "string" && /^(0[1-9]|[12]\d|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/.test(value)) {
    return value;
  }

  // Dacă e string cu /, încearcă să îl parsezi ca dată
  if (typeof value === "string" && value.includes("/")) {
    // Split și încearcă să vezi dacă e MM/DD/YYYY sau DD/MM/YYYY
    const parts = value.split("/");
    if (parts.length === 3) {
      let day = parts[1], month = parts[0], year = parts[2];
      // Dacă luna > 12, clar e DD/MM/YYYY
      if (parseInt(parts[1], 10) > 12) {
        day = parts[1];
        month = parts[0];
      } else if (parseInt(parts[0], 10) > 12) {
        // Dacă prima parte > 12, clar e DD/MM/YYYY
        day = parts[0];
        month = parts[1];
      } else {
        // Dacă nu, presupunem MM/DD/YYYY (cum face Excel de obicei)
        day = parts[1];
        month = parts[0];
      }
      // Normalizează anul la 4 cifre
      if (year.length === 2) year = "20" + year;
      return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
    }
  }

  // Dacă e string de tip dată (ex: 2024-07-15), încearcă să parsezi
  if (typeof value === "string" && !isNaN(Date.parse(value))) {
    const d = new Date(value);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = String(d.getFullYear());
    return `${day}/${month}/${year}`;
  }

  // Dacă e număr (serial Excel)
  if (typeof value === "number") {
    const excelEpoch = new Date(1899, 11, 30);
    const d = new Date(excelEpoch.getTime() + value * 24 * 60 * 60 * 1000);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = String(d.getFullYear());
    return `${day}/${month}/${year}`;
  }

  return value;
}

// Funcții de validare îmbunătățite
const validateCell = (
  value: any,
  colIndex: number,
  rowIndex: number,
  selectedSheet: string | null,
  isFirstSheet: boolean
): string | null => {
  const stringValue = value == null ? '' : String(value).trim();

  // ✅ Ignoră primul rând
  if (rowIndex === 0 || rowIndex === 1) return null;

  // Validare pentru coloana 2 (Tip contract): trebuie să înceapă cu "AC", "CS","F , "BF", " CM "sau "C" urmat de cifre
  if (isFirstSheet && colIndex === 1 && stringValue && !/^(AC|CS|C|F|BF|CM)\d+$/i.test(stringValue)) {
    return 'Trebuie să înceapă cu "AC", "CS","F , "BF", " CM "sau "C" urmat de cifre (ex: C123, AC456, CS789 )';
  }


  // Validare pentru coloana 3: trebuie să fie de forma PAP01-L01 (3 litere, 2 cifre, -, 1 literă, 2 cifre)
  if (isFirstSheet && colIndex === 2 && stringValue) {
    if (!/^[A-Za-z]{3}\d{2}-[A-Za-z]\d{2}$/.test(stringValue)) {
      return 'Format invalid (ex: PAP01-L01, XYZ99-A01)';
    }
  }

  // Validare specifică pentru coloana 5 (index 4) pe primul worksheet
  if (isFirstSheet && colIndex === 4) {
    if (stringValue && !['B', 'S', 'L'].includes(stringValue.toUpperCase())) {
      return 'Doar literele B, S, L sunt permise';
    }
  }


  //Validare pentru coloana 4: trebuie sa incepa cu "P" si apoi poate sa fie urmat de P sau cifre 

  if (isFirstSheet && colIndex === 3 && stringValue && !/^P(P|\d+)?$/i.test(stringValue)) {
    return 'Trebuie să înceapă cu P și să urmeze fie un P, fie cifre (ex: P, PP, P1, P23)';
  }


  //Validare pentru coloana 7: trebuie sa fie alcatuita din nr si sa fie cu zecimale max 2


  if (isFirstSheet && colIndex === 6 && stringValue) {
    const numberFormatRegex = /^\d{1,3}(\d{3})*(\.\d{1,2})?$|^\d+(\.\d{1,2})?$/;
    if (!numberFormatRegex.test(stringValue)) {
      return 'Trebuie să fie un număr cu maxim 2 zecimale (ex: 10, 10.5, 10.55, 1000.25)';
    }
  }

  //Validare pentru coloana 10: trebuie sa fie alcatuita din nr si sa fie cu zecimale max 2


  if (isFirstSheet && colIndex === 9 && stringValue) {
    const numberFormatRegex = /^\d{1,3}(\d{3})*(\.\d{1,2})?$|^\d+(\.\d{1,2})?$/;
    if (!numberFormatRegex.test(stringValue)) {
      return 'Trebuie să fie un număr cu maxim 2 zecimale (ex: 10, 10.5, 10.55, 1000.25)';
    }
  }

  //Validare pentru coloana 11: Trebuie sa fie alcatuit dein maxim 6 cifre doar
  ///De introdus si cu RO-----------------
  if (isFirstSheet && colIndex === 10 && stringValue) {
    if (!/^\d{1,6}$/.test(stringValue)) {
      return 'Trebuie să fie un număr cu maxim 6 cifre';
    }
  }


  // Coloana 12: DD/MM/YYYY
  if (isFirstSheet && colIndex === 11 && rowIndex > 0 && stringValue && !/^(0[1-9]|[12]\d|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/.test(stringValue)) {
    return 'Coloana 12: Data trebuie să fie în formatul DD/MM/YYYY.';
  }

  // Coloana 15: DD/MM/YYYY
  if (isFirstSheet && colIndex === 14 && rowIndex > 0 && stringValue && !/^(0[1-9]|[12]\d|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/.test(stringValue)) {
    return 'Coloana 15: Data trebuie să fie în formatul DD/MM/YYYY.';
  }
  //Validare Coloana 13 : 
  if (isFirstSheet && colIndex === 12 && rowIndex > 0 && stringValue && !/^(RO)?\d{1,10}$/i.test(stringValue)) {
    return 'CUI trebuie să conțină doar cifre, opțional prefixat cu "RO".';
  }

  return null;
};

// Fct pt det randuri si nr de  coloane ale mat data
function getActualDataDimensions(data: any[][]): { rows: number; cols: number } {
  if (!data || data.length === 0) return { rows: 0, cols: 0 };

  let lastRowWithData = -1;
  for (let i = data.length - 1; i >= 0; i--) {
    if (data[i] && data[i].some(cell => cell !== null && cell !== undefined && cell !== '')) {
      lastRowWithData = i;
      break;
    }
  }

  if (lastRowWithData === -1) return { rows: 0, cols: 0 };

  let maxCols = 0;
  for (let i = 0; i <= lastRowWithData; i++) {
    if (data[i]) {
      for (let j = data[i].length - 1; j >= 0; j--) {
        if (data[i][j] !== null && data[i][j] !== undefined && data[i][j] !== '') {
          maxCols = Math.max(maxCols, j + 1);
          break;
        }
      }
    }
  }

  return { rows: lastRowWithData + 1, cols: maxCols };
}

// Fct pt a da fit la date 
function trimDataToActualSize(data: any[][]): any[][] {
  const { rows, cols } = getActualDataDimensions(data);
  if (rows === 0 || cols === 0) return [];

  return data.slice(0, rows).map(row =>
    row ? row.slice(0, cols) : []
  );
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
            <Pencil className="w-4 h-4 mr-2" /> Editează
          </button>
          <button
            className="w-full text-left px-4 py-2 hover:bg-blue-50 flex items-center text-blue-700 font-semibold"
            onClick={() => { setOpen(false); onSave(); }}
          >
            <Save className="w-4 h-4 mr-2" /> Salvează
          </button>
          <button
            className="w-full text-left px-4 py-2 hover:bg-yellow-50 flex items-center text-yellow-600 font-semibold"
            onClick={() => { setOpen(false); onDownload(); }}
          >
            <Download className="w-4 h-4 mr-2" /> Download
          </button>
          <button
            className="w-full text-left px-4 py-2 hover:bg-purple-50 flex items-center text-purple-700 font-semibold"
            onClick={() => { setOpen(false); onUpload(); }}
          >
            <Upload className="w-4 h-4 mr-2" /> Upload
          </button>
          <button
            className="w-full text-left px-4 py-2 hover:bg-red-50 flex items-center text-red-700 font-semibold"
            onClick={() => { setOpen(false); onDelete(); }}
          >
            <Trash2 className="w-4 h-4 mr-2" /> Șterge
          </button>
        </div>
      )}
    </div>
  );
}


const TableCell = React.memo(({
  cell,
  rowIndex,
  colIndex,
  editMode,
  onCellChange,
  validationError,
  isFirstSheet,
}: {
  cell: any;
  rowIndex: number;
  colIndex: number;
  editMode: boolean;
  onCellChange: (value: string, rowIndex: number, colIndex: number) => void;
  validationError?: string | null;
  isFirstSheet: boolean;
}) => {
  const cellValue = cell == null ? '' : String(cell);
  const isEmpty = cell == null || cell === '';
  const hasError = !!validationError;

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onCellChange(e.target.value, rowIndex, colIndex);
  }, [onCellChange, rowIndex, colIndex]);

  // Verificăm dacă este primul rând – dacă da, afișăm mereu ca text non-editabil
  const isHeaderRow = rowIndex === 0;
  const isSubHeaderRow = rowIndex === 1;

  return (
    <td
      className={`border px-2 py-1 text-center
      ${(isFirstSheet && (isHeaderRow || isSubHeaderRow))
          ? 'bg-yellow-300 font-bold text-gray-800'
          : (isHeaderRow || isSubHeaderRow)
            ? 'bg-gray-100 font-bold text-gray-800'
            : (isEmpty ? 'bg-gray-50' : 'bg-white')}
      ${hasError ? 'border-red-500 border-2' : 'border-gray-300'}
    `}
      style={{ minWidth: '120px', width: '120px' }}
      title={hasError ? validationError : undefined}
    >
      {editMode && !(isHeaderRow || isSubHeaderRow) ? (
        <input
          type="text"
          value={cellValue}
          onChange={handleChange}
          className={`w-full h-full px-1 py-0.5 border-0 rounded focus:ring-1 outline-none text-center bg-transparent text-black ${hasError ? 'focus:ring-red-300' : 'focus:ring-blue-300'
            }`}
          style={{ color: '#000000' }}
        />
      ) : (
        <div className="flex items-center justify-center">
          <span className="block text-center text-sm text-black" style={{ color: '#000000' }}>
            {cellValue}
          </span>
          {hasError && (
            <span title={validationError}>
              <AlertTriangle className="w-4 h-4 text-red-500 ml-1" />
            </span>
          )}
        </div>
      )}
    </td>
  );
});
TableCell.displayName = 'TableCell';


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
      if (idx === 0 || idx === 1) return; // Sari peste header și sub-header
      const value = row[colIndex] == null ? '' : String(row[colIndex]);
      values.add(value);
    });

    const arrayValues = Array.from(values);

    // Verificam daca toate valorile  sunt numere
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





const AchizitiiDocumentsPage = () => {
  const [menuState, setMenuState] = useState("closed");
  const [excelData, setExcelData] = useState<any[][]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string | null>(null);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [storedFiles, setStoredFiles] = useState<StoredFile[]>([]);
  const [currentFileIndex, setCurrentFileIndex] = useState<number | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ username: string, role: string } | null>(null);
  const [sortAsc, setSortAsc] = useState<boolean | null>(null);
  const headerRow1 = excelData[0] || [];
  const headerRow2 = excelData[1] || [];
  const [dbFiles, setDbFiles] = useState<any[]>([]);
  const [selectedDbFileId, setSelectedDbFileId] = useState<string | null>(null);
  const [allSheetsData, setAllSheetsData] = useState<{ [sheetName: string]: any[][] }>({});
  const [allSheetsRawData, setAllSheetsRawData] = useState<{ [sheetName: string]: any[][] }>({});
  const [documentStage, setDocumentStage] = useState<'Draft' | 'Waiting' | 'Trimis' | null>('Draft');
  const [showWaitingPopup, setShowWaitingPopup] = useState(false);
  const [lastSavedFileId, setLastSavedFileId] = useState<string | null>(null);
  const [lastSavedStage, setLastSavedStage] = useState<'Draft' | 'Waiting' | 'Trimis' | null>(null);

  // State pentru validare
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

  // State pentru filtrare
  const [activeFilters, setActiveFilters] = useState<ActiveFilters>({});
  const [filterMenuOpenColIndex, setFilterMenuOpenColIndex] = useState<number | null>(null);

  const [showDbUpload, setShowDbUpload] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (!userStr) {
      // router.push("/login"); // dacă vrei redirect
      return;
    }
    try {
      const userObj = JSON.parse(userStr);
      setCurrentUser(userObj);
    } catch {
      setCurrentUser(null);
    }
  }, []);


  useEffect(() => {
    async function fetchUser() {
      const res = await fetch('/api/me');
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user); // <-- aici setezi DOAR userul, nu tot obiectul
      } else {
        setCurrentUser(null);
      }
    }
    fetchUser();
  }, []);

  // Verificăm dacă suntem pe primul worksheet
  const isFirstSheet = useMemo(() => {
    return selectedSheet === sheetNames[0];
  }, [selectedSheet, sheetNames]);


  const fetchDbFiles = useCallback(async () => {
    if (!currentUser) return;
    // Pentru admin, vezi tot cu userId=ALL
    const userId = currentUser.role === 'admin' ? 'ALL' : currentUser.username;
    const res = await fetch(`/api/files?userId=${userId}`);
    if (res.ok) {
      const files = await res.json();
      setDbFiles(files);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) fetchDbFiles();
  }, [currentUser, fetchDbFiles]);

  // Calculăm erorile de validare
  const calculateValidationErrors = useCallback((data: any[][]) => {
    const errors: ValidationErrors = {};
    data.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        const error = validateCell(cell, colIndex, rowIndex, selectedSheet, isFirstSheet);
        if (error) {
          if (!errors[rowIndex]) {
            errors[rowIndex] = {};
          }
          errors[rowIndex][colIndex] = error;
        }
      });
    });
    return errors;
  }, [editMode, selectedSheet, isFirstSheet]);

  useEffect(() => {
    const errors = calculateValidationErrors(excelData);
    setValidationErrors(errors);
  }, [excelData, calculateValidationErrors]);



  const getStorageKey = useCallback((username: string) => `storedFiles_${username}`, []);

  const dataDimensions = useMemo(() => {
    return getActualDataDimensions(excelData);
  }, [excelData]);


  const columnHeaders = useMemo(() => {
    return Array.from({ length: dataDimensions.cols }, (_, i) => String.fromCharCode(65 + i));
  }, [dataDimensions.cols]);



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


  const handleDeleteDbFile = useCallback(async (fileId: string) => {

    if (!fileId) return;
    const confirmDelete = confirm("Sigur dorești să ștergi acest fișier din baza de date?");
    if (!confirmDelete) return;

    try {
      const res = await fetch(`/api/files/${fileId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        alert("✅ Fișierul a fost șters din baza de date!");
        // Scoate din lista locală
        setDbFiles(prev => prev.filter(f => f.id !== fileId));
        setSelectedDbFileId(null);
        setExcelData([]);
        setSheetNames([]);
        setSelectedSheet(null);
      } else {
        alert("❌ Eroare la ștergerea fișierului din baza de date!");
      }
    } catch (err) {
      alert("❌ Eroare la ștergerea fișierului din baza de date!");
    }
  }, []);

  const filteredData = useMemo(() => {
    if (excelData.length === 0) return [];

    // Păstrează mereu primul rând (header)
    const headerRow = { rowData: excelData[0], originalIndex: 0 };

    // Filtrează DOAR restul rândurilor (de la index 1 încolo)
    const filteredRows = excelData
      .slice(1)
      .map((row, idx) => ({ rowData: row, originalIndex: idx + 1 }))
      .filter(({ rowData }) => {
        return Object.entries(activeFilters).every(([colIndexStr, filterValues]) => {
          const colIndex = parseInt(colIndexStr);
          const cellValue = rowData[colIndex] == null ? '' : String(rowData[colIndex]);
          return filterValues.has(cellValue);
        });
      });

    // Returnează headerul + rândurile filtrate
    return [headerRow, ...filteredRows];
  }, [excelData, activeFilters]);

  // 5. Adaugă și această funcție de debug în handleSelectDbFile:

  const handleSelectDbFile = useCallback(async (fileId: string) => {
    setSelectedDbFileId(fileId);

    try {
      // 1. Info despre fișier (JSON)
      const fileInfoRes = await fetch(`/api/files/${fileId}?info=1`);
      if (!fileInfoRes.ok) {
        console.error('Eroare la info:', fileInfoRes.status);
        return;
      }
      const fileInfo = await fileInfoRes.json();
      setDocumentStage(fileInfo.stage || 'Draft');

      // 2. Download fișier (blob)
      const res = await fetch(`/api/files/${fileId}`);
      if (!res.ok) {
        console.error('Eroare la descărcarea fișierului:', res.status);
        return;
      }
      const blob = await res.blob();
      console.log('Blob descărcat:', blob.size, 'bytes');

      // Citește blobul ca ArrayBuffer pentru XLSX
      const arrayBuffer = await blob.arrayBuffer();

      // Parsează cu XLSX
      const XLSX = (await import("xlsx")).default || (await import("xlsx"));
      const data = new Uint8Array(arrayBuffer);
      const workbook = XLSX.read(data, { type: "array" });

      // Extrage datele pentru fiecare sheet
      const sheetsData: { [sheetName: string]: any[][] } = {};
      const sheetsRawData: { [sheetName: string]: any[][] } = {};

      workbook.SheetNames.forEach((sheetName: string, idx: number) => {
        const ws = workbook.Sheets[sheetName];
        let data = XLSX.utils.sheet_to_json(ws, {
          header: 1,
          defval: null,
          raw: false
        }) as any[][];

        sheetsRawData[sheetName] = data;

        if (idx === 0) {
          data = data.filter((_: any, i: number) => i >= 4);
        }
        data = data.map((row: any, rowIdx: number) => {
          if (rowIdx === 0 || rowIdx === 1) return row;
          if (row[11]) row[11] = formatExcelDateToDDMMYYYY(row[11]);
          if (row[14]) row[14] = formatExcelDateToDDMMYYYY(row[14]);
          return row;
        });

        sheetsData[sheetName] = data;
      });

      setAllSheetsData(sheetsData);
      setAllSheetsRawData(sheetsRawData);
      setSheetNames(workbook.SheetNames);
      setSelectedSheet(workbook.SheetNames[0]);
      setExcelData(sheetsData[workbook.SheetNames[0]]);

      console.log('Fișier selectat și procesat cu succes');
    } catch (error) {
      console.error('Eroare la procesarea fișierului selectat:', error);
    }


  }, [lastSavedFileId, lastSavedStage]);


  const resetView = () => {
    setExcelData([]);
    setSelectedSheet(null);
    setCurrentFileIndex(null);
    setActiveFilters({});
    setFilterMenuOpenColIndex(null);
    setValidationErrors({});
  };


  const loadFileAtIndex = useCallback((files: StoredFile[], index: number) => {
    const file = files[index];
    if (!file) return;

    setSheetNames(file.sheetNames);
    setCurrentFileIndex(index);
    setActiveFilters({});
    setFilterMenuOpenColIndex(null);
    setValidationErrors({});

    if (file.sheetNames.length > 0) {
      const firstSheet = file.sheetNames[0];
      setSelectedSheet(firstSheet);
      const trimmedData = trimDataToActualSize(file.sheetsData[firstSheet] || []);
      setExcelData(trimmedData);
    } else {
      setSelectedSheet(null);
      setExcelData([]);
    }
  }, []);

  const toggleMenu = useCallback(() => {
    setMenuState(prev => prev === "closed" ? "open" : "closed");
  }, []);

  const handleSelectFile = useCallback((index: number) => {
    if (index === currentFileIndex) return;
    loadFileAtIndex(storedFiles, index);
    setEditMode(false);
  }, [currentFileIndex, storedFiles, loadFileAtIndex]);

  const handleSheetSelect = useCallback((sheet: string) => {
    if (currentFileIndex === null) return;
    const file = storedFiles[currentFileIndex];
    if (!file?.sheetsData[sheet]) return;

    setSelectedSheet(sheet);
    setExcelData(allSheetsData[sheet] || []);
    const trimmedData = trimDataToActualSize(file.sheetsData[sheet]);
    setExcelData(trimmedData);
    setActiveFilters({});
    setFilterMenuOpenColIndex(null);
    setValidationErrors({});
  }, [currentFileIndex, storedFiles]);



  const saveFilesForUser = useCallback((files: StoredFile[]) => {
    if (!currentUser) return;
    try {
      localStorage.setItem(getStorageKey(currentUser.username), JSON.stringify(files));
    } catch (error) {
      console.error("Eroare la salvarea fișierelor:", error);
    }
  }, [currentUser, getStorageKey]);
  // 1. Înlocuiește funcția handleFileUpload cu această versiune:

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;

    if (!/ach/i.test(file.name)) {
      alert("❌ Poți încărca doar fișiere care conțin 'Ach' în nume!");
      e.target.value = "";
      return;
    }

    // === Procesare locală pentru validare/afișare ===
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const XLSX = (await import("xlsx")).default || (await import("xlsx"));
        const binaryStr = evt.target?.result;
        const wb = XLSX.read(binaryStr, { type: "binary" });

        // Procesare date pentru validare locală
        const sheetsData: { [sheetName: string]: any[][] } = {};
        const sheetsRawData: { [sheetName: string]: any[][] } = {};

        wb.SheetNames.forEach((sheetName: string, idx: number) => {
          const ws = wb.Sheets[sheetName];
          let data = XLSX.utils.sheet_to_json(ws, {
            header: 1,
            defval: null,
            raw: false
          }) as any[][];


          data = data.map((row, rowIdx) => {
            if (rowIdx === 0 || rowIdx === 1) return row; // nu modifica header/subheader
            if (row[6] && typeof row[6] === "string") {
              // Elimină punctele de mii și înlocuiește virgula cu punct
              row[6] = row[6].replace(/\./g, '').replace(',', '.');
            }
            return row;
          });

          sheetsData[sheetName] = data;

          if (idx === 0) {
            data = data.filter((_: any, i: number) => i >= 4);
          }
          data = data.map((row: any, rowIdx: number) => {
            if (rowIdx === 0 || rowIdx === 1) return row;
            if (row[11]) row[11] = formatExcelDateToDDMMYYYY(row[11]);
            if (row[14]) row[14] = formatExcelDateToDDMMYYYY(row[14]);
            return row;
          });

          sheetsData[sheetName] = data;
        });

        setAllSheetsData(sheetsData);
        setAllSheetsRawData(sheetsRawData);
        setSheetNames(wb.SheetNames);
        setSelectedSheet(wb.SheetNames[0]);
        setExcelData(sheetsData[wb.SheetNames[0]]);

        // === Upload fișierul brut ca BLOB ===
        const formData = new FormData();
        formData.append('file', file);
        formData.append('userId', currentUser.username);
        formData.append('stage', 'Waiting'); // <-- AICI

        const res = await fetch('/api/upload_file_excel', {
          method: 'POST',
          body: formData,
        });

        if (res.ok) {
          alert("✅ Fișierul a fost încărcat cu succes!");
          setDocumentStage('Draft');

          // 1. Ia id-ul nou din răspuns (dacă backendul îl returnează)
          const result = await res.json();
          const newFileId = result.id;

          // 2. Refă lista de fișiere
          await fetchDbFiles();

          // 3. Dacă ai id-ul nou, selectează-l direct
          if (newFileId) {
            setSelectedDbFileId(newFileId);
            await handleSelectDbFile(newFileId);
          } else {
            // Dacă nu ai id, caută după nume
            setTimeout(async () => {
              const refreshRes = await fetch(`/api/files?userId=${currentUser.username}`);
              const refreshedFiles = await refreshRes.json();
              setDbFiles(refreshedFiles);

              const newFile = refreshedFiles.find((f: any) =>
                f.file_name === file.name ||
                f.file_name.includes(file.name.replace('.xlsx', '').replace('.xls', ''))
              );

              if (newFile) {
                setSelectedDbFileId(newFile.id);
                await handleSelectDbFile(newFile.id);
              } else {
                // fallback: selectează ultimul fișier
                const myFiles = refreshedFiles.filter((f: any) => f.user_id === currentUser.username);
                if (myFiles.length > 0) {
                  const lastFile = myFiles[myFiles.length - 1];
                  setSelectedDbFileId(lastFile.id);
                  await handleSelectDbFile(lastFile.id);
                }
              }
            }, 500);
          }
        } else {
          const err = await res.json();
          alert("❌ Eroare la încărcarea fișierului: " + (err.error || ''));
        }
      } catch (error) {
        console.error("Eroare la procesarea fișierului:", error);
        alert("❌ Eroare la încărcarea fișierului.");
      }
    };

    reader.readAsBinaryString(file);
    e.target.value = "";
  }, [currentUser, fetchDbFiles, handleSelectDbFile]);
  const handleDeleteCurrentFile = useCallback(() => {

    if (currentFileIndex === null) return;

    const confirmDelete = confirm("Sigur dorești să ștergi acest fișier?");
    if (!confirmDelete) return;

    const updatedFiles = storedFiles.filter((_, idx) => idx !== currentFileIndex);
    setStoredFiles(updatedFiles);
    saveFilesForUser(updatedFiles);

    if (updatedFiles.length > 0) {
      loadFileAtIndex(updatedFiles, 0);
    } else {
      resetView();
    }

    alert("✅ Fișierul a fost șters cu succes.");
  }, [currentFileIndex, storedFiles, saveFilesForUser, loadFileAtIndex]);

  const handleUploadToDatabase = useCallback(async () => {
    const confirmUpload = window.confirm("Sigur dorești să faci upload în baza de date?");
    if (!confirmUpload) return;
    if (!currentUser) {
      alert("Nu ești autentificat!");
      return;
    }
    if (!excelData.length || !sheetNames.length || !allSheetsData) {
      alert("Nu ai încărcat niciun fișier Excel!");
      return;
    }

    try {
      const res = await fetch('/api/upload-excel-achi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user: currentUser.username,
          fileName: sheetNames[0] + ".xlsx",
          sheetNames,
          sheetsData: allSheetsData,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        alert("✅ Raportul a fost încărcat în baza de date!");
        await fetchDbFiles();

        // AICI: setează starea la "Trimis"
        setDocumentStage('Trimis');
      } else {
        const err = await res.json();
        alert("❌ Eroare la upload: " + (err.error || ''));
      }
    } catch (err) {
      alert("❌ Eroare la upload!");
    }
  }, [currentUser, excelData, sheetNames, allSheetsData, fetchDbFiles, handleSelectDbFile]);

  // 3. Înlocuiește useEffect-ul pentru fetchDbFiles:

  useEffect(() => {
    if (currentUser) {
      console.log('Fetching files pentru user:', currentUser.username);
      fetchDbFiles();
    }
  }, [currentUser, fetchDbFiles]);

  // 4. Modifică useEffect-ul pentru auto-selecție:

  useEffect(() => {
    if (
      dbFiles.length > 0 &&
      currentUser &&
      !selectedDbFileId
    ) {
      // FILTRARE după user și "ach" în nume
      const myFiles = dbFiles.filter(
        f => f.user_id === currentUser.username && /ach/i.test(f.file_name)
      );
      if (myFiles.length > 0) {
        const sortedFiles = myFiles.sort((a, b) => {
          if (a.uploaded_at && b.uploaded_at) {
            return new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime();
          }
          return b.id - a.id;
        });
        const lastFile = sortedFiles[0];
        if (lastFile && lastFile.id) {
          setSelectedDbFileId(lastFile.id);
          handleSelectDbFile(lastFile.id);
        }
      }
    }
  }, [dbFiles, currentUser, selectedDbFileId, handleSelectDbFile]);

  const handleDownloadCurrentFile = useCallback(async () => {
    if (currentFileIndex === null || !selectedSheet) return;

    const file = storedFiles[currentFileIndex];
    if (!file) return;

    // Dynamic import aici!
    const XLSX = (await import("xlsx")).default || (await import("xlsx"));

    // Creează un workbook nou
    const wb = XLSX.utils.book_new();

    // Adaugă toate sheet-urile (sau doar pe cel curent, dacă vrei)
    file.sheetNames.forEach(sheetName => {
      let data = file.sheetsData[sheetName] || [];
      // Dacă e sheet-ul curent, folosește datele modificate din excelData
      if (sheetName === selectedSheet) {
        data = excelData;
      }
      // Asigură-te că nu ai undefined/null
      data = data.map(row => row ? [...row] : []);
      const ws = XLSX.utils.aoa_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
    });

    // Salvează fișierul
    XLSX.writeFile(wb, file.name.replace(/\.xlsx?$/, '') + "_modificat.xlsx");
  }, [currentFileIndex, storedFiles, selectedSheet, excelData]);

  const handleCellChange = useCallback((value: string, rowIndex: number, colIndex: number) => {
    if (rowIndex === 0 || rowIndex === 1) return;
    if (!selectedSheet) return;

    setExcelData(prevData => {
      const newData = [...prevData];
      if (!newData[rowIndex]) {
        newData[rowIndex] = [];
      }
      newData[rowIndex][colIndex] = value;

      // Update și allSheetsData!
      setAllSheetsData(prev => ({
        ...prev,
        [selectedSheet]: newData
      }));

      // === SALVARE LOCALĂ AUTOMATĂ ===
      if (currentUser && selectedDbFileId) {
        // Poți salva în localStorage sau într-un alt state
        const storageKey = `autosave_${currentUser.username}_${selectedDbFileId}_${selectedSheet}`;
        try {
          localStorage.setItem(storageKey, JSON.stringify(newData));
        } catch (e) {
          // Poți trata erorile aici
          console.error("Eroare la autosave:", e);
        }
      }

      return newData;
    });
  }, [selectedSheet, currentUser, selectedDbFileId]);


  useEffect(() => {
  if (currentUser && selectedDbFileId && selectedSheet) {
    const storageKey = `autosave_${currentUser.username}_${selectedDbFileId}_${selectedSheet}`;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setExcelData(parsed);
      } catch {}
    }
  }

}, [currentUser, selectedDbFileId, selectedSheet]);

  const handleSave = useCallback(async () => {
    const confirmSave = window.confirm("Sigur dorești să salvezi modificările?");
    if (!confirmSave) return;
    // Verificăm dacă există erori de validare
    const hasErrors = Object.keys(validationErrors).length > 0;

    if (hasErrors) {
      const errorCount = Object.values(validationErrors).reduce((acc, rowErrors) =>
        acc + Object.keys(rowErrors).length, 0

      );

      const confirmSave = confirm(
        `⚠️ Există ${errorCount} erori de validare în raport. Doriți să salvați oricum?`
      );

      if (!confirmSave) return;
      setDocumentStage('Draft');
    }

    if (!selectedDbFileId || !currentUser) {
      alert("Nu ai selectat niciun fișier din baza de date!");
      return;
    }

    // 1. Generează fișierul Excel din allSheetsRawData
    const XLSX = (await import("xlsx")).default || (await import("xlsx"));
    const wb = XLSX.utils.book_new();
    sheetNames.forEach((sheetName: string) => {
      const data = allSheetsRawData[sheetName] || [];
      const ws = XLSX.utils.aoa_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
    });
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const fileBlob = new Blob([wbout], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });

    // 2. Trimite ca FormData la backend
    const formData = new FormData();
    formData.append('file', fileBlob, 'modificat.xlsx');
    formData.append('userId', currentUser.username);
    formData.append('stage', 'Waiting'); // <-- AICI!

    const res = await fetch(`/api/files/${selectedDbFileId}`, {
      method: "PUT",
      body: formData,
    });

    if (res.ok) {
      alert("✅ Datele au fost salvate în baza de date!");
      setDocumentStage('Waiting'); // <-- AICI!
      setShowWaitingPopup(true);
      await fetchDbFiles();

      setTimeout(() => handleSelectDbFile(selectedDbFileId), 300);

      // Apoi, dacă vrei să refaci lista sau să reselectezi fișierul, poți face:
      await fetchDbFiles();
      if (selectedDbFileId) {
        // Poți sări peste handleSelectDbFile aici, sau să-l apelezi după un mic delay:
        setTimeout(() => handleSelectDbFile(selectedDbFileId), 300);
      }
    } else {
      const err = await res.json();
      alert("❌ Eroare la salvare: " + (err.error || ''));
    }
  }, [selectedDbFileId, currentUser, sheetNames, allSheetsRawData, validationErrors, fetchDbFiles, handleSelectDbFile]);


  const sortFilesByName = useCallback((ascending: boolean) => {
    const sorted = [...dbFiles]
      .filter(f => /ach/i.test(f.file_name))
      .sort((a, b) =>
        ascending
          ? a.file_name.localeCompare(b.file_name)
          : b.file_name.localeCompare(a.file_name)
      );
    setDbFiles(sorted);
    setSortAsc(ascending);
  }, [dbFiles]);

  const handleFilterIconClick = (e: React.MouseEvent, colIndex: number) => {
    e.stopPropagation();
    if (filterMenuOpenColIndex === colIndex) {
      setFilterMenuOpenColIndex(null);
    } else {
      setFilterMenuOpenColIndex(colIndex);
    }
  };

  // Calculăm statistici pentru validare
  const validationStats = useMemo(() => {
    const totalErrors = Object.values(validationErrors).reduce((acc, rowErrors) =>
      acc + Object.keys(rowErrors).length, 0
    );
    const totalRows = Object.keys(validationErrors).length;
    return { totalErrors, totalRows };
  }, [validationErrors]);

  useEffect(() => {
    if (excelData.length > 0 && validationStats.totalErrors === 0) {
      const t = setTimeout(() => setShowDbUpload(true), 1500);
      return () => clearTimeout(t);
    } else {
      setShowDbUpload(false);
    }
  }, [excelData.length, validationStats.totalErrors]);

  useEffect(() => {
    if (showWaitingPopup) {
      const t = setTimeout(() => {
        setShowWaitingPopup(false);
        router.push('/doc-achizitii');
      }, 2000);
      return () => clearTimeout(t);
    }
  }, [showWaitingPopup, router]);

  return (

    <div className="relative h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 overflow-hidden">
      <div className="fixed top-4 right-4 z-50 flex flex-row gap-3">
        <Button
          className="bg-blue-700 text-white hover:bg-blue-800 shadow-lg px-4 py-2 flex items-center gap-2"
          onClick={() => router.push('/doc-achizitii')}
        >
          <FileText className="w-5 h-5" />
          DOSARE ACHIZIȚII
        </Button>
        <Button
          className="bg-purple-700 text-white hover:bg-purple-800 shadow-lg px-4 py-2 flex items-center gap-2"
          onClick={() => router.push('/paap')}
        >
          <ScrollText className="w-5 h-5" />
          PAAP
        </Button>
      </div>
      {showWaitingPopup && (
        <div className="fixed inset-0 backdrop-blur-sm bg-white/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-8 flex flex-col items-center">
            <Check className="w-12 h-12 text-green-500 mb-4" />
            <h2 className="text-xl font-bold mb-2">
              Raportul a intrat în starea <span className="text-blue-700">Waiting</span>!
            </h2>
            <p className="text-gray-700 mb-4">Veți fi redirecționat către pagina de achiziții...</p>
          </div>
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
            <h1 className="text-xl font-bold text-gray-900">Rapoarte Achizitii</h1>
          </div>

          <div className="flex flex-col gap-3 mb-6">
            <label className="cursor-pointer inline-flex flex-col items-center space-y-2 bg-blue-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-blue-700 transition duration-200 shadow-md">
              <UploadCloud className="w-5 h-5" />
              <span>Încarcă Excel</span>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

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
              {dbFiles.filter(f => /ach/i.test(f.file_name)).length === 0 ? (
                <p className="text-sm text-gray-500 text-center">Niciun fișier Achizitii încărcat</p>
              ) : (
                dbFiles
                  .filter(f => /ach/i.test(f.file_name))
                  .map((file) => (
                    <div
                      key={file.id}
                      onClick={() => handleSelectDbFile(file.id)}
                      className={`cursor-pointer px-3 py-2 rounded-md mb-1 text-sm transition-colors ${selectedDbFileId === file.id
                        ? "bg-blue-500 text-white font-medium"
                        : "hover:bg-gray-200 text-gray-700"
                        }`}
                    >
                      {file.file_name}
                      <button
                        className="ml-2 text-xs bg-blue-600 text-white px-2 py-1 rounded"
                        onClick={e => { e.stopPropagation(); window.open(`/api/files/${file.id}`); }}
                      >
                        Descarcă
                      </button>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-0 px-4 py-4 flex flex-col h-full">

        {/* Validation Status */}
        {validationStats.totalErrors > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 ml-16 flex items-center gap-4">
            <div className="text-sm text-red-700 font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <span>{validationStats.totalErrors} erori de validare pe {validationStats.totalRows} rânduri.</span>
            </div>
            <div className="ml-4 px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs font-semibold border border-yellow-200">
              Stagiu: {documentStage}
            </div>
          </div>
        )}

        {validationStats.totalErrors === 0 && excelData.length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4 ml-16 flex items-center gap-4">
            <div className="text-sm text-green-700 font-medium flex items-center gap-2">
              <Check className="w-4 h-4 text-green-500" />
              <span>Raportul este valid! Nu există erori de validare.</span>
            </div>
            <div
              className={`
    ml-4 px-3 py-1 rounded-full text-xs font-semibold border
    ${documentStage === 'Trimis'
                  ? 'bg-green-700 text-white border-green-800'
                  : documentStage === 'Waiting'
                    ? 'bg-blue-100 text-blue-700 border-blue-200'
                    : 'bg-yellow-100 text-yellow-700 border-yellow-200'
                }
  `}
            >
              Stagiu: {documentStage}
            </div>
          </div>
        )}

        {/* Validation Success Message */}
        {excelData.length > 0 ? (
          <>
            {/* Butoane și worksheet-uri */}
            <div className="flex items-center mb-4 ml-16 gap-2">
              <div className="flex flex-wrap gap-2">
                {sheetNames.map((sheet) => (
                  <Button
                    key={sheet}
                    onClick={() => {
                      setSelectedSheet(sheet);
                      setExcelData(allSheetsData[sheet] || []);
                    }}
                    className={`text-sm ${selectedSheet === sheet
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
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
              <div>
                <ActionsDropdown
                  onEdit={() => setEditMode((prev) => !prev)}
                  onSave={handleSave}
                  onDownload={() => {
                    if (!selectedDbFileId) {
                      alert("Selectează un fișier din baza de date!");
                      return;
                    }
                    window.open(`/api/files/${selectedDbFileId}`);
                  }}
                  onUpload={handleUploadToDatabase}
                  onDelete={() => {
                    if (selectedDbFileId) {
                      handleDeleteDbFile(selectedDbFileId);
                    } else {
                      alert("Selectează un fișier din baza de date!");
                    }
                  }}
                />
              </div>
            </div>

            {/* Tabelul Excel */}
            <div className="bg-white rounded-lg shadow flex-1 overflow-hidden flex flex-col">
              <div className="p-4 border-b border-gray-200 flex-shrink-0">
                <h2 className="text-lg font-semibold text-gray-800">
                  {selectedSheet}
                  <span className="text-sm text-gray-500 ml-2">
                    ({filteredData.length} din {dataDimensions.rows} rânduri)
                  </span>
                </h2>
              </div>
              <div className="flex-1 overflow-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
                <div className="overflow-x-auto overflow-y-auto h-full">
                  <table className="border-collapse" style={{ minWidth: 'max-content' }}>
                    <thead className="bg-gray-100 sticky top-0 z-10">
                      <tr>
                        <th className="w-12 bg-gray-200 border border-gray-300 text-center font-medium text-gray-700 sticky left-0 z-20"></th>
                        {columnHeaders.map((header, colIndex) => {
                          const isFilterActive = !!activeFilters[colIndex];
                          const isMenuOpen = filterMenuOpenColIndex === colIndex;
                          return (
                            <th
                              key={colIndex}
                              className="border border-gray-300 px-3 py-2 font-medium text-gray-700 text-center relative"
                              style={{ minWidth: '120px', width: '120px' }}
                            >
                              <div className="flex items-center justify-between">
                                <span>{header}</span>
                                {/* Butonul de Filtru */}
                                <button
                                  onClick={(e) => handleFilterIconClick(e, colIndex)}
                                  className={`p-1 rounded transition-colors ${isFilterActive ? 'text-blue-600 hover:bg-blue-200' : 'text-gray-400 hover:bg-gray-300'}`}
                                  title="Filtrează"
                                  aria-label={`Filtrează coloana ${header}`}
                                >
                                  <Filter className="w-4 h-4" />
                                </button>
                              </div>
                              {/*Meniu de Filtru */}
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
                          )
                        })}
                      </tr>
                      {/* DOAR dacă e primul worksheet, afișează sticky header/subheader */}
                      {isFirstSheet && (
                        <>
                          <tr className="bg-yellow-300 sticky top-[40px] z-20 text-black">
                            <th className="w-12 bg-gray-200 border border-gray-300 text-center font-medium sticky left-0 z-30"></th>
                            {Array.from({ length: dataDimensions.cols }).map((_, colIndex) => (
                              <td
                                key={colIndex}
                                className="border px-2 py-1 text-center font-bold text-black"
                                style={{ minWidth: "120px", width: "120px" }}
                              >
                                {headerRow1[colIndex] ?? ""}
                              </td>
                            ))}
                          </tr>
                          <tr className="bg-yellow-200 sticky top-[80px] z-10 text-black">
                            <th className="w-12 bg-gray-200 border border-gray-300 text-center font-medium sticky left-0 z-20"></th>
                            {Array.from({ length: dataDimensions.cols }).map((_, colIndex) => (
                              <td
                                key={colIndex}
                                className="border px-2 py-1 text-center font-bold text-black"
                                style={{ minWidth: "120px", width: "120px" }}
                              >
                                {headerRow2[colIndex] ?? ""}
                              </td>
                            ))}
                          </tr>
                        </>
                      )}
                    </thead>
                    <tbody>
                      {/* Dacă NU e primul worksheet, afișează header/subheader ca rânduri normale */}
                      {!isFirstSheet && (
                        <>
                          <tr className="bg-white text-black">
                            <td className="w-12 bg-gray-200 border border-gray-300 text-center font-medium"></td>
                            {Array.from({ length: dataDimensions.cols }).map((_, colIndex) => (
                              <td
                                key={colIndex}
                                className="border px-2 py-1 text-center font-bold text-black"
                                style={{ minWidth: "120px", width: "120px" }}
                              >
                                {headerRow1[colIndex] ?? ""}
                              </td>
                            ))}
                          </tr>
                          <tr className="bg-white text-black">
                            <td className="w-12 bg-gray-200 border border-gray-300 text-center font-medium"></td>
                            {Array.from({ length: dataDimensions.cols }).map((_, colIndex) => (
                              <td
                                key={colIndex}
                                className="border px-2 py-1 text-center font-bold text-black"
                                style={{ minWidth: "120px", width: "120px" }}
                              >
                                {headerRow2[colIndex] ?? ""}
                              </td>
                            ))}
                          </tr>
                        </>
                      )}
                      {/* restul rândurilor */}
                      {filteredData
                        .filter(({ originalIndex }) => originalIndex > 1)
                        .map(({ rowData: row, originalIndex: rowIndex }) => (
                          <tr key={rowIndex} className="hover:bg-blue-50">
                            <td className="border border-gray-300 bg-gray-100 text-center font-medium text-gray-700 w-12 py-2 sticky left-0 z-10">
                              {rowIndex + 1}
                            </td>
                            {Array.from({ length: dataDimensions.cols }).map((_, colIndex) => (
                              <TableCell
                                key={colIndex}
                                cell={row?.[colIndex]}
                                rowIndex={rowIndex}
                                colIndex={colIndex}
                                editMode={editMode}
                                onCellChange={handleCellChange}
                                validationError={validationErrors[rowIndex]?.[colIndex] ?? null}
                                isFirstSheet={isFirstSheet}
                              />
                            ))}
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center flex-1 min-h-[400px]">
            <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <FileText className="w-12 h-12 text-blue-500" />
            </div>
            <h2 className="text-lg font-semibold text-gray-700 mb-2">Niciun fișier Excel încărcat</h2>
            <p className="text-gray-500 text-sm mb-4 text-center max-w-xs">
              Încarcă un fișier Excel folosind butonul din stânga pentru a începe să lucrezi cu datele.
            </p>
            <span className="text-xs text-gray-400">Format acceptat: .xlsx, .xls</span>
            <div className="mt-4">
              <ExcelUploadButton onChange={handleFileUpload} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AchizitiiDocumentsPage;
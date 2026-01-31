"use client";

import React, { useState, useEffect, ReactNode, MouseEventHandler, useMemo, useCallback, useRef } from "react";
import { Menu, X, FileText, UploadCloud, FolderSearch, Home, Save, Upload, Download, Trash2, Filter, Check, AlertTriangle, Pencil } from "lucide-react";
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
  if (typeof value === "string" && /^(0[1-9]|[12]\d|3[01])\/(0[1-9]|1[0-2])\/\d{2}$/.test(value)) {
    return value;
  }

  // Dacă e string MM/DD/YY, îl convertim la DD/MM/YY
  if (typeof value === "string" && /^(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01])\/\d{2}$/.test(value)) {
    // MM/DD/YY
    const [mm, dd, yy] = value.split("/");
    return `${dd}/${mm}/${yy}`;
  }

  // Dacă e string de tip dată (ex: 2024-07-15), încearcă să parsezi
  if (typeof value === "string" && !isNaN(Date.parse(value))) {
    const d = new Date(value);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = String(d.getFullYear()).slice(-2);
    return `${day}/${month}/${year}`;
  }

  // Dacă e număr (serial Excel)
  if (typeof value === "number") {
    // Excel date serial: 1 Jan 1900 = 1
    const excelEpoch = new Date(1899, 11, 30);
    const d = new Date(excelEpoch.getTime() + value * 24 * 60 * 60 * 1000);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = String(d.getFullYear()).slice(-2);
    return `${day}/${month}/${year}`;
  }

  return value;
}
// Funcții de validare îmbunătățite

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

  if (isFirstSheet && colIndex === 1 && stringValue) {
    const validColumn2Regex = /^[a-zA-Z0-9]$/;
    if (!validColumn2Regex.test(stringValue)) {
      return 'Coloana 2 trebuie să conțină un singur caracter (literă sau cifră)';
    }
  }

  // Validare pentru coloana 3: începe cu cifră sau literă, urmat de "." și alte cifre (poate fi repetat)
  if (isFirstSheet && colIndex === 2 && stringValue) {
    const validColumn3Regex = /^[a-zA-Z0-9](\.\d+)+$/;
    if (!validColumn3Regex.test(stringValue)) {
      return 'Coloana 3 trebuie să înceapă cu o literă sau cifră, urmată de "." și cifre (ex: A.1.1, 1.1.1, B.2.3.4)';
    }
  }

  if (isFirstSheet && colIndex === 4 && stringValue) {
    if (!['G', 'CM', 'CB'].includes(stringValue.toUpperCase())) {
      return 'Doar literele G, CM, CB sunt permise';
    }
  }

  if (isFirstSheet && colIndex === 5 && stringValue && !/^P(\d+)$/.test(stringValue)) {
    return 'Trebuie să înceapă cu P și să urmeze fie un alt P, fie cifre (ex: P1, P23)';
  }

  if (isFirstSheet && colIndex === 10 && rowIndex > 0 && stringValue && !/^(RO)?\d{1,10}$/i.test(stringValue)) {
    return 'CUI trebuie să conțină doar cifre, opțional prefixat cu "RO".';
  }

  if (isFirstSheet && colIndex === 13 && rowIndex > 0 && stringValue && !/^(0[1-9]|[12]\d|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/.test(stringValue)) {
    return 'Coloana 15: Data trebuie să fie în formatul DD/MM/YYYY.';
  }


  if (isFirstSheet && colIndex === 15 && stringValue) {
    if (!['X', ''].includes(stringValue.toUpperCase())) {
      return 'Doar sa contina X sau " " permise';
    }
  }

  if (isFirstSheet && colIndex === 16 && stringValue) {
    const numberFormatRegex = /^\d{1,3}(,\d{3})*(\.\d{1,2})?$|^\d+(\.\d{1,2})?$/;
    if (!numberFormatRegex.test(stringValue)) {
      return 'Trebuie să fie un număr cu maxim 2 zecimale (ex: 10, 10.5, 10.55, 1,000.25)';
    }
  }

  if (isFirstSheet && colIndex === 17 && stringValue) {
    const numberFormatRegex = /^\d{1,3}(,\d{3})*(\.\d{1,2})?$|^\d+(\.\d{1,2})?$/;
    if (!numberFormatRegex.test(stringValue)) {
      return 'Trebuie să fie un număr cu maxim 2 zecimale (ex: 10, 10.5, 10.55, 1,000.25)';
    }
  }

  if (isFirstSheet && colIndex === 18 && stringValue) {
    const numberFormatRegex = /^\d{1,3}(,\d{3})*(\.\d{1,2})?$|^\d+(\.\d{1,2})?$/;
    if (!numberFormatRegex.test(stringValue)) {
      return 'Trebuie să fie un număr cu maxim 2 zecimale (ex: 10, 10.5, 10.55, 1,000.25)';
    }
    // Nu returnăm nimic pentru validare - doar calculăm procentul pentru afișare
    return null;
  }

  if (isFirstSheet && colIndex === 19 && stringValue) {
    const numberFormatRegex = /^\d{1,3}(,\d{3})*(\.\d{1,2})?$|^\d+(\.\d{1,2})?$/;
    if (!numberFormatRegex.test(stringValue)) {
      return 'Trebuie să fie un număr cu maxim 2 zecimale (ex: 10, 10.5, 10.55, 1,000.25)';
    }
    // Nu returnăm nimic pentru validare - doar calculăm procentul pentru afișare
    return null;
  }

  return null;
};
// Fct pt det randuri * coloane 
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

const TableCell = ({
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onCellChange(e.target.value, rowIndex, colIndex);
  };

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
};


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


function ActionsDropdown({
  onEdit,
  onSave,
  onDownload,
  onUpload,
  onDelete,
  disabled = false,
}: {
  onEdit: () => void;
  onSave: () => void;
  onDownload: () => void;
  onUpload: () => void;
  onDelete: () => void;
  disabled?: boolean;
}) {
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


const FinanciareDocumentsPage = () => {
  const [menuState, setMenuState] = useState("closed");
  const [excelData, setExcelData] = useState<any[][]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string | null>(null);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [storedFiles, setStoredFiles] = useState<StoredFile[]>([]);
  const [currentFileIndex, setCurrentFileIndex] = useState<number | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ username: string, id?: string } | null>(null);
  const [sortAsc, setSortAsc] = useState<boolean | null>(null);
  const headerRow1 = excelData[0] || [];
  const headerRow2 = excelData[1] || [];
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [dbFiles, setDbFiles] = useState<any[]>([]);
  const [selectedDbFileId, setSelectedDbFileId] = useState<string | null>(null);
  const [sheetsData, setSheetsData] = useState<{ [sheetName: string]: any[][] }>({});
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/me", { credentials: "include" })
      .then(async (res) => {
        if (res.status === 200) {
          const data = await res.json();
          if (data.success && data.user) {
            setCurrentUser(data.user);
            setCheckingAuth(false);
          } else {
            router.replace("/login");
          }
        } else {
          router.replace("/login");
        }
      })
      .catch(() => {
        router.replace("/login");
      });
  }, [router]);

  const fetchDbFiles = useCallback(async () => {
    if (!currentUser) return;
    const res = await fetch(`/api/files?userId=${currentUser.username}`);
    if (res.ok) {
      let files = await res.json();
      // FILTRARE: doar fișierele userului curent și care conțin "fina" în nume
      files = files.filter(
        (f: any) =>
          f.user_id === currentUser.username &&
          /fina/i.test(f.file_name)
      );
      setDbFiles(files);
    }
  }, [currentUser]);


  useEffect(() => {
    if (currentUser) fetchDbFiles();
  }, [currentUser, fetchDbFiles]);

  // State pentru validare
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

  // State pentru filtrare
  const [activeFilters, setActiveFilters] = useState<ActiveFilters>({});
  const [filterMenuOpenColIndex, setFilterMenuOpenColIndex] = useState<number | null>(null);

  const [showDbUpload, setShowDbUpload] = useState(false);





  // Verificăm dacă suntem pe primul worksheet
  const isFirstSheet = useMemo(() => {
    return selectedSheet === sheetNames[0];
  }, [selectedSheet, sheetNames]);

  // Calculăm erorile de validare
  const calculateValidationErrors = useCallback((data: any[][]) => {
    const errors: ValidationErrors = {};

    // Calculează indexul de la care să nu mai validezi
    let lastRowToValidate = data.length - 1;
    if (isFirstSheet && data.length > 6) {
      lastRowToValidate = data.length - 7; // indexul ultimului rând de validat
    }

    data.forEach((row, rowIndex) => {
      // Sari peste ultimele 6 rânduri dacă e primul sheet
      if (isFirstSheet && rowIndex > lastRowToValidate) return;

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


  // Actualizăm erorile de validare când se schimbă datele sau modul de editare
  useEffect(() => {
    const errors = calculateValidationErrors(excelData);
    setValidationErrors(errors);
  }, [excelData, calculateValidationErrors]);

  useEffect(() => {
    if (dbFiles.length > 0) {
      const lastId = localStorage.getItem("lastSelectedFinanciarFileId");
      const found = dbFiles.find(f => f.id === lastId);
      if (lastId && found) {
        handleSelectDbFile(lastId);
      } else {
        // Dacă nu există, selectează primul fișier din listă
        handleSelectDbFile(dbFiles[0].id);
      }
    }
    // eslint-disable-next-line
  }, [dbFiles]);

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
    setSelectedSheet(sheet);
    setExcelData(sheetsData[sheet] || []);
    setActiveFilters({});
    setFilterMenuOpenColIndex(null);
    setValidationErrors({});
  }, [sheetsData]);

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;

    // Poți pune validare ca să conțină "fina" în nume, dacă vrei:
    if (!/fina/i.test(file.name)) {
      alert("❌ Poți încărca doar fișiere care conțin 'Fina' în nume!");
      e.target.value = "";
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch('/api/upload_file_excel', {
      method: 'POST',
      body: formData,
      credentials: "include",
    });

    if (res.ok) {
      alert("✅ Fișierul a fost încărcat cu succes!");
      await fetchDbFiles();
    } else {
      const err = await res.json();
      alert("❌ Eroare la upload: " + (err.error || '') + (err.details ? "\n" + err.details : ""));
    }

    e.target.value = "";
  }, [currentUser, fetchDbFiles]);

  const handleSelectDbFile = useCallback(async (fileId: string) => {
    setEditMode(false);
    setSelectedDbFileId(fileId);
    localStorage.setItem("lastSelectedFinanciarFileId", fileId);

    try {
      const res = await fetch(`/api/files/${fileId}`);
      if (!res.ok) {
        alert("Eroare la descărcarea fișierului!");
        return;
      }
      const blob = await res.blob();
      const arrayBuffer = await blob.arrayBuffer();

      const XLSXmod = await import("xlsx");
      const XLSX = XLSXmod.default || XLSXmod;
      const data = new Uint8Array(arrayBuffer);
      const workbook = XLSX.read(data, { type: "array" });

      // Verifică dacă fișierul a fost deja "curățat"
      const isTrimmed = workbook.Props?.Subject === "TRIMMED_BY_APP";

      const newSheetsData: { [sheetName: string]: any[][] } = {};
      workbook.SheetNames.forEach((sheetName: string, idx: number) => {
        const ws = workbook.Sheets[sheetName];
        let aoa = XLSX.utils.sheet_to_json(ws, {
          header: 1,
          defval: null,
          raw: false
        }) as any[][];

        if (idx === 0) {
          // Elimină rândurile complet goale de la început
          while (aoa.length && (!aoa[0] || aoa[0].every(cell => cell == null || cell === ""))) {
            aoa.shift();
          }
          // Taie 4 rânduri DOAR dacă workbook-ul NU a fost deja marcat ca "TRIMMED"
          if (!isTrimmed) {
            aoa = aoa.slice(4);
          }
        }
        newSheetsData[sheetName] = aoa;
      });

      setSheetNames(workbook.SheetNames);
      setSelectedSheet(workbook.SheetNames[0]);
      setSheetsData(newSheetsData);
      setExcelData(newSheetsData[workbook.SheetNames[0]]);

      console.log('Loaded file for preview:', {
        fileId,
        sheetNames: workbook.SheetNames,
        isTrimmed,
        sheetsDataKeys: Object.keys(newSheetsData),
        excelData: newSheetsData[workbook.SheetNames[0]]
      });
    } catch (error) {
      console.error('Error loading file:', error);
      alert("Eroare la încărcarea fișierului!");
    }
  }, []);



  const handleDeleteCurrentFile = useCallback(async () => {
    if (!selectedDbFileId) return;
    const confirmDelete = confirm("Sigur dorești să ștergi acest fișier din baza de date?");
    if (!confirmDelete) return;

    try {
      const res = await fetch(`/api/files/${selectedDbFileId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        alert("✅ Fișierul a fost șters din baza de date!");
        setSelectedDbFileId(null);
        setExcelData([]);
        setSheetNames([]);
        setSelectedSheet(null);
        await fetchDbFiles();
      } else {
        const err = await res.json();
        alert("❌ Eroare la upload: " + (err.error || '') + (err.details ? "\n" + err.details : ""));

      }
    } catch (err) {
      alert("❌ Eroare la ștergere!");
    }
  }, [selectedDbFileId, fetchDbFiles]);



  const handleUploadToDatabase = useCallback(async () => {
    if (!currentUser || !sheetNames.length || !sheetsData) {
      alert("Nu ai selectat niciun fișier sau nu ai date!");
      return;
    }

    try {
      const res = await fetch('/api/upload-excel-fina', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.username,
          fileName: sheetNames[0] + ".xlsx", // sau numele real dacă îl ai
          sheetNames,
          sheetsData,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        alert("✅ Raportul a fost încărcat în baza de date!");
        // Poți reîncărca lista de fișiere dacă vrei:
        await fetchDbFiles();
      } else {
        const err = await res.json();
        alert("❌ Eroare la upload: " + (err.error || '') + (err.details ? "\n" + err.details : ""));

      }
    } catch (err) {
      alert("❌ Eroare la upload!");
    }
  }, [currentUser, sheetNames, sheetsData, fetchDbFiles]);

  const handleDownloadCurrentFile = useCallback(async () => {
    if (!selectedDbFileId) return;

    // Ia fișierul din backend ca blob
    const res = await fetch(`/api/files/${selectedDbFileId}`);
    if (!res.ok) {
      alert("Eroare la descărcarea fișierului!");
      return;
    }
    const blob = await res.blob();

    // Creează un link temporar și declanșează downloadul
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    // Poți folosi numele fișierului din dbFiles dacă vrei
    const file = dbFiles.find(f => f.id === selectedDbFileId);
    a.download = file ? file.file_name : "raport.xlsx";
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      window.URL.revokeObjectURL(url);
      a.remove();
    }, 100);
  }, [selectedDbFileId, dbFiles]);

  const handleCellChange = useCallback(
    (value: string, rowIndex: number, colIndex: number) => {
      if (rowIndex === 0 || rowIndex === 1) return;
      if (!selectedSheet) return;

      setExcelData(prevData => {
        const newData = [...prevData];
        if (!newData[rowIndex]) newData[rowIndex] = [];
        newData[rowIndex][colIndex] = value;

        // AUTOSAVE LOCAL direct, la fiecare tastă
        if (currentUser && selectedDbFileId && selectedSheet) {
          const storageKey = `autosave_fina_${currentUser.username}_${selectedDbFileId}_${selectedSheet}`;
          try {
            localStorage.setItem(storageKey, JSON.stringify(newData));
          } catch (e) {
            console.error("Eroare la autosave:", e);
          }
        }

        return newData;
      });

      // Update sheetsData (dacă folosești)
      setSheetsData(prevSheetsData => {
        const newSheetsData = { ...prevSheetsData };
        if (!newSheetsData[selectedSheet]) newSheetsData[selectedSheet] = [];
        const sheetData = [...(newSheetsData[selectedSheet] || [])];
        if (!sheetData[rowIndex]) sheetData[rowIndex] = [];
        sheetData[rowIndex] = [...sheetData[rowIndex]];
        sheetData[rowIndex][colIndex] = value;
        newSheetsData[selectedSheet] = sheetData;
        return newSheetsData;
      });

      // Update storedFiles (dacă folosești)
      if (currentFileIndex !== null) {
        setStoredFiles(prevFiles => {
          const newFiles = [...prevFiles];
          if (!newFiles[currentFileIndex].sheetsData[selectedSheet]) {
            newFiles[currentFileIndex].sheetsData[selectedSheet] = [];
          }
          if (!newFiles[currentFileIndex].sheetsData[selectedSheet][rowIndex]) {
            newFiles[currentFileIndex].sheetsData[selectedSheet][rowIndex] = [];
          }
          newFiles[currentFileIndex].sheetsData[selectedSheet][rowIndex][colIndex] = value;
          return newFiles;
        });
      }
    },
    [currentFileIndex, selectedSheet, currentUser, selectedDbFileId]
  );

  useEffect(() => {
    if (currentUser && selectedDbFileId && selectedSheet) {
      const storageKey = `autosave_fina_${currentUser.username}_${selectedDbFileId}_${selectedSheet}`;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setExcelData(parsed);
        } catch { }
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

    }

    if (!selectedDbFileId || !currentUser) {
      alert("Nu ai selectat niciun fișier din baza de date!");
      return;
    }

    // 1. Generează fișierul Excel din sheetsData
    const XLSX = (await import("xlsx")).default || (await import("xlsx"));
    const wb = XLSX.utils.book_new();

    // MARCHEAZĂ workbook-ul ca fiind deja "curățat"
    wb.Props = { ...(wb.Props || {}), Subject: "TRIMMED_BY_APP" };

    sheetNames.forEach((sheetName: string) => {
      const data = sheetsData[sheetName] || [];
      const ws = XLSX.utils.aoa_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
    });
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const fileBlob = new Blob([wbout], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });

    // 2. Trimite ca FormData la backend
    const formData = new FormData();
    formData.append('file', fileBlob, 'modificat.xlsx');
    formData.append('userId', currentUser.username);

    const res = await fetch(`/api/files/${selectedDbFileId}`, {
      method: "PUT",
      body: formData,
    });

    if (res.ok) {
      alert("✅ Datele au fost salvate în baza de date!");
      await fetchDbFiles();
      setTimeout(() => handleSelectDbFile(selectedDbFileId), 300);
    } else {
      const err = await res.json();
      alert("❌ Eroare la upload: " + (err.error || '') + (err.details ? "\n" + err.details : ""));
    }
  }, [selectedDbFileId, currentUser, sheetNames, sheetsData, validationErrors, fetchDbFiles, handleSelectDbFile]);


  const sortFilesByName = useCallback((ascending: boolean) => {
    const sorted = [...storedFiles].sort((a, b) =>
      ascending ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
    );
    setStoredFiles(sorted);
    setSortAsc(ascending);
  }, [storedFiles]);

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

  return (
    <div className="relative h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 overflow-hidden">
      {/* Buton meniu stânga */}
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

      {/* Buton DOSARE FINANCIARE dreapta sus */}
      <div className="fixed top-4 right-4 z-50 flex flex-row gap-3">
        <Button
          className="bg-blue-700 text-white hover:bg-blue-800 shadow-lg px-4 py-2 flex items-center gap-2"
          onClick={() => router.push('/doc-financiar')}
        >
          <FileText className="w-5 h-5" />
          DOSARE FINANCIARE
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
            <h1 className="text-xl font-bold text-gray-900">Rapoarte Financiare</h1>
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
              {dbFiles.length === 0 ? (
                <p className="text-sm text-gray-500 text-center">Niciun fișier încărcat</p>
              ) : (
                dbFiles.map((file) => (
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

      {/* Validation Status */}
      {validationStats.totalErrors > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 ml-16 mt-4">
          <div className="text-sm text-red-700 font-medium flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <span>{validationStats.totalErrors} erori de validare pe {validationStats.totalRows} rânduri.</span>
          </div>
        </div>
      )}

      {/* Validation Success Message */}
      {excelData.length > 0 && validationStats.totalErrors === 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4 ml-16 mt-4">
          <div className="text-sm text-green-700 font-medium flex items-center gap-2">
            <Check className="w-4 h-4 text-green-500" />
            <span>Raportul este valid!</span>
          </div>
        </div>
      )}





      {/* Main Content */}
      <div className="ml-0 px-4 py-4 flex flex-col h-full">
        {/* Action Buttons  */}
        {selectedDbFileId && excelData.length > 0 && (
          <div
            className="flex items-center justify-between mb-4 px-4"
            style={{ minHeight: 48 }}
          >
            <div className="flex flex-wrap gap-2">
              {sheetNames.map((sheet) => (
                <Button
                  key={sheet}
                  onClick={() => handleSheetSelect(sheet)}
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
            <ActionsDropdown
              onEdit={() => setEditMode((prev) => !prev)}
              onSave={handleSave}
              onDownload={handleDownloadCurrentFile}
              onUpload={handleUploadToDatabase}
              onDelete={handleDeleteCurrentFile}
            />
          </div>
        )}


        {/* Excel Table sau Empty State */}
        {excelData.length > 0 ? (
          <div className="bg-white rounded-lg shadow flex-1 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-200 flex-shrink-0">
              <h2 className="text-lg font-semibold text-gray-800">
                {currentFileIndex !== null ? storedFiles[currentFileIndex].name : ""} - {selectedSheet}
                <span className="text-sm text-gray-500 ml-2">
                  ({filteredData.length} din {dataDimensions.rows} rânduri)
                </span>
              </h2>
            </div>
            <div className="flex-1 flex flex-col overflow-hidden" style={{ maxHeight: 'calc(100vh - 300px)' }}>
              <div
                ref={tableScrollRef}
                className="flex-1 overflow-x-auto overflow-y-auto"
                style={{ scrollBehavior: 'smooth' }}
              >
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
            {/* === Butonul de încărcare Excel sub mesaj === */}
            <div className="mt-4">
              <ExcelUploadButton onChange={handleFileUpload} />
            </div>
          </div>
        )}
      </div>
    </div >
  );
};

export default FinanciareDocumentsPage;
"use client";

import React, { useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { formatCurrency } from "@/lib/pricing";

interface CSVProduct {
  nombre: string;
  costo: number;
  codigo_ext: string;
  stock?: number;
  categoria?: string;
  ubicacion?: string;
}

interface ProductMatch {
  csvProduct: CSVProduct;
  webProduct: {
    id: string;
    nombre: string;
    costo: number;
    codigo_ext: string;
  } | null;
  matchType: "exact" | "fuzzy" | "none";
  confidence: number;
}

interface CSVImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const abbreviationMap: Record<string, string> = {
  "aa": "aire acondicionado",
  "ac": "aire acondicionado",
  "heladera": "refrigerador",
  "refri": "refrigerador",
  "tv": "television",
};

const normalizeText = (text: string): string => {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
};

const expandAbbreviations = (text: string): string => {
  let normalized = normalizeText(text);

  for (const [abbr, full] of Object.entries(abbreviationMap)) {
    const regex = new RegExp(`\\b${abbr}\\b`, "gi");
    normalized = normalized.replace(regex, full);
  }

  return normalized;
};

const calculateSimilarity = (str1: string, str2: string): number => {
  const s1 = expandAbbreviations(str1);
  const s2 = expandAbbreviations(str2);

  if (s1 === s2) return 1;

  if (s1.includes(s2) || s2.includes(s1)) return 0.8;

  const words1 = s1.split(/\s+/);
  const words2 = s2.split(/\s+/);
  const commonWords = words1.filter(w => words2.includes(w)).length;
  const maxWords = Math.max(words1.length, words2.length);

  return commonWords / maxWords;
};

export default function CSVImportModal({ isOpen, onClose, onSuccess }: CSVImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [matches, setMatches] = useState<ProductMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [step, setStep] = useState<"upload" | "review">("upload");
  const [filterView, setFilterView] = useState<"all" | "matched" | "unmatched">("matched");
  const [importMode, setImportMode] = useState<"update" | "create">("update");

  const parseCSV = (text: string): CSVProduct[] => {
    const lines = text.split("\n").filter(line => line.trim());
    const products: CSVProduct[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Detectar delimitador (punto y coma o coma)
      const delimiter = line.includes(";") ? ";" : ",";
      const parts = line.split(delimiter).map(p => p.trim());

      // Detectar formato del CSV basado en número de columnas
      const isExtendedFormat = parts.length >= 9; // Formato completo con CODIGO;DESCRIPCION;COSTO;...

      if (isExtendedFormat) {
        // Formato: CODIGO;DESCRIPCION;COSTO;PRECIO MINORISTA;PRECIO MAYORISTA;CANTIDAD;FAMILIA;MARCA;LOCALIDAD;Imagen
        const codigo_ext = parts[0].trim().replace(/^["']|["']$/g, "").replace(/\./g, "").trim();
        const nombre = parts[1].trim().replace(/^["']|["']$/g, "");

        // Saltar la línea de encabezado
        if (i === 0 && (codigo_ext.toLowerCase().includes("codigo") || nombre.toLowerCase().includes("descripcion"))) {
          continue;
        }

        // Validar que la línea no esté vacía
        if (!codigo_ext && !nombre) continue;

        const costoStr = parts[2].trim().replace(/^["']|["']$/g, "");
        const costo = parseFloat(costoStr.replace(/\./g, "").replace(/,/g, "."));

        const cantidadStr = parts[5]?.trim().replace(/^["']|["']$/g, "") || "0";
        const stock = parseInt(cantidadStr) || 0;

        const categoria = parts[6]?.trim().replace(/^["']|["']$/g, "") || "";
        const ubicacion = parts[8]?.trim().replace(/^["']|["']$/g, "") || "En Local";

        if (nombre && !isNaN(costo) && nombre.length > 3) {
          products.push({
            nombre,
            costo,
            codigo_ext: codigo_ext || "",
            stock,
            categoria: categoria || undefined,
            ubicacion: ubicacion || undefined,
          });
        }
      } else if (parts.length >= 3) {
        // Formato simple: Nombre;Costo;Codigo EXT
        const nombre = parts[0].trim().replace(/^["']|["']$/g, "");

        // Saltar la línea de encabezado
        if (i === 0 && (nombre.toLowerCase().includes("nombre") || nombre.toLowerCase().includes("producto"))) {
          continue;
        }

        const costoStr = parts[1].trim().replace(/^["']|["']$/g, "");
        const costo = parseFloat(costoStr.replace(/\./g, "").replace(/,/g, "."));

        let codigo_ext = parts[2].trim().replace(/^["']|["']$/g, "");
        codigo_ext = codigo_ext.replace(/[;\s]+$/g, "").trim();

        if (nombre && !isNaN(costo) && nombre.length > 3) {
          products.push({ nombre, costo, codigo_ext: codigo_ext || "" });
        }
      }
    }

    return products;
  };

  // Fixed React namespace error by importing React
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setLoading(true);

    try {
      const text = await uploadedFile.text();
      const csvProducts = parseCSV(text);

      console.log(`CSV: ${csvProducts.length} productos encontrados`);

      if (importMode === "create") {
        // Modo crear: no hacer matching, solo listar productos a crear
        const productMatches: ProductMatch[] = csvProducts.map(csvProd => ({
          csvProduct: csvProd,
          webProduct: null,
          matchType: "none" as const,
          confidence: 0,
        }));

        console.log(`Preparando ${productMatches.length} productos para crear`);
        setMatches(productMatches);
        setStep("review");
      } else {
        // Modo actualizar: hacer matching con productos existentes
        const { data: webProducts, error } = await supabase
          .from("products")
          .select("id, nombre, costo, codigo_ext")
          .range(0, 9999);

        if (error) throw error;

        console.log(`Web: ${webProducts?.length || 0} productos encontrados en la base de datos`);

        const productMatches: ProductMatch[] = csvProducts.map(csvProd => {
          let bestMatch: typeof webProducts[0] | null = null;
          let bestScore = 0;
          let matchType: "exact" | "fuzzy" | "none" = "none";

          for (const webProd of webProducts || []) {
            const similarity = calculateSimilarity(csvProd.nombre, webProd.nombre);

            if (similarity === 1) {
              bestMatch = webProd;
              bestScore = 1;
              matchType = "exact";
              break;
            } else if (similarity > bestScore && similarity >= 0.6) {
              bestMatch = webProd;
              bestScore = similarity;
              matchType = "fuzzy";
            }
          }

          return {
            csvProduct: csvProd,
            webProduct: bestMatch ? {
              id: bestMatch.id,
              nombre: bestMatch.nombre,
              costo: Number(bestMatch.costo) || 0,
              codigo_ext: bestMatch.codigo_ext || "",
            } : null,
            matchType,
            confidence: bestScore,
          };
        });

        const matched = productMatches.filter(m => m.webProduct !== null).length;
        console.log(`Matches: ${matched} productos pareados de ${productMatches.length} del CSV`);

        setMatches(productMatches);
        setStep("review");
      }
    } catch (error) {
      console.error("Error processing CSV:", error);
      alert("Error al procesar el archivo CSV");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = async () => {
    setSyncing(true);
    setSyncProgress(0);

    try {
      const productsToCreate = matches.map(m => m.csvProduct);
      console.log(`Creando ${productsToCreate.length} productos nuevos...`);

      const batchSize = 50;
      let successCount = 0;
      let errorCount = 0;

      for (let i = 0; i < productsToCreate.length; i += batchSize) {
        const batch = productsToCreate.slice(i, i + batchSize);

        const promises = batch.map(async (product) => {
          try {
            const result = await supabase
              .from("products")
              .insert({
                nombre: product.nombre,
                costo: product.costo,
                codigo_ext: product.codigo_ext || null,
                stock: product.stock || 0,
                categoria: product.categoria || "",
                ubicacion: product.ubicacion || "En Local",
                descripcion: "",
                estado: "Activo",
                active: true,
                destacado: false,
              });

            if (result.error) {
              console.error(`Error creando producto ${product.nombre}:`, result.error);
              errorCount++;
            } else {
              successCount++;
            }
          } catch (error) {
            console.error(`Error creando producto ${product.nombre}:`, error);
            errorCount++;
          }
        });

        await Promise.all(promises);

        const progress = Math.min(100, Math.round(((i + batch.length) / productsToCreate.length) * 100));
        setSyncProgress(progress);
        console.log(`Progreso: ${progress}% (${successCount} exitosos, ${errorCount} errores)`);
      }

      console.log(`Creación completa: ${successCount} productos creados, ${errorCount} errores`);
      alert(`Se crearon ${successCount} productos nuevos exitosamente${errorCount > 0 ? ` (${errorCount} errores)` : ''}`);
      onSuccess();
      handleClose();
    } catch (error) {
      console.error("Error creating products:", error);
      alert("Error al crear productos");
    } finally {
      setSyncing(false);
      setSyncProgress(0);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setSyncProgress(0);

    try {
      const matchedProducts = matches.filter(m => m.webProduct !== null);
      console.log(`Iniciando sincronización de ${matchedProducts.length} productos...`);

      // Procesar en lotes de 50 productos
      const batchSize = 50;
      let successCount = 0;
      let errorCount = 0;

      for (let i = 0; i < matchedProducts.length; i += batchSize) {
        const batch = matchedProducts.slice(i, i + batchSize);

        // Procesar cada lote en paralelo
        const promises = batch.map(async (match) => {
          if (!match.webProduct) return;

          try {
            const result = await supabase
              .from("products")
              .update({
                costo: match.csvProduct.costo,
                codigo_ext: match.csvProduct.codigo_ext || null,
                updated_at: new Date().toISOString()
              })
              .eq("id", match.webProduct.id);

            if (result.error) {
              console.error(`Error actualizando producto ${match.webProduct?.id}:`, result.error);
              errorCount++;
            } else {
              successCount++;
            }
          } catch (error) {
            console.error(`Error actualizando producto ${match.webProduct?.id}:`, error);
            errorCount++;
          }
        });

        await Promise.all(promises);

        // Actualizar progreso
        const progress = Math.min(100, Math.round(((i + batch.length) / matchedProducts.length) * 100));
        setSyncProgress(progress);
        console.log(`Progreso: ${progress}% (${successCount} exitosos, ${errorCount} errores)`);
      }

      console.log(`Sincronización completa: ${successCount} productos actualizados, ${errorCount} errores`);
      alert(`Se actualizaron ${successCount} productos exitosamente${errorCount > 0 ? ` (${errorCount} errores)` : ''}`);
      onSuccess();
      handleClose();
    } catch (error) {
      console.error("Error syncing products:", error);
      alert("Error al sincronizar productos");
    } finally {
      setSyncing(false);
      setSyncProgress(0);
    }
  };

  const handleClose = () => {
    setFile(null);
    setMatches([]);
    setStep("upload");
    setFilterView("matched");
    setImportMode("update");
    onClose();
  };

  const matchedCount = matches.filter(m => m.webProduct !== null).length;
  const unmatchedCount = matches.length - matchedCount;

  const filteredMatches = matches.filter(match => {
    if (filterView === "matched") return match.webProduct !== null;
    if (filterView === "unmatched") return match.webProduct === null;
    return true;
  });

  // Debug info
  console.log(`Vista actual: ${filterView}`);
  console.log(`Total matches: ${matches.length}`);
  console.log(`Filtered matches: ${filteredMatches.length}`);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importar Costos desde CSV</DialogTitle>
          <DialogDescription>
            Sube un archivo CSV con los productos y costos para sincronizar
          </DialogDescription>
        </DialogHeader>

        {step === "upload" ? (
          <div className="space-y-4">
            <div className="flex gap-3 mb-4">
              <button
                onClick={() => setImportMode("update")}
                className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                  importMode === "update"
                    ? "border-blue-600 bg-blue-50 text-blue-900"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="font-semibold">Actualizar Productos</div>
                <div className="text-xs text-gray-600 mt-1">
                  Actualiza costos y códigos de productos existentes
                </div>
              </button>
              <button
                onClick={() => setImportMode("create")}
                className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                  importMode === "create"
                    ? "border-green-600 bg-green-50 text-green-900"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="font-semibold">Crear Productos Nuevos</div>
                <div className="text-xs text-gray-600 mt-1">
                  Importa productos nuevos desde el CSV
                </div>
              </button>
            </div>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-sm text-gray-600 mb-4">
                {importMode === "update"
                  ? "Selecciona un archivo CSV con las columnas: Nombre, Costo, Código EXT"
                  : "Selecciona un archivo CSV con productos para importar"}
              </p>
              <Input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                disabled={loading}
                className="max-w-xs mx-auto"
              />
              {loading && (
                <p className="text-sm text-blue-600 mt-4">Procesando archivo...</p>
              )}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-sm text-blue-900 mb-2">Formato del CSV:</h4>
              <p className="text-xs text-gray-600 mb-2">
                Acepta delimitadores: coma (,) o punto y coma (;)
              </p>
              {importMode === "update" ? (
                <pre className="text-xs bg-white p-2 rounded border">
{`Nombre;Costo;Codigo EXT
HELADERA TOKYO 2P BLANCO;2494800;5652561025395
AA CHIQ 18000 BTU;2826859;5649525348102`}
                </pre>
              ) : (
                <pre className="text-xs bg-white p-2 rounded border overflow-x-auto">
{`CODIGO;DESCRIPCION;COSTO;PRECIO MIN;PRECIO MAY;CANTIDAD;FAMILIA;MARCA;LOCALIDAD;Imagen
5652561025395;HELADERA TOKYO 2P BLANCO;2494800;...;...;0;ELECTRODOMESTICOS;...;SHOW ROOM;...
5649525348102;AA CHIQ 18000 BTU;2826859;...;...;1;ELECTRODOMESTICOS;...;DEPOSITO;...`}
                </pre>
              )}
              <p className="text-xs text-gray-600 mt-2">
                {importMode === "create"
                  ? "Los campos PRECIO MINORISTA, PRECIO MAYORISTA, MARCA e Imagen serán ignorados."
                  : "Solo se actualizarán el costo y código externo de productos existentes."
                }
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {importMode === "update" ? (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 grid grid-cols-3 gap-4">
                <div className="text-center">
                  <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-green-600">{matchedCount}</p>
                  <p className="text-xs text-gray-600">Productos Pareados</p>
                </div>
                <div className="text-center">
                  <XCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-red-600">{unmatchedCount}</p>
                  <p className="text-xs text-gray-600">Sin Parear</p>
                </div>
                <div className="text-center">
                  <AlertCircle className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-blue-600">{matches.length}</p>
                  <p className="text-xs text-gray-600">Total en CSV</p>
                </div>
              </div>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="text-center">
                  <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-2" />
                  <p className="text-3xl font-bold text-green-600">{matches.length}</p>
                  <p className="text-sm text-gray-700">Productos listos para crear</p>
                </div>
              </div>
            )}

            {importMode === "update" && (
              <div className="flex gap-2 border-b">
                <button
                  onClick={() => setFilterView("matched")}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    filterView === "matched"
                      ? "border-green-600 text-green-600"
                      : "border-transparent text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Pareados ({matchedCount})
                </button>
                <button
                  onClick={() => setFilterView("unmatched")}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    filterView === "unmatched"
                      ? "border-red-600 text-red-600"
                      : "border-transparent text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Sin Parear ({unmatchedCount})
                </button>
                <button
                  onClick={() => setFilterView("all")}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    filterView === "all"
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Todos ({matches.length})
                </button>
              </div>
            )}

            <div className="mb-2 text-sm text-gray-600">
              Mostrando {importMode === "create" ? matches.length : filteredMatches.length} productos en la tabla
            </div>

            <div className="border rounded-lg overflow-hidden">
              <div className="overflow-auto max-h-[500px]">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b sticky top-0 z-10">
                    <tr>
                      {importMode === "update" && (
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                          Estado
                        </th>
                      )}
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                        {importMode === "create" ? "Nombre" : "Producto CSV"}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                        Código EXT
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                        Costo
                      </th>
                      {importMode === "create" && (
                        <>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                            Stock
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                            Categoría
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                            Ubicación
                          </th>
                        </>
                      )}
                      {importMode === "update" && (
                        <>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                            Producto Web
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                            Código EXT Actual
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                            Costo Actual
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                            Diferencia
                          </th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {(importMode === "create" ? matches : filteredMatches).length === 0 ? (
                      <tr>
                        <td colSpan={importMode === "create" ? 6 : 8} className="px-4 py-8 text-center text-gray-500">
                          {importMode === "create" ? "No hay productos en el CSV" : "No hay productos en esta categoría"}
                        </td>
                      </tr>
                    ) : (
                      (importMode === "create" ? matches : filteredMatches).map((match, idx) => {
                      const costDiff = match.webProduct
                        ? match.csvProduct.costo - match.webProduct.costo
                        : 0;

                      const rowKey = match.webProduct?.id || `new-${idx}`;

                      if (importMode === "create") {
                        return (
                          <tr key={rowKey} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {match.csvProduct.nombre}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700 font-mono">
                              {match.csvProduct.codigo_ext || "-"}
                            </td>
                            <td className="px-4 py-3 text-sm font-medium text-green-600">
                              {formatCurrency(match.csvProduct.costo)}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {match.csvProduct.stock || 0}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {match.csvProduct.categoria || "-"}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {match.csvProduct.ubicacion || "En Local"}
                            </td>
                          </tr>
                        );
                      }

                      return (
                        <tr key={rowKey} className={match.webProduct ? "" : "bg-red-50"}>
                          <td className="px-4 py-3">
                            {match.webProduct ? (
                              <div className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-600" />
                                {match.matchType === "exact" ? (
                                  <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
                                    Exacto
                                  </span>
                                ) : (
                                  <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">
                                    {Math.round(match.confidence * 100)}%
                                  </span>
                                )}
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <XCircle className="w-4 h-4 text-red-600" />
                                <span className="text-xs text-red-600">Sin match</span>
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {match.csvProduct.nombre}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700 font-mono">
                            {match.csvProduct.codigo_ext || "-"}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-blue-600">
                            {formatCurrency(match.csvProduct.costo)}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {match.webProduct?.nombre || "-"}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 font-mono">
                            {match.webProduct?.codigo_ext || "-"}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {match.webProduct ? formatCurrency(match.webProduct.costo) : "-"}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {match.webProduct ? (
                              <span className={costDiff > 0 ? "text-green-600" : costDiff < 0 ? "text-red-600" : "text-gray-600"}>
                                {costDiff > 0 ? "+" : ""}{formatCurrency(costDiff)}
                              </span>
                            ) : (
                              "-"
                            )}
                          </td>
                        </tr>
                      );
                    }))}
                  </tbody>
                </table>
              </div>
            </div>

            {importMode === "update" && unmatchedCount > 0 && filterView !== "unmatched" && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <AlertCircle className="w-4 h-4 inline mr-2" />
                  {unmatchedCount} producto(s) del CSV no se pudieron parear.
                  Estos productos serán ignorados durante la sincronización.
                </p>
              </div>
            )}

            {importMode === "update" && matchedCount > 0 && filterView === "matched" && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-800">
                  <CheckCircle className="w-4 h-4 inline mr-2" />
                  Mostrando {filteredMatches.length} de {matchedCount} productos que serán sincronizados.
                </p>
                <p className="text-xs text-green-700 mt-1">
                  Desplázate hacia abajo en la tabla para ver todos los productos pareados.
                </p>
              </div>
            )}

            {importMode === "create" && matches.length > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-800">
                  <CheckCircle className="w-4 h-4 inline mr-2" />
                  Listos para crear {matches.length} productos nuevos.
                </p>
                <p className="text-xs text-green-700 mt-1">
                  Verifica los datos antes de continuar. Los productos se crearán con estado "Activo".
                </p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={syncing}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={importMode === "create" ? handleCreateNew : handleSync}
                disabled={syncing || (importMode === "update" && matchedCount === 0) || (importMode === "create" && matches.length === 0)}
                className="bg-green-600 hover:bg-green-700"
              >
                {syncing
                  ? `${importMode === "create" ? "Creando" : "Sincronizando"}... ${syncProgress}%`
                  : importMode === "create"
                  ? `Crear ${matches.length} Productos`
                  : `Sincronizar ${matchedCount} Productos`}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

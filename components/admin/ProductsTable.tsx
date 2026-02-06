"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { calculatePrices, formatCurrency } from "@/lib/pricing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, Plus, Search, Filter, Edit, Trash2, Package, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import ProductModal from "./ProductModal";
import BulkEditModal from "./BulkEditModal";
import CSVImportModal from "./CSVImportModal";

interface Product {
  id: string;
  nombre: string;
  descripcion: string;
  codigo_wos: string;
  codigo_pro: string;
  codigo_ext: string;
  categoria: string;
  url_slug: string;
  costo: number | string;
  margen_porcentaje: number | string;
  interes_6_meses_porcentaje: number | string;
  interes_12_meses_porcentaje: number | string;
  interes_15_meses_porcentaje: number | string;
  interes_18_meses_porcentaje: number | string;
  stock: number;
  ubicacion: string;
  estado: string;
  imagen_url: string;
  destacado: boolean;
  show_in_hero: boolean;
}

export default function ProductsTable() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 50;

  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [imageFilter, setImageFilter] = useState("all");
  const [featuredFilter, setFeaturedFilter] = useState("all");
  const [codeFilter, setCodeFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false);
  const [isCSVImportModalOpen, setIsCSVImportModalOpen] = useState(false);

  useEffect(() => {
    loadProducts();
  }, [currentPage, categoryFilter, statusFilter, stockFilter, locationFilter, imageFilter, featuredFilter]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("products")
        .select("*", { count: "exact" });

      // Filtros de base de datos para eficiencia
      if (categoryFilter !== "all") query = query.eq("categoria", categoryFilter);
      if (statusFilter !== "all") query = query.eq("estado", statusFilter);
      if (featuredFilter === "featured") query = query.eq("destacado", true);
      if (featuredFilter === "normal") query = query.eq("destacado", false);
      
      if (stockFilter === "in-stock") query = query.gt("stock", 0);
      if (stockFilter === "out-of-stock") query = query.eq("stock", 0);

      // Paginación real
      const from = currentPage * itemsPerPage;
      const to = from + itemsPerPage - 1;

      const { data, error, count } = await query
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) throw error;
      
      setProducts(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error("Error loading products:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    // Si hay búsqueda por texto, reiniciamos a la página 1 y filtramos
    setCurrentPage(0);
    loadProducts();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este producto?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) alert("Error al eliminar producto");
    else loadProducts();
  };

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setSelectedProduct(null);
    setIsModalOpen(true);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setCategoryFilter("all");
    setStatusFilter("all");
    setStockFilter("all");
    setLocationFilter("all");
    setImageFilter("all");
    setFeaturedFilter("all");
    setCodeFilter("");
    setCurrentPage(0);
  };

  const toggleProductSelection = (productId: string) => {
    const newSelection = new Set(selectedProducts);
    if (newSelection.has(productId)) newSelection.delete(productId);
    else newSelection.add(productId);
    setSelectedProducts(newSelection);
  };

  const toggleAllProducts = () => {
    if (selectedProducts.size === products.length) setSelectedProducts(new Set());
    else setSelectedProducts(new Set(products.map(p => p.id)));
  };

  const handleBulkDelete = async () => {
    if (selectedProducts.size === 0) return;
    if (!confirm(`¿Estás seguro de eliminar ${selectedProducts.size} productos?`)) return;
    const deletePromises = Array.from(selectedProducts).map(id =>
      supabase.from("products").delete().eq("id", id)
    );
    await Promise.all(deletePromises);
    setSelectedProducts(new Set());
    loadProducts();
  };

  // Filtrado local para búsqueda rápida reactiva (opcional)
  const filteredProducts = products.filter(p => 
    (p.nombre || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.codigo_ext || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-slate-700">Productos</h2>
          <p className="text-xs text-slate-500 font-medium uppercase tracking-tighter">
            Mostrando {filteredProducts.length} de {totalCount} productos totales
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={() => setIsCSVImportModalOpen(true)}>
            <Upload className="w-4 h-4" /> Importar CSV
          </Button>
          <Button onClick={handleAdd} className="gap-2 bg-pink-600 hover:bg-pink-700">
            <Plus className="w-4 h-4" /> Agregar
          </Button>
        </div>
      </div>

      {selectedProducts.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between animate-in fade-in slide-in-from-top-1">
          <span className="text-sm font-medium text-blue-900">
            {selectedProducts.size} seleccionado{selectedProducts.size > 1 ? 's' : ''}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsBulkEditModalOpen(true)} className="gap-2 bg-blue-600 text-white hover:bg-blue-700">
              <Edit className="w-4 h-4" /> Editar masivo
            </Button>
            <Button variant="destructive" size="sm" onClick={handleBulkDelete} className="gap-2">
              <Trash2 className="w-4 h-4" /> Eliminar lote
            </Button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Buscar por nombre o SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-11"
            />
          </div>
          <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="gap-2 h-11">
            <Filter className="w-4 h-4" /> Filtros
          </Button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t animate-in fade-in duration-300">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger><SelectValue placeholder="Categoría" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {Array.from(new Set(products.map(p => p.categoria))).filter(Boolean).map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger><SelectValue placeholder="Estado" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="Activo">Activo</SelectItem>
                <SelectItem value="Inactivo">Inactivo</SelectItem>
              </SelectContent>
            </Select>
            <Select value={stockFilter} onValueChange={setStockFilter}>
              <SelectTrigger><SelectValue placeholder="Stock" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="in-stock">En stock</SelectItem>
                <SelectItem value="out-of-stock">Sin stock</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={clearFilters}>Limpiar Filtros</Button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm relative">
        {loading && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-pink-600" />
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Cargando...</span>
            </div>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full table-fixed">
            <colgroup>
              <col style={{ width: '50px' }} />
              <col style={{ width: '300px' }} />
              <col style={{ width: '150px' }} />
              <col style={{ width: '150px' }} />
              <col style={{ width: '150px' }} />
              <col style={{ width: '100px' }} />
              <col style={{ width: '150px' }} />
            </colgroup>
            <thead className="bg-slate-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3"><Checkbox checked={selectedProducts.size === products.length && products.length > 0} onCheckedChange={toggleAllProducts} /></th>
                <th className="px-4 py-3 text-left text-[10px] font-black text-gray-500 uppercase">Producto</th>
                <th className="px-4 py-3 text-left text-[10px] font-black text-gray-500 uppercase">Códigos</th>
                <th className="px-4 py-3 text-left text-[10px] font-black text-gray-500 uppercase">Categoría</th>
                <th className="px-4 py-3 text-left text-[10px] font-black text-gray-500 uppercase">Precio</th>
                <th className="px-4 py-3 text-left text-[10px] font-black text-gray-500 uppercase">Stock</th>
                <th className="px-4 py-3 text-right text-[10px] font-black text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-4"><Checkbox checked={selectedProducts.has(product.id)} onCheckedChange={() => toggleProductSelection(product.id)} /></td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center overflow-hidden shrink-0">
                        {product.imagen_url ? <img src={product.imagen_url} alt={product.nombre} className="w-full h-full object-contain" /> : <Package className="w-5 h-5 text-gray-400" />}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-gray-900 truncate text-sm uppercase">{product.nombre}</div>
                        <div className="text-[10px] text-gray-400 truncate">{product.ubicacion}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 font-mono text-[10px] font-bold text-slate-500">{product.codigo_ext || "-"}</td>
                  <td className="px-4 py-4 text-xs font-bold text-slate-600">{product.categoria || "-"}</td>
                  <td className="px-4 py-4 text-sm font-black text-gray-900">
                    {formatCurrency(calculatePrices({
                      costo: Number(product.costo ?? 0),
                      margen_porcentaje: Number(product.margen_porcentaje ?? 18),
                      interes_6_meses_porcentaje: Number(product.interes_6_meses_porcentaje ?? 45),
                      interes_12_meses_porcentaje: Number(product.interes_12_meses_porcentaje ?? 65),
                      interes_15_meses_porcentaje: Number(product.interes_15_meses_porcentaje ?? 75),
                      interes_18_meses_porcentaje: Number(product.interes_18_meses_porcentaje ?? 85),
                    }).precioContado)}
                  </td>
                  <td className="px-4 py-4 text-sm font-bold">{product.stock}</td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex gap-2 justify-end">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(product)} className="text-blue-600 hover:bg-blue-50"><Edit className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(product.id)} className="text-red-600 hover:bg-red-50"><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        <div className="bg-slate-50 border-t border-gray-200 p-4 flex items-center justify-between">
          <div className="text-xs text-slate-500 font-bold uppercase">
            Página {currentPage + 1} de {Math.ceil(totalCount / itemsPerPage)}
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              disabled={currentPage === 0 || loading} 
              onClick={() => setCurrentPage(v => v - 1)}
              className="h-8 gap-1 font-bold"
            >
              <ChevronLeft className="w-4 h-4" /> Anterior
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              disabled={(currentPage + 1) * itemsPerPage >= totalCount || loading} 
              onClick={() => setCurrentPage(v => v + 1)}
              className="h-8 gap-1 font-bold"
            >
              Siguiente <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <ProductModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setSelectedProduct(null); }} product={selectedProduct} onSave={loadProducts} />
      <BulkEditModal isOpen={isBulkEditModalOpen} onClose={() => setIsBulkEditModalOpen(false)} selectedProductIds={selectedProducts} onSave={() => { loadProducts(); setSelectedProducts(new Set()); }} />
      <CSVImportModal isOpen={isCSVImportModalOpen} onClose={() => setIsCSVImportModalOpen(false)} onSuccess={loadProducts} />
    </div>
  );
}
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
import { Upload, Plus, Search, Filter, Edit, Trash2, Package } from "lucide-react";
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
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
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
  const [isBulkEditMode, setIsBulkEditMode] = useState(false);
  const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false);
  const [isCSVImportModalOpen, setIsCSVImportModalOpen] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [products, searchTerm, categoryFilter, statusFilter, stockFilter, locationFilter, imageFilter, featuredFilter, codeFilter]);

  const loadProducts = async () => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading products:", error);
    } else {
      setProducts(data || []);
    }
  };

  const filterProducts = () => {
    let filtered = [...products];

    if (searchTerm) {
      filtered = filtered.filter(
        (p) =>
          (p.nombre || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
          (p.descripcion || "").toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (codeFilter) {
      filtered = filtered.filter(
        (p) =>
          (p.codigo_wos || "").toLowerCase().includes(codeFilter.toLowerCase()) ||
          (p.codigo_pro || "").toLowerCase().includes(codeFilter.toLowerCase()) ||
          (p.codigo_ext || "").toLowerCase().includes(codeFilter.toLowerCase())
      );
    }

    if (categoryFilter !== "all") {
      filtered = filtered.filter((p) => p.categoria === categoryFilter);
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((p) => p.estado === statusFilter);
    }

    if (stockFilter !== "all") {
      if (stockFilter === "in-stock") {
        filtered = filtered.filter((p) => (p.stock || 0) > 0);
      } else if (stockFilter === "out-of-stock") {
        filtered = filtered.filter((p) => (p.stock || 0) === 0);
      }
    }

    if (locationFilter !== "all") {
      filtered = filtered.filter((p) => p.ubicacion === locationFilter);
    }

    if (imageFilter !== "all") {
      if (imageFilter === "with-image") {
        filtered = filtered.filter((p) => p.imagen_url && p.imagen_url.length > 0);
      } else if (imageFilter === "without-image") {
        filtered = filtered.filter((p) => !p.imagen_url || p.imagen_url.length === 0);
      }
    }

    if (featuredFilter !== "all") {
      filtered = filtered.filter((p) => p.destacado === (featuredFilter === "featured"));
    }

    setFilteredProducts(filtered);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este producto?")) return;

    const { error } = await supabase.from("products").delete().eq("id", id);

    if (error) {
      alert("Error al eliminar producto");
    } else {
      loadProducts();
    }
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
  };

  const toggleProductSelection = (productId: string) => {
    const newSelection = new Set(selectedProducts);
    if (newSelection.has(productId)) {
      newSelection.delete(productId);
    } else {
      newSelection.add(productId);
    }
    setSelectedProducts(newSelection);
  };

  const toggleAllProducts = () => {
    if (selectedProducts.size === filteredProducts.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(filteredProducts.map(p => p.id)));
    }
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

  const categories = Array.from(new Set(products.map((p) => p.categoria).filter(Boolean)));
  const locations = Array.from(new Set(products.map((p) => p.ubicacion).filter(Boolean)));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-700">Productos</h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => setIsCSVImportModalOpen(true)}
          >
            <Upload className="w-4 h-4" />
            Importar CSV
          </Button>
          <Button onClick={handleAdd} className="gap-2 bg-pink-600 hover:bg-pink-700">
            <Plus className="w-4 h-4" />
            Agregar
          </Button>
        </div>
      </div>

      {selectedProducts.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
          <span className="text-sm font-medium text-blue-900">
            {selectedProducts.size} producto{selectedProducts.size > 1 ? 's' : ''} seleccionado{selectedProducts.size > 1 ? 's' : ''}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsBulkEditModalOpen(true)}
              className="gap-2 bg-blue-600 text-white hover:bg-blue-700"
            >
              <Edit className="w-4 h-4" />
              Editar seleccionados
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkDelete}
              className="gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Eliminar seleccionados
            </Button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Buscar por nombre o descripción..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2"
          >
            <Filter className="w-4 h-4" />
            Filtros
          </Button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t">
            <Input
              placeholder="Filtrar por código..."
              value={codeFilter}
              onChange={(e) => setCodeFilter(e.target.value)}
            />
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Todas las categorías" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Todos los estados" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="Activo">Activo</SelectItem>
                <SelectItem value="Inactivo">Inactivo</SelectItem>
              </SelectContent>
            </Select>
            <Select value={stockFilter} onValueChange={setStockFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Todo el stock" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todo el stock</SelectItem>
                <SelectItem value="in-stock">En stock</SelectItem>
                <SelectItem value="out-of-stock">Sin stock</SelectItem>
              </SelectContent>
            </Select>
            <Select value={locationFilter} onValueChange={setLocationFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Todas las ubicaciones" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las ubicaciones</SelectItem>
                {locations.map((loc) => (
                  <SelectItem key={loc} value={loc}>
                    {loc}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={imageFilter} onValueChange={setImageFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Con/Sin imagen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="with-image">Con imagen</SelectItem>
                <SelectItem value="without-image">Sin imagen</SelectItem>
              </SelectContent>
            </Select>
            <Select value={featuredFilter} onValueChange={setFeaturedFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Destacados/Normal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="featured">Destacados</SelectItem>
                <SelectItem value="normal">Normales</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={clearFilters}>
              Limpiar filtros
            </Button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full table-fixed">
            <colgroup>
              <col style={{ width: '50px' }} />
              <col style={{ width: '280px' }} />
              <col style={{ width: '140px' }} />
              <col style={{ width: '130px' }} />
              <col style={{ width: '120px' }} />
              <col style={{ width: '90px' }} />
              <col style={{ width: '130px' }} />
              <col style={{ width: '110px' }} />
              <col style={{ width: '220px' }} />
            </colgroup>
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3">
                  <Checkbox
                    checked={selectedProducts.size === filteredProducts.length && filteredProducts.length > 0}
                    onCheckedChange={toggleAllProducts}
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Producto
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Códigos
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Categoría
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Precio
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Ubicación
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4">
                    <Checkbox
                      checked={selectedProducts.has(product.id)}
                      onCheckedChange={() => toggleProductSelection(product.id)}
                    />
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                        {product.imagen_url ? (
                          <img
                            src={product.imagen_url}
                            alt={product.nombre}
                            className="w-full h-full object-cover rounded"
                          />
                        ) : (
                          <Package className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-gray-900 truncate">
                          {product.nombre}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          {product.descripcion}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-xs space-y-1">
                      {product.codigo_wos && (
                        <div className="text-pink-600 bg-pink-50 px-2 py-0.5 rounded inline-block">
                          {product.codigo_wos}
                        </div>
                      )}
                      {product.codigo_ext && (
                        <div className="text-gray-600 font-mono">EXT: {product.codigo_ext}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-700">
                    {product.categoria || "-"}
                  </td>
                  <td className="px-4 py-4 text-sm font-medium text-gray-900">
                    {formatCurrency(calculatePrices({
                      costo: Number(product.costo ?? 0),
                      margen_porcentaje: Number(product.margen_porcentaje ?? 18),
                      interes_6_meses_porcentaje: Number(product.interes_6_meses_porcentaje ?? 45),
                      interes_12_meses_porcentaje: Number(product.interes_12_meses_porcentaje ?? 65),
                      interes_15_meses_porcentaje: Number(product.interes_15_meses_porcentaje ?? 75),
                      interes_18_meses_porcentaje: Number(product.interes_18_meses_porcentaje ?? 85),
                    }).precioContado)}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-700">{product.stock || 0}</td>
                  <td className="px-4 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {product.ubicacion || "Sin Ubicación"}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        product.estado === "Activo"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {product.estado || "Inactivo"}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(product)}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-300 whitespace-nowrap"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(product.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-300 whitespace-nowrap"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Eliminar
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredProducts.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No se encontraron productos disponibles.
          </div>
        )}
      </div>

      <ProductModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedProduct(null);
        }}
        product={selectedProduct}
        onSave={loadProducts}
      />

      <BulkEditModal
        isOpen={isBulkEditModalOpen}
        onClose={() => {
          setIsBulkEditModalOpen(false);
        }}
        selectedProductIds={selectedProducts}
        onSave={() => {
          loadProducts();
          setSelectedProducts(new Set());
        }}
      />

      <CSVImportModal
        isOpen={isCSVImportModalOpen}
        onClose={() => setIsCSVImportModalOpen(false)}
        onSuccess={() => {
          loadProducts();
        }}
      />
    </div>
  );
}
import { Package, Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="relative inline-block">
          <Loader2 className="w-16 h-16 text-[#D91E7A] animate-spin" />
          <Package className="w-6 h-6 text-slate-300 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
        <p className="text-slate-400 font-black uppercase tracking-widest text-xs italic">Cargando producto...</p>
      </div>
    </div>
  );
}

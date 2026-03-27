import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Nueva función obligatoria para la generación de slugs en el Frontend y Sync
export function generateSlug(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .normalize("NFD") // Descompone acentos
    .replace(/[\u0300-\u036f]/g, "") // Remueve acentos
    .replace(/[^a-z0-9]+/g, "-") // Reemplaza caracteres no alfanuméricos por guiones medios
    .replace(/^-+|-+$/g, ""); // Remueve guiones al inicio y al final
}

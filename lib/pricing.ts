export interface PricingParams {
  costo: number;
  margen_porcentaje: number;
  interes_6_meses_porcentaje: number;
  interes_12_meses_porcentaje: number;
  interes_15_meses_porcentaje: number;
  interes_18_meses_porcentaje: number;
}

export interface CalculatedPrices {
  precioContado: number;
  cuota6Meses: number;
  total6Meses: number;
  disponible6Meses: boolean;
  cuota12Meses: number;
  total12Meses: number;
  disponible12Meses: boolean;
  cuota15Meses: number;
  total15Meses: number;
  disponible15Meses: boolean;
  cuota18Meses: number;
  total18Meses: number;
  disponible18Meses: boolean;
}

export function roundToNearest5000(value: number): number {
  return Math.ceil(value / 5000) * 5000;
}

export function calculatePrices(params: PricingParams): CalculatedPrices {
  const {
    costo,
    margen_porcentaje,
    interes_6_meses_porcentaje,
    interes_12_meses_porcentaje,
    interes_15_meses_porcentaje,
    interes_18_meses_porcentaje,
  } = params;

  const margenMonto = costo * (margen_porcentaje / 100);
  const precioContado = roundToNearest5000(costo + margenMonto);

  const disponible6Meses = interes_6_meses_porcentaje > 0;
  const interes6 = costo * (interes_6_meses_porcentaje / 100);
  const total6Meses = disponible6Meses ? roundToNearest5000(costo + interes6) : 0;
  const cuota6Meses = disponible6Meses ? roundToNearest5000(total6Meses / 6) : 0;

  const disponible12Meses = interes_12_meses_porcentaje > 0;
  const interes12 = costo * (interes_12_meses_porcentaje / 100);
  const total12Meses = disponible12Meses ? roundToNearest5000(costo + interes12) : 0;
  const cuota12Meses = disponible12Meses ? roundToNearest5000(total12Meses / 12) : 0;

  const disponible15Meses = interes_15_meses_porcentaje > 0;
  const interes15 = costo * (interes_15_meses_porcentaje / 100);
  const total15Meses = disponible15Meses ? roundToNearest5000(costo + interes15) : 0;
  const cuota15Meses = disponible15Meses ? roundToNearest5000(total15Meses / 15) : 0;

  const disponible18Meses = interes_18_meses_porcentaje > 0;
  const interes18 = costo * (interes_18_meses_porcentaje / 100);
  const total18Meses = disponible18Meses ? roundToNearest5000(costo + interes18) : 0;
  const cuota18Meses = disponible18Meses ? roundToNearest5000(total18Meses / 18) : 0;

  return {
    precioContado,
    cuota6Meses,
    total6Meses,
    disponible6Meses,
    cuota12Meses,
    total12Meses,
    disponible12Meses,
    cuota15Meses,
    total15Meses,
    disponible15Meses,
    cuota18Meses,
    total18Meses,
    disponible18Meses,
  };
}

export function formatCurrency(value: number): string {
  return `₲ ${value.toLocaleString('es-PY')}`;
}

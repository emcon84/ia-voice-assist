import { ProductRecommendation, HormaxProduct } from '@/types/courses';
import { HORMAX_PRODUCTS, getProductById } from '@/data/hormax-products';

export interface RecommendationParams {
  tipoObra: string;
  resistencia: string;
  exposicion: string;
  elemento: string;
}

const TIPO_OBRA_MAP: Record<string, string[]> = {
  'residencial': ['fundaciones', 'losas', 'columnas', 'vigas'],
  'comercial': ['losas', 'columnas', 'vigas', 'pisos'],
  'industrial': ['pisos', 'fundaciones', 'estructuras'],
  'infraestructura': ['puentes', 'diques', 'estructuras especiales']
};

const RESISTENCIA_MAP: Record<string, number> = {
  '210': 210,
  '250': 250,
  '300': 300,
  '350': 350,
  '420': 420
};

const EXPOSICION_MAP: Record<string, string> = {
  'interior': 'standard',
  'exterior': 'standard',
  'costera': 'sulfato',
  'sulfatos': 'sulfato',
  'quimica': 'sulfato',
  'frio': 'rapido',
  'rapido': 'rapido'
};

export function getRecommendation(params: RecommendationParams): ProductRecommendation {
  const { tipoObra, resistencia, exposicion, elemento } = params;
  
  // 1. Determinar resistencia
  const fc = RESISTENCIA_MAP[resistencia] || 250;
  
  // 2. Determinar tipo de producto según exposición
  const expoType = EXPOSICION_MAP[exposicion.toLowerCase()] || 'standard';
  
  let product: HormaxProduct | undefined;
  let reason = '';
  
  // Lógica de selección
  if (expoType === 'sulfato') {
    // Ambiente agresivo - buscar sulforresistente
    if (fc <= 250) {
      product = getProductById('h250-sulf');
      reason = 'Recomendado sulforresistente para ambientes con exposición a sulfatos o zona costera. El cemento sulforresistente protege contra ataque químico.';
    } else if (fc <= 300) {
      product = getProductById('h300-sulf');
      reason = 'Alta resistencia con protección sulforresistente para ambientes muy agresivos.';
    }
  } else if (expoType === 'rapido') {
    // Clima frío o rápido
    product = getProductById('h250-rapido');
    reason = 'Recomendado de fragüe rápido para clima frío o cuando se necesita rápido desencofrado (12 horas).';
  } else if (elemento.toLowerCase().includes('piso') || elemento.toLowerCase().includes('industrial')) {
    // Pisos industriales
    product = getProductById('h300-autonivelante');
    reason = 'Para pisos industriales se recomienda hormigón autonivelante que fluye sin necesidad de vibrado y ofrece acabado perfecto.';
  } else {
    // Producto estándar según resistencia
    switch (fc) {
      case 210:
        product = getProductById('h210');
        break;
      case 300:
        product = getProductById('h300');
        break;
      case 350:
      case 420:
        product = getProductById('h350');
        break;
      default:
        product = getProductById('h250');
    }
    
    if (!reason) {
      reason = `Hormax H-${fc} es adecuado para ${elemento.toLowerCase()} en obra ${tipoObra.toLowerCase()} con exposición ${exposicion.toLowerCase()}.`;
    }
  }
  
  // 3. Generar alternativas
  let alternatives: HormaxProduct[] = [];
  
  if (product) {
    // Agregar otras resistencias disponibles
    const sameFcProducts = HORMAX_PRODUCTS.filter(p => p.fc === product!.fc && p.id !== product!.id);
    
    // Agregar producto de siguiente resistencia
    const nextFc = fc + 50;
    if (nextFc <= 420) {
      const nextProduct = getProductById(`h${nextFc}`) || getProductById(`h${nextFc - 100}-sulf`);
      if (nextProduct) alternatives.push(nextProduct);
    }
    
    alternatives = [...alternatives.slice(0, 2), ...sameFcProducts.slice(0, 1)].filter(Boolean);
  }
  
  if (!product) {
    // Fallback
    product = getProductById('h250');
    reason = 'Recomendación estándar para uso general. Consulte con nuestro equipo técnico para casos específicos.';
    const h300 = getProductById('h300');
    const h350 = getProductById('h350');
    alternatives = h300 && h350 ? [h300, h350] : [];
  }
  
  return {
    product,
    reason,
    alternatives
  };
}

export function getObraOptions(): string[] {
  return ['residencial', 'comercial', 'industrial', 'infraestructura'];
}

export function getResistenciaOptions(): string[] {
  return ['210', '250', '300', '350', '420'];
}

export function getExposicionOptions(): string[] {
  return ['interior', 'exterior', 'costera', 'sulfatos', 'quimica', 'frio', 'rapido'];
}

export function getElementoOptions(): string[] {
  return ['fundacion', 'platea', 'losa', 'entrepiso', 'columna', 'viga', 'piso industrial', 'pared', 'otro'];
}
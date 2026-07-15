import { HormaxProduct } from '@/types/courses';

export const HORMAX_PRODUCTS: HormaxProduct[] = [
  {
    id: 'h210',
    code: 'H-210',
    name: 'ORMAX H-210',
    fc: 210,
    useCases: [
      'Fundaciones superficiales',
      'Vigas de cimentación',
      'Veredas',
      'Banquinas'
    ],
    features: [
      'Uso general',
      'Resistencia estándar',
      'APTA para obras residenciales'
    ],
    available: true
  },
  {
    id: 'h250',
    code: 'H-250',
    name: 'ORMAX H-250',
    fc: 250,
    useCases: [
      'Losas de entrepiso',
      'Columnas',
      'Vigas',
      'Piletas'
    ],
    features: [
      'Uso estructural',
      'Resistencia media',
      'APTA para obras comerciales'
    ],
    available: true
  },
  {
    id: 'h300',
    code: 'H-300',
    name: 'ORMAX H-300',
    fc: 300,
    useCases: [
      'Losas de mayor solicitación',
      'Prefabricados',
      'Plantas de tratamiento'
    ],
    features: [
      'Alta resistencia',
      'Menor permeabilidad',
      'Para cargas importantes'
    ],
    available: true
  },
  {
    id: 'h350',
    code: 'H-350',
    name: 'ORMAX H-350',
    fc: 350,
    useCases: [
      'Estructuras de alta responsabilidad',
      'Puentes',
      'Presas pequeñas',
      'Naves industriales'
    ],
    features: [
      'Muy alta resistencia',
      'Alta durabilidad',
      'Para condiciones exigentes'
    ],
    available: true
  },
  {
    id: 'h250-sulf',
    code: 'H-250 SR',
    name: 'ORMAX H-250 Sulforresistente',
    fc: 250,
    useCases: [
      'Suelos con sulfatos',
      'Zonas costeras',
      'Plantas de tratamiento de effluent',
      'Emisiones industriales'
    ],
    features: [
      'Cemento sulforresistente',
      'Resistente a ataque químico',
      'Mayor vida útil'
    ],
    available: true
  },
  {
    id: 'h300-sulf',
    code: 'H-300 SR',
    name: 'ORMAX H-300 Sulforresistente',
    fc: 300,
    useCases: [
      'Obras industriales con sulfatos',
      'Suelos muy agresivos',
      'Infraestructura sanitaria'
    ],
    features: [
      'Máxima resistencia a sulfatos',
      'Alta resistencia mecánica',
      'Para ambientes muy agresivos'
    ],
    available: true
  },
  {
    id: 'h250-rapido',
    code: 'H-250 R',
    name: 'ORMAX H-250 Rápido',
    fc: 250,
    useCases: [
      'Reparaciones urgentes',
      'Obras con plazos reducidos',
      'Hormigonado en clima frío'
    ],
    features: [
      'Desencofrado rápido (12h)',
      'Alta resistencia temprana',
      'Trabaja a baja temperatura'
    ],
    available: true
  },
  {
    id: 'h300-autonivelante',
    code: 'H-300 AN',
    name: 'ORMAX H-300 Autonivelante',
    fc: 300,
    useCases: [
      'Pisos industriales',
      'Losas de gran superficie',
      'Fundaciones de máquinas'
    ],
    features: [
      'Fluidez sin vibrado',
      'Acabado perfecto',
      'Reducción de mano de obra'
    ],
    available: true
  }
];

export function getProductById(id: string): HormaxProduct | undefined {
  return HORMAX_PRODUCTS.find(p => p.id === id);
}

export function getProductsByFc(fc: number): HormaxProduct[] {
  return HORMAX_PRODUCTS.filter(p => p.fc === fc);
}

export function getProductsForUseCase(useCase: string): HormaxProduct[] {
  return HORMAX_PRODUCTS.filter(p => 
    p.useCases.some(uc => uc.toLowerCase().includes(useCase.toLowerCase()))
  );
}
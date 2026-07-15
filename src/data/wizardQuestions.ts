import { Layers, Building, Droplets, Warehouse, Car, Zap, Sparkles } from "lucide-react";
import { WizardQuestion } from "@/types/wizard";

export const WIZARD_QUESTIONS: WizardQuestion[] = [
  {
    id: "tipo",
    question: "¿Qué vas a construir?",
    subtext: "Seleccioná el tipo de obra",
    options: [
      {
        id: "losa",
        label: "Losa o Entrepiso",
        icon: Building,
        color: "#0ea5e9",
        result: ["estructural", "autocompactante"],
      },
      {
        id: "fundacion",
        label: "Fundación o Base",
        icon: Layers,
        color: "#a8956b",
        result: ["fundaciones"],
      },
      {
        id: "pileta",
        label: "Pileta o Cisterna",
        icon: Droplets,
        color: "#10b981",
        result: ["impermeable"],
      },
      {
        id: "piso",
        label: "Piso o Vereda",
        icon: Warehouse,
        color: "#8b5cf6",
        result: ["pisos", "pavimentos"],
      },
      {
        id: "camino",
        label: "Camino o Rampa",
        icon: Car,
        color: "#e8762a",
        result: ["pavimentos"],
      },
      {
        id: "estructura",
        label: "Estructura Especial",
        icon: Zap,
        color: "#ec4899",
        result: ["autocompactante", "alta-resistencia"],
      },
    ],
  },
  {
    id: "agua",
    question: "¿Hay contacto con agua?",
    subtext: "Importante para elegir el tipo de hormigón",
    options: [
      {
        id: "si",
        label: "Sí, va a estar en contacto con agua",
        icon: Droplets,
        color: "#0ea5e9",
        result: ["impermeable"],
      },
      {
        id: "no",
        label: "No, es uso seco",
        icon: Building,
        color: "#6e6c6a",
        result: [],
      },
    ],
  },
  {
    id: "resistencia",
    question: "¿Qué carga va a soportar?",
    subtext: "Determina la resistencia necesaria",
    options: [
      {
        id: "alta",
        label: "Alta (edificio, puente)",
        icon: Building,
        color: "#ec4899",
        result: ["alta-resistencia", "estructural"],
      },
      {
        id: "media",
        label: "Media (casa, comercio)",
        icon: Warehouse,
        color: "#0ea5e9",
        result: ["estructural", "fundaciones"],
      },
      {
        id: "baja",
        label: "Baja (contrapisos, veredas)",
        icon: Layers,
        color: "#a8956b",
        result: ["no-estructural", "pisos"],
      },
    ],
  },
  {
    id: "tiempo",
    question: "¿Tenés tiempo de curado?",
    subtext: "Acelera o no según tu cronograma",
    options: [
      {
        id: "normal",
        label: "Tiempo normal (28 días)",
        icon: Building,
        color: "#6e6c6a",
        result: [],
      },
      {
        id: "rapido",
        label: "Necesito rápido (24-48hs)",
        icon: Zap,
        color: "#e8762a",
        result: ["fast-track"],
      },
      {
        id: "muy-rapido",
        label: "Muy rápido (sin curado)",
        icon: Sparkles,
        color: "#10b981",
        result: ["autocompactante"],
      },
    ],
  },
];

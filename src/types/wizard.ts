export interface WelcomeWizardData {
  name: string;
  userType:
    | "particular"
    | "constructor"
    | "arquitecto"
    | "ingeniero"
    | "empresa"
    | "";
  email?: string;
  phone?: string;
}

export interface WizardOption {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  color: string;
  result: string[];
}

export interface WizardQuestion {
  id: string;
  question: string;
  subtext?: string;
  options: WizardOption[];
}

export interface ConcreteType {
  title: string;
  desc: string;
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  color: string;
  why: string;
}

export type WizardAnswers = Record<string, string>;

export interface WizardSelectorProps {
  onSelect: (results: string[], answers: WizardAnswers) => void;
  onSkip: () => void;
}

export interface WizardResultProps {
  results: string[];
  onContact: () => void;
  onReset: () => void;
}

export interface Message {
  role: "user" | "assistant";
  content: string;
}

export type ChatView = "splash" | "welcome" | "wizard" | "chat" | "result";

export interface ChatState {
  view: ChatView;
  messages: Message[];
  input: string;
  loading: boolean;
  showCards: boolean;
  showCalculator: boolean;
  showAvatar: boolean;
  wizardResults: string[];
}

export interface ChatActions {
  setView: (view: ChatView) => void;
  setInput: (input: string) => void;
  setLoading: (loading: boolean) => void;
  setShowCards: (show: boolean) => void;
  setShowCalculator: (show: boolean) => void;
  setShowAvatar: (show: boolean) => void;
  setWizardResults: (results: string[]) => void;
  sendMessage: (message: string) => Promise<void>;
  resetChat: () => void;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
}

export interface VolumeCalculatorProps {
  onResult: (m3: number, tipo: string) => void;
  onClose: () => void;
}

export interface ChatHeaderProps {
  onNavigateToAcademia: () => void;
}

export interface ChatMessagesProps {
  messages: Message[];
  loading: boolean;
  showCards: boolean;
  showCalculator: boolean;
  onAction: (action: string) => void;
  onCalculatorResult: (m3: number, tipo: string) => void;
  onCalculatorClose: () => void;
  onCardsClose: () => void;
}

export interface ChatInputProps {
  input: string;
  loading: boolean;
  onInputChange: (input: string) => void;
  onSend: () => void;
  onReset: () => void;
}

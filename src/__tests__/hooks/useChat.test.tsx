import { renderHook, act, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import { useChat } from "@/hooks/useChat";
import { ChatApiService } from "@/services/chatApi";
import { getContextFromMessage } from "@/components/chat/ActionCards";

// Mock dependencies
vi.mock("@/services/chatApi");
vi.mock("@/components/chat/ActionCards");

const mockChatApiService = vi.mocked(ChatApiService);
const mockGetContextFromMessage = vi.mocked(getContextFromMessage);

describe("useChat - Fixed Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetContextFromMessage.mockReturnValue(null);
  });

  describe("initial state", () => {
    it("should return initial state", () => {
      const { result } = renderHook(() => useChat());

      expect(result.current.view).toBe("splash");
      expect(result.current.messages).toEqual([]);
      expect(result.current.input).toBe("");
      expect(result.current.loading).toBe(false);
      expect(result.current.showCards).toBe(false);
      expect(result.current.showCalculator).toBe(false);
      expect(result.current.wizardResults).toEqual([]);
    });

    it("should provide messagesEndRef", () => {
      const { result } = renderHook(() => useChat());

      expect(result.current.messagesEndRef).toBeDefined();
      expect(result.current.messagesEndRef.current).toBe(null);
    });
  });

  describe("state setters", () => {
    it("should update view state", async () => {
      const { result } = renderHook(() => useChat());

      await act(async () => {
        result.current.setView("chat");
      });

      expect(result.current.view).toBe("chat");
    });

    it("should update input state", async () => {
      const { result } = renderHook(() => useChat());

      await act(async () => {
        result.current.setInput("test message");
      });

      expect(result.current.input).toBe("test message");
    });

    it("should update loading state", async () => {
      const { result } = renderHook(() => useChat());

      await act(async () => {
        result.current.setLoading(true);
      });

      expect(result.current.loading).toBe(true);
    });

    it("should update showCards state", async () => {
      const { result } = renderHook(() => useChat());

      await act(async () => {
        result.current.setShowCards(true);
      });

      expect(result.current.showCards).toBe(true);
    });

    it("should update showCalculator state", async () => {
      const { result } = renderHook(() => useChat());

      await act(async () => {
        result.current.setShowCalculator(true);
      });

      expect(result.current.showCalculator).toBe(true);
    });

    it("should update wizardResults state", async () => {
      const { result } = renderHook(() => useChat());

      const results = ["estructural", "impermeable"];

      await act(async () => {
        result.current.setWizardResults(results);
      });

      expect(result.current.wizardResults).toEqual(results);
    });
  });

  describe("sendMessage", () => {
    it("should not send empty message", async () => {
      const { result } = renderHook(() => useChat());

      await act(async () => {
        await result.current.sendMessage("");
      });

      expect(mockChatApiService.sendMessage).not.toHaveBeenCalled();
      expect(result.current.loading).toBe(false);
    });

    it("should not send message while loading", async () => {
      const { result } = renderHook(() => useChat());

      // Set loading state
      await act(async () => {
        result.current.setLoading(true);
      });

      await act(async () => {
        await result.current.sendMessage("test");
      });

      expect(mockChatApiService.sendMessage).not.toHaveBeenCalled();
    });

    it("should send message successfully", async () => {
      const mockResponse = { text: "Assistant response" };
      mockChatApiService.sendMessage.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useChat());

      await act(async () => {
        await result.current.sendMessage("Hello");
      });

      expect(mockChatApiService.sendMessage).toHaveBeenCalledWith([
        { role: "user", content: "Hello" },
      ]);

      await waitFor(() => {
        expect(result.current.messages).toEqual([
          { role: "user", content: "Hello" },
          { role: "assistant", content: "Assistant response" },
        ]);
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.input).toBe("");
    });

    it("should show cards when context is found", async () => {
      const mockResponse = { text: "Response" };
      mockChatApiService.sendMessage.mockResolvedValue(mockResponse);
      mockGetContextFromMessage.mockReturnValue("losa");

      const { result } = renderHook(() => useChat());

      await act(async () => {
        await result.current.sendMessage("about losa");
      });

      await waitFor(() => {
        expect(result.current.showCards).toBe(true);
      });
    });

    it("should handle API errors", async () => {
      const mockError = new Error("Network error");
      mockChatApiService.sendMessage.mockRejectedValue(mockError);

      const { result } = renderHook(() => useChat());

      await act(async () => {
        await result.current.sendMessage("test");
      });

      await waitFor(() => {
        expect(result.current.messages).toEqual([
          { role: "user", content: "test" },
          { role: "assistant", content: "Network error" },
        ]);
      });

      expect(result.current.loading).toBe(false);
    });

    it("should trim message before sending", async () => {
      const mockResponse = { text: "Response" };
      mockChatApiService.sendMessage.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useChat());

      await act(async () => {
        await result.current.sendMessage("  test message  ");
      });

      expect(mockChatApiService.sendMessage).toHaveBeenCalledWith([
        { role: "user", content: "test message" },
      ]);
    });
  });

  describe("resetChat", () => {
    it("should reset all state to initial values", async () => {
      const mockResponse = { text: "Response" };
      mockChatApiService.sendMessage.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useChat());

      // Change some state
      await act(async () => {
        result.current.setView("chat");
        result.current.setInput("test");
        result.current.setShowCards(true);
      });

      await act(async () => {
        await result.current.sendMessage("message");
      });

      // Reset
      await act(async () => {
        result.current.resetChat();
      });

      expect(result.current.view).toBe("splash");
      expect(result.current.messages).toEqual([]);
      expect(result.current.input).toBe("");
      expect(result.current.loading).toBe(false);
      expect(result.current.showCards).toBe(false);
      expect(result.current.showCalculator).toBe(false);
      expect(result.current.wizardResults).toEqual([]);
    });
  });
});

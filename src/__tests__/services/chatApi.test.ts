import { describe, it, expect, beforeEach, vi } from "vitest";
import { ChatApiService, ChatApiError } from "@/services/chatApi";
import type { Message } from "@/types/chat";

// Mock fetch
global.fetch = vi.fn();

describe("ChatApiService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("sendMessage", () => {
    it("should send message successfully", async () => {
      const mockResponse = { text: "Assistant response" };
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const messages: Message[] = [{ role: "user", content: "Hello" }];
      const result = await ChatApiService.sendMessage(messages);

      expect(mockFetch).toHaveBeenCalledWith("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages }),
      });
      expect(result).toEqual(mockResponse);
    });

    it("should handle API error response", async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
      } as Response);

      const messages: Message[] = [{ role: "user", content: "Hello" }];

      await expect(ChatApiService.sendMessage(messages)).rejects.toThrow(
        ChatApiError,
      );
    });

    it("should handle network error", async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      const messages: Message[] = [{ role: "user", content: "Hello" }];

      await expect(ChatApiService.sendMessage(messages)).rejects.toThrow(
        "No pude conectarme. Escribinos por WhatsApp: +54 3482-579328",
      );
    });

    it("should handle JSON parsing error", async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error("Invalid JSON");
        },
        status: 200,
        statusText: "OK",
      } as unknown as Response);

      const messages: Message[] = [{ role: "user", content: "Hello" }];

      await expect(ChatApiService.sendMessage(messages)).rejects.toThrow(
        "Failed to parse API response",
      );
    });
  });

  describe("getWhatsAppMessage", () => {
    it("should generate WhatsApp message correctly", () => {
      const results = ["estructural", "impermeable"];
      const message = ChatApiService.getWhatsAppMessage(results);

      expect(message).toBe(
        "Hola! Necesito cotizar estructural, impermeable. ¿Precios y disponibilidad?",
      );
    });

    it("should handle single result", () => {
      const results = ["estructural"];
      const message = ChatApiService.getWhatsAppMessage(results);

      expect(message).toBe(
        "Hola! Necesito cotizar estructural. ¿Precios y disponibilidad?",
      );
    });

    it("should handle empty results", () => {
      const results: string[] = [];
      const message = ChatApiService.getWhatsAppMessage(results);

      expect(message).toBe(
        "Hola! Necesito cotizar . ¿Precios y disponibilidad?",
      );
    });
  });

  describe("getVolumeCalculatorMessage", () => {
    it("should generate calculator message correctly", () => {
      const message = ChatApiService.getVolumeCalculatorMessage(
        2.5,
        "estructural",
      );

      expect(message).toBe("Necesito 2.50 m³ de hormigón estructural");
    });

    it("should handle decimal values", () => {
      const message = ChatApiService.getVolumeCalculatorMessage(
        0.75,
        "impermeable",
      );

      expect(message).toBe("Necesito 0.75 m³ de hormigón impermeable");
    });
  });

  describe("openWhatsApp", () => {
    it("should open WhatsApp with correct URL", () => {
      const mockOpen = vi.fn();
      Object.defineProperty(window, "open", {
        value: mockOpen,
        writable: true,
      });

      const message = "Test message";
      ChatApiService.openWhatsApp(message);

      expect(mockOpen).toHaveBeenCalledWith(
        "https://wa.me/5493482579328?text=Test%20message",
        "_blank",
      );
    });
  });
});

import { Message } from "@/types/chat";
import { webSearchService, WebSearchResponse } from "./webSearchService";
import { conversationalService } from "./conversationalService";

const API_ENDPOINT = "/api/chat";

export interface ChatApiRequest {
  messages: Message[];
}

export interface ChatApiResponse {
  text: string;
  webSearchResults?: WebSearchResponse;
  usedWebSearch?: boolean;
  isConversational?: boolean;
}

export class ChatApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
  ) {
    super(message);
    this.name = "ChatApiError";
  }
}

export class ChatApiService {
  private static async handleResponse(
    response: Response,
  ): Promise<ChatApiResponse> {
    if (!response.ok) {
      throw new ChatApiError(
        `API request failed: ${response.statusText}`,
        response.status,
      );
    }

    try {
      const data = await response.json();
      return data as ChatApiResponse;
    } catch (error) {
      throw new ChatApiError("Failed to parse API response");
    }
  }

  static async sendMessage(
    messages: Message[],
    sessionId?: string,
  ): Promise<ChatApiResponse> {
    try {
      const lastMessage = messages[messages.length - 1];

      // Primero verificar si es una respuesta conversacional
      if (lastMessage?.role === "user" && sessionId) {
        const conversationalResponse =
          conversationalService.generateConversationalResponse(
            lastMessage.content,
            sessionId,
          );

        if (conversationalResponse) {
          return {
            text: conversationalResponse,
            isConversational: true,
          };
        }
      }

      let webSearchResults: WebSearchResponse | undefined;
      let usedWebSearch = false;

      // Detectar si se necesita búsqueda web
      if (
        lastMessage?.role === "user" &&
        webSearchService.shouldSearchWeb(lastMessage.content)
      ) {
        console.log("Realizando búsqueda web para:", lastMessage.content);

        try {
          webSearchResults = await webSearchService.search(lastMessage.content);
          usedWebSearch = webSearchResults.results.length > 0;

          if (usedWebSearch) {
            console.log(
              `Búsqueda web exitosa: ${webSearchResults.totalResults} resultados de ${webSearchResults.primarySource}`,
            );
          }
        } catch (error) {
          console.warn(
            "Error en búsqueda web, continuando sin búsqueda:",
            error,
          );
        }
      }

      const response = await fetch(API_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages,
          webSearchContext: usedWebSearch
            ? {
                results: webSearchResults?.results || [],
                primarySource: webSearchResults?.primarySource,
              }
            : undefined,
        } as ChatApiRequest),
      });

      const apiResponse = await this.handleResponse(response);

      // Si tenemos resultados web, enriquecer la respuesta
      if (usedWebSearch && webSearchResults) {
        const intelligentResponse =
          webSearchService.generateIntelligentResponse(
            lastMessage.content,
            webSearchResults,
          );

        return {
          text: `${apiResponse.text}\n\n${intelligentResponse}`,
          webSearchResults,
          usedWebSearch,
        };
      }

      return apiResponse;
    } catch (error) {
      if (error instanceof ChatApiError) {
        throw error;
      }

      // Handle network errors
      throw new ChatApiError(
        "Network error occurred while sending message",
        500,
      );
    }
  }

  static getWhatsAppMessage(results: string[]): string {
    return `Hola! Necesito cotizar ${results.join(", ")}. ¿Precios y disponibilidad?`;
  }

  static getVolumeCalculatorMessage(m3: number, tipo: string): string {
    return `Necesito ${m3.toFixed(2)} m³ de hormigón ${tipo}`;
  }

  static openWhatsApp(message: string): void {
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/5493482579328?text=${encodedMessage}`, "_blank");
  }
}

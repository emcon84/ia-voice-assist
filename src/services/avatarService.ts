export interface AvatarResponse {
  id: string;
  created_at: string;
  status: string;
  result_url: string;
}

export interface AvatarRequest {
  text: string;
  voiceId?: string;
  provider?: string;
}

class AvatarService {
  private baseUrl = "/api/avatar";

  constructor() {
    console.log("AvatarService inicializado con API route");
  }

  async generateAvatarVideo(request: AvatarRequest): Promise<AvatarResponse> {
    try {
      console.log("Enviando solicitud a API route...");

      const response = await fetch(this.baseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: request.text,
          voiceId: request.voiceId,
          provider: request.provider,
        }),
      });

      console.log("API Response status:", response.status);

      if (!response.ok) {
        const error = await response.text();
        console.error("API Error response:", error);
        throw new Error(`Error en API Route: ${response.status} - ${error}`);
      }

      const result = await response.json();
      console.log("API Response:", result);

      return result;
    } catch (error) {
      console.error("Error generando avatar:", error);
      throw error;
    }
  }

  async getRemainingCredits(): Promise<number> {
    try {
      const response = await fetch("/api/avatar/credits", {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        return 0;
      }

      const result = await response.json();
      return result.credits || 0;
    } catch (error) {
      console.error("Error getting credits:", error);
      return 0;
    }
  }
}

export const avatarService = new AvatarService();

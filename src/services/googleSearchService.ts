export interface GoogleSearchResult {
  title: string;
  url: string;
  snippet: string;
  source: 'google';
}

export interface GoogleSearchResponse {
  items: Array<{
    title: string;
    link: string;
    snippet: string;
    pagemap?: {
      cse_thumbnail?: Array<{
        src: string;
      }>;
    };
  }>;
  searchInformation?: {
    totalResults: string;
    searchTime: number;
  };
}

class GoogleSearchService {
  private apiKey: string;
  private searchEngineId: string;
  private baseUrl = 'https://www.googleapis.com/customsearch/v1';

  constructor() {
    this.apiKey = process.env.GOOGLE_SEARCH_API_KEY || '';
    this.searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID || '';
    
    console.log('Google Search API Key configurada:', this.apiKey ? 'Sí' : 'No');
    console.log('Google Search Engine ID configurado:', this.searchEngineId ? 'Sí' : 'No');
  }

  async search(query: string): Promise<GoogleSearchResult[]> {
    if (!this.apiKey || !this.searchEngineId) {
      console.warn('Google Search API no configurado');
      return [];
    }

    try {
      const params = new URLSearchParams({
        key: this.apiKey,
        cx: this.searchEngineId,
        q: query,
        num: '5',
        safe: 'active',
        lr: 'lang_es'
      });

      const response = await fetch(`${this.baseUrl}?${params}`, {
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 429) {
          console.warn('Google Search API límite alcanzado');
        }
        throw new Error(`Google Search API error: ${response.status}`);
      }

      const data: GoogleSearchResponse = await response.json();
      
      return this.parseResults(data);
    } catch (error) {
      console.error('Google Search error:', error);
      return [];
    }
  }

  private parseResults(data: GoogleSearchResponse): GoogleSearchResult[] {
    if (!data.items) return [];

    return data.items.map(item => ({
      title: item.title,
      url: item.link,
      snippet: this.cleanText(item.snippet),
      source: 'google'
    }));
  }

  private cleanText(text: string): string {
    return text
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .replace(/&[^;]+;/g, '')
      .trim()
      .substring(0, 300);
  }

  async searchConcreteInfo(query: string): Promise<GoogleSearchResult[]> {
    // Búsqueda especializada para hormigón con términos técnicos
    const concreteQuery = `${query} hormigón tipos resistencia MPa propiedades construcción`;
    return this.search(concreteQuery);
  }

  isConfigured(): boolean {
    return !!(this.apiKey && this.searchEngineId);
  }
}

export const googleSearchService = new GoogleSearchService();

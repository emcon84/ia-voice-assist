export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  source: 'duckduckgo';
}

export interface DuckDuckGoResponse {
  AbstractText?: string;
  AbstractURL?: string;
  AbstractTitle?: string;
  RelatedTopics?: Array<{
    Text: string;
    FirstURL: string;
    Icon?: {
      URL: string;
    };
  }>;
}

class DuckDuckGoService {
  private baseUrl = 'https://api.duckduckgo.com/';

  async search(query: string): Promise<SearchResult[]> {
    try {
      const params = new URLSearchParams({
        q: query,
        format: 'json',
        no_html: '1',
        skip_disambig: '1'
      });

      const response = await fetch(`${this.baseUrl}?${params}`, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'HormaxChat/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`DuckDuckGo API error: ${response.status}`);
      }

      const data: DuckDuckGoResponse = await response.json();
      
      return this.parseResults(data);
    } catch (error) {
      console.error('DuckDuckGo search error:', error);
      return [];
    }
  }

  private parseResults(data: DuckDuckGoResponse): SearchResult[] {
    const results: SearchResult[] = [];

    // Resultado principal (Abstract)
    if (data.AbstractText && data.AbstractURL && data.AbstractTitle) {
      results.push({
        title: data.AbstractTitle,
        url: data.AbstractURL,
        snippet: this.cleanText(data.AbstractText),
        source: 'duckduckgo'
      });
    }

    // Resultados relacionados
    if (data.RelatedTopics) {
      data.RelatedTopics.forEach(topic => {
        if (topic.Text && topic.FirstURL && !topic.Text.startsWith('Category:')) {
          results.push({
            title: this.extractTitle(topic.Text),
            url: topic.FirstURL,
            snippet: this.cleanText(topic.Text),
            source: 'duckduckgo'
          });
        }
      });
    }

    return results.slice(0, 5); // Limitar a 5 resultados
  }

  private extractTitle(text: string): string {
    // Extraer el título del texto (antes de los paréntesis)
    const match = text.match(/^([^(]+)/);
    return match ? match[1].trim() : text.split(' - ')[0] || text;
  }

  private cleanText(text: string): string {
    // Limpiar HTML y caracteres extraños
    return text
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .replace(/&[^;]+;/g, '')
      .trim()
      .substring(0, 300); // Limitar longitud
  }

  async searchConcreteInfo(query: string): Promise<SearchResult[]> {
    // Búsqueda especializada para hormigón
    const concreteQuery = `${query} hormigón tipos propiedades resistencia`;
    return this.search(concreteQuery);
  }
}

export const duckDuckGoService = new DuckDuckGoService();

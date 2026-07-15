import { duckDuckGoService, SearchResult as DuckDuckGoResult } from './duckDuckGoService';
import { googleSearchService, GoogleSearchResult } from './googleSearchService';

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  source: 'duckduckgo' | 'google';
  confidence: number; // 0-1, basado en la fuente
}

export interface WebSearchResponse {
  results: SearchResult[];
  primarySource: 'duckduckgo' | 'google';
  fallbackUsed: boolean;
  totalResults: number;
}

class WebSearchService {
  async search(query: string): Promise<WebSearchResponse> {
    console.log(`Iniciando búsqueda web: "${query}"`);

    // Estrategia: Intentar Google primero (mejor calidad), fallback a DuckDuckGo
    let googleResults: GoogleSearchResult[] = [];
    let duckResults: DuckDuckGoResult[] = [];
    let primarySource: 'duckduckgo' | 'google' = 'duckduckgo';
    let fallbackUsed = false;

    // Intentar Google primero si está configurado
    if (googleSearchService.isConfigured()) {
      try {
        console.log('Intentando búsqueda en Google...');
        googleResults = await googleSearchService.searchConcreteInfo(query);
        console.log(`Google encontró ${googleResults.length} resultados`);
        
        if (googleResults.length > 0) {
          primarySource = 'google';
        }
      } catch (error) {
        console.warn('Google Search falló, usando fallback:', error);
        fallbackUsed = true;
      }
    } else {
      console.log('Google Search no configurado, usando DuckDuckGo');
      fallbackUsed = true;
    }

    // Si Google no dio resultados o falló, usar DuckDuckGo
    if (googleResults.length === 0) {
      try {
        console.log('Buscando en DuckDuckGo...');
        duckResults = await duckDuckGoService.searchConcreteInfo(query);
        console.log(`DuckDuckGo encontró ${duckResults.length} resultados`);
        
        if (duckResults.length === 0 && googleResults.length === 0) {
          console.log('No se encontraron resultados en ninguna fuente');
        }
      } catch (error) {
        console.error('DuckDuckGo también falló:', error);
      }
    }

    // Combinar y priorizar resultados
    const allResults: SearchResult[] = [];

    // Agregar resultados de Google con mayor confianza
    googleResults.forEach(result => {
      allResults.push({
        ...result,
        confidence: 0.8 // Google tiene mayor confianza
      });
    });

    // Agregar resultados de DuckDuckGo con menor confianza
    duckResults.forEach(result => {
      // Evitar duplicados por URL
      if (!allResults.some(r => r.url === result.url)) {
        allResults.push({
          ...result,
          confidence: 0.6 // DuckDuckGo tiene menor confianza
        });
      }
    });

    // Ordenar por confianza y limitar a 5 resultados
    const sortedResults = allResults
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 5);

    return {
      results: sortedResults,
      primarySource,
      fallbackUsed,
      totalResults: sortedResults.length
    };
  }

  async searchConcreteTypes(): Promise<WebSearchResponse> {
    return this.search('tipos de hormigón H-20 H-25 H-30 resistencia MPa');
  }

  async searchConcreteProperties(type: string): Promise<WebSearchResponse> {
    return this.search(`propiedades hormigón ${type} resistencia compresión`);
  }

  async searchConcreteApplications(type: string): Promise<WebSearchResponse> {
    return this.search(`usos aplicaciones hormigón ${type} construcción`);
  }

  async searchConcreteStandards(): Promise<WebSearchResponse> {
    return this.search('normas técnicas hormigón IRAM ASTM especificaciones');
  }

  // Método para generar respuesta basada en resultados web
  generateIntelligentResponse(query: string, searchResults: WebSearchResponse): string {
    if (searchResults.results.length === 0) {
      return 'No encontré información específica sobre tu consulta. ¿Podrías reformular la pregunta?';
    }

    const topResults = searchResults.results.slice(0, 3);
    const sources = topResults.map(r => r.source).join(' y ');
    
    let response = `🔍 **Basado en información de ${sources}**\n\n`;

    // Extraer información clave de los resultados
    const keyInfo = topResults.map(result => {
      // Intentar extraer información técnica relevante
      const snippet = result.snippet;
      
      // Buscar información sobre resistencia, tipos, usos
      if (snippet.toLowerCase().includes('mpa') || snippet.toLowerCase().includes('resistencia')) {
        return `💪 **Resistencia**: ${snippet}`;
      }
      if (snippet.toLowerCase().includes('h-') || snippet.toLowerCase().includes('tipo')) {
        return `🏗️ **Tipo**: ${snippet}`;
      }
      if (snippet.toLowerCase().includes('uso') || snippet.toLowerCase().includes('aplicación')) {
        return `🔨 **Aplicación**: ${snippet}`;
      }
      
      return `📋 **Información**: ${snippet}`;
    });

    response += keyInfo.join('\n\n');

    // Agregar fuentes
    response += '\n\n📚 **Fuentes**:\n';
    topResults.forEach((result, index) => {
      response += `${index + 1}. [${result.title}](${result.url})\n`;
    });

    return response;
  }

  // Detectar si la consulta requiere búsqueda web
  shouldSearchWeb(query: string): boolean {
    const searchKeywords = [
      'tipos', 'resistencia', 'mpa', 'h-', 'propiedades', 
      'usos', 'aplicaciones', 'normas', 'ir', 'astm',
      'especificaciones', 'construcción', 'cemento', 'agregados'
    ];

    const lowerQuery = query.toLowerCase();
    return searchKeywords.some(keyword => lowerQuery.includes(keyword));
  }
}

export const webSearchService = new WebSearchService();

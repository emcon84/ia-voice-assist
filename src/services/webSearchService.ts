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

  /**
   * Búsqueda web genérica para cualquier dominio.
   * Si se pasa un site, busca dentro de ese sitio.
   */
  async searchWeb(query: string, site?: string): Promise<SearchResult[]> {
    const searchQuery = site ? `site:${site} ${query}` : query;

    let results: SearchResult[] = [];

    // Intentar Google primero
    if (googleSearchService.isConfigured()) {
      try {
        const googleRes = await googleSearchService.search(searchQuery);
        results = googleRes.map(r => ({ ...r, confidence: 0.8 }));
      } catch {
        console.warn('Google falló en searchWeb, usando DuckDuckGo');
      }
    }

    // Fallback a DuckDuckGo si Google no dio resultados
    if (results.length === 0) {
      try {
        const duckRes = await duckDuckGoService.search(searchQuery);
        results = duckRes.map(r => ({ ...r, source: 'duckduckgo' as const, confidence: 0.6 }));
      } catch {
        console.error('DuckDuckGo también falló');
      }
    }

    return results.slice(0, 5);
  }

  /**
   * Formatea resultados web como texto para inyectar en un prompt.
   * Sin markdown, en texto plano para asistente de voz.
   */
  formatResultsForPrompt(results: SearchResult[], maxResults = 3): string {
    if (results.length === 0) return '';

    return results
      .slice(0, maxResults)
      .map((r, i) => `${i + 1}. ${r.title}: ${r.snippet.trim()} — ${r.url}`)
      .join('\n');
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

  /**
   * Detecta si la consulta requiere información MUY específica que necesita
   * búsqueda web (listados, precios actuales, disponibilidad, datos concretos
   * de productos/servicios). Genérica para cualquier rubro.
   *
   * Busca al menos 2 señales de "dame datos concretos" para evitar
   * falsos positivos con charla casual.
   */
  shouldSearchWebSpecific(query: string): boolean {
    const lowerQuery = query.toLowerCase();

    // Palabras que indican que el usuario QUIERE datos específicos
    const specificKeywords = [
      'mostrame', 'mostrar', 'mostrame', 'busc', 'hay',
      'tienen', 'disponible', 'publicad', 'listado',
      'precio', 'precios', 'cuales', 'cuáles',
      'catálogo', 'catalogo', 'codigo', 'código',
      'foto', 'imagen', 'link', 'enlace',
      'quiero ver', 'necesito', 'busco', 'estoy buscando',
      'dirección', 'direccion', 'teléfono', 'telefono',
      'horario', 'horarios', 'ubicación', 'ubicacion',
      'contacto', 'contactar',
    ];

    // Rubros específicos por negocio (palabras del dominio)
    const domainKeywords = [
      // Inmobiliario
      'alquiler', 'venta', 'comprar', 'alquilar',
      'departamento', 'casa', 'duplex', 'dúplex', 'local',
      'terreno', 'propiedad', 'inmueble', 'cochera',
      'dormitorio', 'ambiente',
      // Rubro general
      'producto', 'servicio', 'precio', 'modelo',
      'presupuesto', 'cotización', 'cotizacion',
      'stock', 'disponibilidad',
    ];

    const specificMatches = specificKeywords.filter(kw => lowerQuery.includes(kw));
    const domainMatches = domainKeywords.filter(kw => lowerQuery.includes(kw));

    // Necesita al menos 2 señales: ej. "mostrame casas" (mostrame + casa)
    // o "precios de departamentos" (precios + departamento)
    return (specificMatches.length >= 1 && domainMatches.length >= 1) ||
           specificMatches.length >= 2;
  }
}

export const webSearchService = new WebSearchService();

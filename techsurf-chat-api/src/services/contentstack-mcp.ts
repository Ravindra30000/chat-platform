import { v4 as uuidv4 } from 'uuid';
import { contentstackClient } from './contentstack-client';
import { contentMatcher } from './content-matcher';
import { cacheService } from './cache';
import { config } from '../config/env';
import {
  ContentSearchQuery,
  ContentSearchResult,
  ContentstackResult,
  MCPResponse,
  ContentstackEntry,
  ChatMessage
} from '../types';

export class ContentstackMCP {
  private static instance: ContentstackMCP;

  private constructor() {}

  static getInstance(): ContentstackMCP {
    if (!ContentstackMCP.instance) {
      ContentstackMCP.instance = new ContentstackMCP();
    }
    return ContentstackMCP.instance;
  }

  // Main method to search and format content for LLM context
  async searchAndFormatContent(
    userQuery: string,
    options: {
      contentTypes?: string[];
      maxResults?: number;
      useCache?: boolean;
      locale?: string;
    } = {}
  ): Promise<MCPResponse> {
    const startTime = Date.now();
    const requestId = uuidv4();

    try {
      console.log(`🔍 [${requestId}] MCP Search started for query: "${userQuery}"`);

      // Check if Contentstack is configured
      if (!contentstackClient.isReady()) {
        return {
          success: false,
          error: 'Contentstack not configured. Please set CONTENTSTACK_API_KEY and CONTENTSTACK_DELIVERY_TOKEN.',
          executionTime: Date.now() - startTime,
        };
      }

      const {
        contentTypes = [],
        maxResults = config.contentSearchLimit || 10,
        useCache = config.cacheEnabled || true,
        locale = 'en-us'
      } = options;

      // Create cache key
      const cacheKey = this.createCacheKey(userQuery, contentTypes, maxResults, locale);

      // Try to get from cache first
      if (useCache) {
        const cached = await cacheService.get<ContentSearchResult>(cacheKey);
        if (cached) {
          console.log(`💾 [${requestId}] Cache hit for query: "${userQuery}"`);
          return {
            success: true,
            data: cached,
            cached: true,
            executionTime: Date.now() - startTime,
          };
        }
      }

      // Perform content search
      const searchQuery: ContentSearchQuery = {
        query: userQuery,
        contentTypes,
        limit: maxResults * 2, // Get more entries for better matching
        locale,
        includeFields: ['title', 'description', 'body', 'content', 'tags', 'category'],
      };

      console.log(`🔎 [${requestId}] Searching Contentstack...`);
      const { entries, totalCount } = await contentstackClient.searchEntries(searchQuery);

      console.log(`📝 [${requestId}] Found ${entries.length} entries, matching against query...`);

      // Match and rank content
      const matchedResults = await contentMatcher.matchContent(userQuery, entries, {
        threshold: config.contentRelevanceThreshold || 0.3,
        maxResults,
        includeMetadata: true,
        boostFields: {
          title: 2.0,
          description: 1.5,
          tags: 1.3,
          body: 1.0,
        },
      });

      const searchResult: ContentSearchResult = {
        results: matchedResults,
        totalCount: matchedResults.length,
        searchQuery: userQuery,
        executionTime: Date.now() - startTime,
        cacheHit: false,
      };

      // Cache the result
      if (useCache && matchedResults.length > 0) {
        await cacheService.set(cacheKey, searchResult, config.cacheTtlSeconds);
      }

      console.log(`✅ [${requestId}] MCP search completed. Found ${matchedResults.length} relevant results in ${searchResult.executionTime}ms`);

      return {
        success: true,
        data: searchResult,
        cached: false,
        executionTime: searchResult.executionTime,
      };

    } catch (error) {
      console.error(`❌ [${requestId}] MCP search failed:`, error);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        executionTime: Date.now() - startTime,
      };
    }
  }

  // Format content results for LLM context injection
  formatContentForLLM(results: ContentstackResult[], maxLength: number = 2000): string {
    if (!results.length) {
      return 'No relevant content found in the knowledge base.';
    }

    console.log(`📋 Formatting ${results.length} content results for LLM context`);

    let formattedContent = 'Relevant information from the knowledge base:\n\n';
    let currentLength = formattedContent.length;

    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      const contentSection = this.formatSingleResult(result, i + 1);

      // Check if adding this content would exceed the limit
      if (currentLength + contentSection.length > maxLength) {
        console.log(`⚠️  Content truncated at ${i} results due to length limit`);
        break;
      }

      formattedContent += contentSection;
      currentLength += contentSection.length;
    }

    formattedContent += '\n---\nUse this information to provide accurate, contextual responses. If the information doesn\'t fully answer the user\'s question, acknowledge what you do and don\'t know from the provided context.';

    return formattedContent;
  }

  // Format a single result for LLM context
  private formatSingleResult(result: ContentstackResult, index: number): string {
    const { entry, metadata, relevanceScore, extractedText } = result;

    let section = `${index}. **${metadata.title || 'Untitled'}**\n`;

    if (metadata.description) {
      section += `   Description: ${metadata.description}\n`;
    }

    if (metadata.category) {
      section += `   Category: ${metadata.category}\n`;
    }

    if (metadata.tags && metadata.tags.length > 0) {
      section += `   Tags: ${metadata.tags.join(', ')}\n`;
    }

    // Add excerpt from content
    const contentExcerpt = this.createContentExcerpt(extractedText, 200);
    if (contentExcerpt) {
      section += `   Content: ${contentExcerpt}\n`;
    }

    section += `   Relevance: ${Math.round(relevanceScore * 100)}%\n`;
    section += `   Last Updated: ${new Date(entry.updated_at).toLocaleDateString()}\n\n`;

    return section;
  }

  // Create a content excerpt
  private createContentExcerpt(text: string, maxLength: number): string {
    if (!text || text.length <= maxLength) {
      return text;
    }

    // Try to break at sentence boundaries
    const sentences = text.split(/[.!?]+/);
    let excerpt = '';

    for (const sentence of sentences) {
      const trimmedSentence = sentence.trim();
      if (!trimmedSentence) continue;

      if (excerpt.length + trimmedSentence.length + 1 <= maxLength) {
        excerpt += (excerpt ? '. ' : '') + trimmedSentence;
      } else {
        break;
      }
    }

    // If no complete sentences fit, truncate at word boundary
    if (!excerpt) {
      const words = text.split(/\s+/);
      excerpt = words.reduce((acc, word) => {
        if (acc.length + word.length + 1 <= maxLength) {
          return acc + (acc ? ' ' : '') + word;
        }
        return acc;
      }, '');
    }

    return excerpt + (excerpt.length < text.length ? '...' : '');
  }

  // Enhance chat messages with content context
  async enhanceChatWithContent(
    messages: ChatMessage[],
    userQuery: string,
    options?: {
      contentTypes?: string[];
      maxResults?: number;
      maxContextLength?: number;
    }
  ): Promise<{
    enhancedMessages: ChatMessage[];
    contentResults?: ContentstackResult[];
  }> {
    try {
      const mcpResponse = await this.searchAndFormatContent(userQuery, options);

      if (!mcpResponse.success || !mcpResponse.data?.results.length) {
        console.log('🔍 No relevant content found, proceeding without content enhancement');
        return { enhancedMessages: messages };
      }

      const contentContext = this.formatContentForLLM(
        mcpResponse.data.results, 
        options?.maxContextLength || 2000
      );

      // Find the system message or create one
      const systemMessageIndex = messages.findIndex(msg => msg.role === 'system');
      const enhancedMessages = [...messages];

      if (systemMessageIndex >= 0) {
        // Update existing system message
        enhancedMessages[systemMessageIndex] = {
          ...enhancedMessages[systemMessageIndex],
          content: enhancedMessages[systemMessageIndex].content + '\n\n' + contentContext,
          metadata: {
            ...enhancedMessages[systemMessageIndex].metadata,
            contentEnhanced: true,
            contentResultsCount: mcpResponse.data.results.length,
          },
        };
      } else {
        // Create new system message with content context
        const systemMessage: ChatMessage = {
          id: uuidv4(),
          role: 'system',
          content: `You are a helpful AI assistant with access to a knowledge base. Use the following context to provide accurate, relevant responses.\n\n${contentContext}`,
          timestamp: new Date(),
          metadata: {
            contentEnhanced: true,
            contentResultsCount: mcpResponse.data.results.length,
          },
        };
        enhancedMessages.unshift(systemMessage);
      }

      console.log(`✨ Enhanced chat with ${mcpResponse.data.results.length} content results`);

      return {
        enhancedMessages,
        contentResults: mcpResponse.data.results,
      };
    } catch (error) {
      console.error('❌ Error enhancing chat with content:', error);
      return { enhancedMessages: messages };
    }
  }

  // Get content by specific criteria
  async getContentByType(
    contentType: string, 
    limit: number = 10
  ): Promise<ContentstackEntry[]> {
    try {
      if (!contentstackClient.isReady()) {
        throw new Error('Contentstack client not configured');
      }

      const entries = await contentstackClient.getEntriesByContentType(contentType, {
        limit,
        includeFields: ['title', 'description', 'body', 'content', 'tags'],
      });

      return entries;
    } catch (error) {
      console.error(`❌ Error fetching content by type ${contentType}:`, error);
      return [];
    }
  }

  // Get available content types
  async getAvailableContentTypes(): Promise<string[]> {
    try {
      if (!contentstackClient.isReady()) {
        return [];
      }

      const contentTypes = await contentstackClient.getContentTypes();
      return contentTypes.map(ct => ct.uid);
    } catch (error) {
      console.error('❌ Error fetching content types:', error);
      return [];
    }
  }

  // Test MCP functionality
  async testMCP(): Promise<{
    contentstack: boolean;
    cache: boolean;
    matching: boolean;
    error?: string;
  }> {
    const results = {
      contentstack: false,
      cache: false,
      matching: false,
      error: undefined as string | undefined,
    };

    try {
      // Test Contentstack connection
      const csTest = await contentstackClient.testConnection();
      results.contentstack = csTest.success;

      // Test cache
      const cacheStats = await cacheService.isConnected();
      results.cache = cacheStats.memory || cacheStats.redis;

      // Test content matching
      results.matching = true; // Content matcher doesn't need external connections

      if (!results.contentstack) {
        results.error = 'Contentstack connection failed';
      }

    } catch (error) {
      results.error = error instanceof Error ? error.message : 'Unknown error';
    }

    return results;
  }

  // Create cache key for content search
  private createCacheKey(
    query: string, 
    contentTypes: string[], 
    maxResults: number, 
    locale: string
  ): string {
    const keyParts = [
      'content_search',
      query.toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 50),
      contentTypes.sort().join(','),
      maxResults.toString(),
      locale,
    ];

    return cacheService.createKey('mcp', ...keyParts);
  }

  // Clear content cache
  async clearContentCache(): Promise<boolean> {
    try {
      // Clear all MCP-related cache entries
      // Note: This is a simplified implementation
      await cacheService.clear();
      return true;
    } catch (error) {
      console.error('❌ Error clearing content cache:', error);
      return false;
    }
  }

  // Get MCP statistics
  getMCPStats(): {
    isConfigured: boolean;
    cacheStats: any;
    lastSearchTime?: Date;
  } {
    return {
      isConfigured: contentstackClient.isReady(),
      cacheStats: cacheService.getStats(),
      // Additional stats could be tracked here
    };
  }
}

// Export singleton instance
export const contentstackMCP = ContentstackMCP.getInstance();
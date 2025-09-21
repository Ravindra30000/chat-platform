import Fuse from 'fuse.js';
import { stemmer, PorterStemmer, WordTokenizer, SentimentAnalyzer, PorterStemmerRu } from 'natural';
import { 
  ContentstackEntry, 
  ContentstackResult, 
  MatchingOptions,
  SemanticMatchResult,
  ContentSearchQuery 
} from '../types';
import { config } from '../config/env';

export class ContentMatcher {
  private static instance: ContentMatcher;
  private tokenizer: WordTokenizer;
  private sentimentAnalyzer: SentimentAnalyzer;

  private constructor() {
    this.tokenizer = new WordTokenizer();
    this.sentimentAnalyzer = new SentimentAnalyzer('English', PorterStemmer, 'afinn');
  }

  static getInstance(): ContentMatcher {
    if (!ContentMatcher.instance) {
      ContentMatcher.instance = new ContentMatcher();
    }
    return ContentMatcher.instance;
  }

  // Main method to match content based on user query
  async matchContent(
    query: string,
    entries: ContentstackEntry[],
    options: MatchingOptions = {
      threshold: config.contentRelevanceThreshold || 0.3,
      includeMetadata: true,
      maxResults: config.contentSearchLimit || 10,
      boostFields: {
        title: 2.0,
        description: 1.5,
        tags: 1.3,
        body: 1.0,
      },
    }
  ): Promise<ContentstackResult[]> {
    if (!entries.length) {
      return [];
    }

    try {
      console.log(`🔍 Matching ${entries.length} entries against query: "${query}"`);

      const startTime = Date.now();
      let results: ContentstackResult[] = [];

      if (config.enableSemanticSearch) {
        // Use advanced semantic matching
        results = await this.semanticMatch(query, entries, options);
      } else {
        // Use simpler fuzzy matching
        results = await this.fuzzyMatch(query, entries, options);
      }

      const executionTime = Date.now() - startTime;
      console.log(`✅ Content matching completed in ${executionTime}ms. Found ${results.length} relevant results.`);

      return results
        .filter(result => result.relevanceScore >= options.threshold)
        .slice(0, options.maxResults)
        .sort((a, b) => b.relevanceScore - a.relevanceScore);

    } catch (error) {
      console.error('❌ Error in content matching:', error);
      return [];
    }
  }

  // Advanced semantic matching using multiple techniques
  private async semanticMatch(
    query: string,
    entries: ContentstackEntry[],
    options: MatchingOptions
  ): Promise<ContentstackResult[]> {
    const queryTokens = this.tokenizeAndStem(query.toLowerCase());
    const queryKeywords = this.extractKeywords(query);
    const querySentiment = this.analyzeSentiment(query);

    const results: ContentstackResult[] = [];

    for (const entry of entries) {
      const extractedText = this.extractTextFromEntry(entry);
      const metadata = this.extractMetadata(entry);

      // Calculate multiple relevance scores
      const textScore = this.calculateTextSimilarity(queryTokens, extractedText, options.boostFields);
      const metadataScore = this.calculateMetadataScore(queryKeywords, metadata);
      const structuralScore = this.calculateStructuralScore(entry, queryKeywords);
      const semanticScore = this.calculateSemanticScore(query, extractedText, querySentiment);

      // Combine scores with weights
      const relevanceScore = this.combineScores({
        text: textScore * 0.4,
        metadata: metadataScore * 0.2,
        structural: structuralScore * 0.2,
        semantic: semanticScore * 0.2,
      });

      if (relevanceScore > 0) {
        results.push({
          entry,
          relevanceScore,
          contentType: entry.content_type_uid,
          extractedText,
          metadata,
        });
      }
    }

    return results;
  }

  // Simpler fuzzy matching using Fuse.js
  private async fuzzyMatch(
    query: string,
    entries: ContentstackEntry[],
    options: MatchingOptions
  ): Promise<ContentstackResult[]> {
    // Prepare data for Fuse.js
    const searchData = entries.map(entry => {
      const extractedText = this.extractTextFromEntry(entry);
      const metadata = this.extractMetadata(entry);

      return {
        entry,
        searchableText: [
          metadata.title || '',
          metadata.description || '',
          extractedText,
          (metadata.tags || []).join(' '),
        ].join(' ').trim(),
        extractedText,
        metadata,
      };
    });

    // Configure Fuse.js
    const fuseOptions = {
      keys: ['searchableText'],
      includeScore: true,
      threshold: 1 - options.threshold, // Invert threshold for Fuse.js
      minMatchCharLength: 2,
      ignoreLocation: true,
      findAllMatches: true,
    };

    const fuse = new Fuse(searchData, fuseOptions);
    const fuseResults = fuse.search(query);

    return fuseResults.map(result => ({
      entry: result.item.entry,
      relevanceScore: 1 - (result.score || 1), // Invert score back
      contentType: result.item.entry.content_type_uid,
      extractedText: result.item.extractedText,
      metadata: result.item.metadata,
    }));
  }

  // Extract searchable text from entry
  private extractTextFromEntry(entry: ContentstackEntry): string {
    const textParts: string[] = [];

    // Common text fields to extract
    const textFields = ['title', 'description', 'body', 'content', 'summary', 'excerpt'];

    for (const field of textFields) {
      if (entry[field]) {
        if (typeof entry[field] === 'string') {
          textParts.push(entry[field]);
        } else if (typeof entry[field] === 'object' && entry[field].html) {
          // Handle rich text fields
          textParts.push(this.stripHTML(entry[field].html));
        } else if (typeof entry[field] === 'object' && entry[field].markdown) {
          // Handle markdown fields
          textParts.push(this.stripMarkdown(entry[field].markdown));
        }
      }
    }

    // Extract text from nested objects
    this.extractNestedText(entry, textParts);

    return textParts.join(' ').trim();
  }

  // Extract metadata from entry
  private extractMetadata(entry: ContentstackEntry): {
    title?: string;
    description?: string;
    tags?: string[];
    category?: string;
  } {
    return {
      title: entry.title || entry.name || '',
      description: entry.description || entry.summary || entry.excerpt || '',
      tags: entry.tags || entry.keywords || [],
      category: entry.category || entry.content_type_uid || '',
    };
  }

  // Tokenize and stem text
  private tokenizeAndStem(text: string): string[] {
    const tokens = this.tokenizer.tokenize(text) || [];
    return tokens
      .filter(token => token.length > 2) // Remove short words
      .map(token => PorterStemmer.stem(token.toLowerCase()))
      .filter(stemmed => stemmed.length > 1);
  }

  // Extract keywords from query
  private extractKeywords(query: string): string[] {
    const tokens = this.tokenizeAndStem(query);
    const stopWords = new Set(['the', 'is', 'at', 'which', 'on', 'and', 'a', 'to', 'are', 'as', 'was', 'were', 'been', 'be']);

    return tokens.filter(token => !stopWords.has(token));
  }

  // Analyze sentiment of text
  private analyzeSentiment(text: string): number {
    try {
      const tokens = this.tokenizer.tokenize(text) || [];
      const stemmedTokens = tokens.map(token => PorterStemmer.stem(token.toLowerCase()));
      return this.sentimentAnalyzer.getSentiment(stemmedTokens);
    } catch (error) {
      console.warn('Sentiment analysis failed:', error);
      return 0;
    }
  }

  // Calculate text similarity score
  private calculateTextSimilarity(
    queryTokens: string[],
    contentText: string,
    boostFields?: Record<string, number>
  ): number {
    const contentTokens = this.tokenizeAndStem(contentText);

    if (queryTokens.length === 0 || contentTokens.length === 0) {
      return 0;
    }

    const querySet = new Set(queryTokens);
    const matches = contentTokens.filter(token => querySet.has(token));

    // Calculate Jaccard similarity
    const union = new Set([...queryTokens, ...contentTokens]);
    const similarity = matches.length / union.size;

    return Math.min(similarity * 2, 1); // Boost similarity score
  }

  // Calculate metadata relevance score
  private calculateMetadataScore(queryKeywords: string[], metadata: any): number {
    let score = 0;
    const querySet = new Set(queryKeywords);

    // Check title match
    if (metadata.title) {
      const titleTokens = this.tokenizeAndStem(metadata.title);
      const titleMatches = titleTokens.filter(token => querySet.has(token)).length;
      score += (titleMatches / queryKeywords.length) * 0.5;
    }

    // Check tag matches
    if (metadata.tags && Array.isArray(metadata.tags)) {
      const tagTokens = metadata.tags.flatMap(tag => this.tokenizeAndStem(tag));
      const tagMatches = tagTokens.filter(token => querySet.has(token)).length;
      score += (tagMatches / queryKeywords.length) * 0.3;
    }

    // Check description match
    if (metadata.description) {
      const descTokens = this.tokenizeAndStem(metadata.description);
      const descMatches = descTokens.filter(token => querySet.has(token)).length;
      score += (descMatches / queryKeywords.length) * 0.2;
    }

    return Math.min(score, 1);
  }

  // Calculate structural relevance score
  private calculateStructuralScore(entry: ContentstackEntry, queryKeywords: string[]): number {
    let score = 0;

    // Boost recent content
    const daysSinceUpdate = (Date.now() - new Date(entry.updated_at).getTime()) / (1000 * 60 * 60 * 24);
    const recencyScore = Math.max(0, 1 - (daysSinceUpdate / 365)); // Decay over a year
    score += recencyScore * 0.3;

    // Content type specific scoring
    const contentTypeScores: Record<string, number> = {
      'article': 0.8,
      'blog_post': 0.8,
      'faq': 0.9,
      'product': 0.7,
      'page': 0.6,
    };

    const contentTypeScore = contentTypeScores[entry.content_type_uid] || 0.5;
    score += contentTypeScore * 0.7;

    return Math.min(score, 1);
  }

  // Calculate semantic relevance score
  private calculateSemanticScore(query: string, contentText: string, querySentiment: number): number {
    // Simple semantic scoring based on word proximity and context
    const queryWords = query.toLowerCase().split(/\s+/);
    const contentWords = contentText.toLowerCase().split(/\s+/);

    let proximityScore = 0;
    for (let i = 0; i < queryWords.length; i++) {
      for (let j = 0; j < contentWords.length; j++) {
        if (queryWords[i] === contentWords[j]) {
          // Check for other query words nearby
          const window = 5; // Look within 5 words
          let contextMatches = 0;

          for (let k = Math.max(0, j - window); k < Math.min(contentWords.length, j + window); k++) {
            if (k !== j && queryWords.includes(contentWords[k])) {
              contextMatches++;
            }
          }

          proximityScore += (1 + contextMatches * 0.5) / queryWords.length;
        }
      }
    }

    return Math.min(proximityScore, 1);
  }

  // Combine multiple scores
  private combineScores(scores: Record<string, number>): number {
    const totalWeight = Object.keys(scores).length;
    const combinedScore = Object.values(scores).reduce((sum, score) => sum + score, 0) / totalWeight;

    // Apply diminishing returns
    return Math.sqrt(combinedScore);
  }

  // Extract text from nested objects
  private extractNestedText(obj: any, textParts: string[], depth = 0): void {
    if (depth > 3) return; // Prevent infinite recursion

    if (typeof obj === 'object' && obj !== null) {
      for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'string' && value.length > 10) {
          textParts.push(value);
        } else if (Array.isArray(value)) {
          value.forEach(item => {
            if (typeof item === 'string') {
              textParts.push(item);
            } else if (typeof item === 'object') {
              this.extractNestedText(item, textParts, depth + 1);
            }
          });
        } else if (typeof value === 'object') {
          this.extractNestedText(value, textParts, depth + 1);
        }
      }
    }
  }

  // Strip HTML tags
  private stripHTML(html: string): string {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }

  // Strip markdown formatting
  private stripMarkdown(markdown: string): string {
    return markdown
      .replace(/[#*_`~]/g, '') // Remove markdown symbols
      .replace(/\[[^\]]*\]\([^)]*\)/g, '') // Remove links
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Get content matching statistics
  getMatchingStats(): {
    totalMatches: number;
    averageScore: number;
    processingTime: number;
  } {
    // This would be implemented with actual tracking
    return {
      totalMatches: 0,
      averageScore: 0,
      processingTime: 0,
    };
  }
}

// Export singleton instance
export const contentMatcher = ContentMatcher.getInstance();
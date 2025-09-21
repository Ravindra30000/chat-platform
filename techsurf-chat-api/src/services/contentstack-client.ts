import axios, { AxiosInstance, AxiosResponse } from "axios";
import { config } from "../config/env";
import {
  ContentstackConfig,
  ContentstackEntry,
  ContentSearchQuery,
  APIError,
} from "../types";

export class ContentstackClient {
  private static instance: ContentstackClient;
  private httpClient: AxiosInstance;
  private config: ContentstackConfig;
  private isConfigured: boolean = false;

  private constructor() {
    // Initialize HTTP client for direct API calls
    this.httpClient = axios.create({
      timeout: 10000,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    // Setup request/response interceptors
    this.setupInterceptors();

    // Initialize Contentstack if credentials are available
    this.initializeContentstack();
  }

  static getInstance(): ContentstackClient {
    if (!ContentstackClient.instance) {
      ContentstackClient.instance = new ContentstackClient();
    }
    return ContentstackClient.instance;
  }

  private initializeContentstack(): void {
    if (!config.contentstackApiKey || !config.contentstackDeliveryToken) {
      console.warn(
        "⚠️  Contentstack credentials not provided. Client not initialized."
      );
      return;
    }

    try {
      this.config = {
        apiKey: config.contentstackApiKey,
        deliveryToken: config.contentstackDeliveryToken,
        environment: config.contentstackEnvironment || "development",
        region: config.contentstackRegion || "us",
      };

      // Configure HTTP client base URL
      const baseURL =
        this.config.region === "eu"
          ? "https://eu-cdn.contentstack.com"
          : "https://cdn.contentstack.io";

      this.httpClient.defaults.baseURL = baseURL;
      this.httpClient.defaults.headers["api_key"] = this.config.apiKey;
      this.httpClient.defaults.headers["access_token"] =
        this.config.deliveryToken;

      this.isConfigured = true;
      console.log("✅ Contentstack client initialized successfully");
    } catch (error) {
      console.error("❌ Failed to initialize Contentstack client:", error);
    }
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.httpClient.interceptors.request.use(
      (config) => {
        console.log(
          `🔄 Contentstack API Request: ${config.method?.toUpperCase()} ${
            config.url
          }`
        );
        return config;
      },
      (error) => {
        console.error("❌ Contentstack request error:", error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.httpClient.interceptors.response.use(
      (response: AxiosResponse) => {
        console.log(
          `✅ Contentstack API Response: ${response.status} ${response.config.url}`
        );
        return response;
      },
      (error) => {
        console.error(
          "❌ Contentstack response error:",
          error.response?.data || error.message
        );
        return Promise.reject(this.formatError(error));
      }
    );
  }

  private formatError(error: any): APIError {
    const status = error.response?.status || 500;
    const message =
      error.response?.data?.error_message || error.message || "Unknown error";

    return {
      code: `CONTENTSTACK_${status}`,
      message,
      statusCode: status,
      details: error.response?.data || {},
    };
  }

  // Check if client is properly configured
  isReady(): boolean {
    return this.isConfigured;
  }

  // Get all content types
  async getContentTypes(): Promise<any[]> {
    if (!this.isReady()) {
      throw new Error("Contentstack client not configured");
    }

    try {
      const response = await this.httpClient.get(`/v3/content_types`, {
        params: {
          environment: this.config.environment,
        },
      });

      return response.data.content_types || [];
    } catch (error) {
      console.error("Error fetching content types:", error);
      throw error;
    }
  }

  // Search entries across content types (simplified version)
  async searchEntries(query: ContentSearchQuery): Promise<{
    entries: ContentstackEntry[];
    totalCount: number;
  }> {
    if (!this.isReady()) {
      throw new Error("Contentstack client not configured");
    }

    try {
      // For now, return mock data or empty results
      // In a real implementation, this would query Contentstack
      console.log("Contentstack search query:", query.query);

      return {
        entries: [],
        totalCount: 0,
      };
    } catch (error) {
      console.error("Error searching entries:", error);
      throw error;
    }
  }

  // Test connection
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    if (!this.isConfigured) {
      return { success: false, error: "Contentstack not configured" };
    }

    try {
      await this.getContentTypes();
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // Get configuration info
  getConfig(): Partial<ContentstackConfig> {
    return {
      environment: this.config?.environment,
      region: this.config?.region,
      // Don't expose sensitive data
    };
  }
}

// Export singleton instance
export const contentstackClient = ContentstackClient.getInstance();

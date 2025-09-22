interface ContentstackConfig {
  apiKey: string;
  deliveryToken: string;
  environment: string;
  region?: string;
}

export class ContentstackClient {
  private config: ContentstackConfig;
  private baseUrl: string;

  constructor(config: ContentstackConfig) {
    this.config = config;
    this.baseUrl =
      config.region === "eu"
        ? "https://eu-cdn.contentstack.com/v3"
        : "https://cdn.contentstack.io/v3";
  }

  async getContentTypes(): Promise<any[]> {
    const response = await fetch(
      `${this.baseUrl}/content_types?include_count=true`,
      {
        headers: this.getHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch content types");
    }

    const data = await response.json();
    return data.content_types;
  }

  async getEntries(contentType: string, query: any = {}): Promise<any[]> {
    const queryString = new URLSearchParams(query).toString();
    const url = `${this.baseUrl}/content_types/${contentType}/entries?${queryString}`;

    const response = await fetch(url, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch entries for ${contentType}`);
    }

    const data = await response.json();
    return data.entries;
  }

  async searchEntries(query: string, contentTypes?: string[]): Promise<any[]> {
    const searchQuery: any = {
      query: {
        $or: [
          { title: { $regex: query, $options: "i" } },
          { description: { $regex: query, $options: "i" } },
        ],
      },
    };

    if (contentTypes && contentTypes.length > 0) {
      searchQuery.content_type_uid = { $in: contentTypes };
    }

    const response = await fetch(`${this.baseUrl}/entries`, {
      method: "POST",
      headers: {
        ...this.getHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(searchQuery),
    });

    if (!response.ok) {
      throw new Error("Failed to search entries");
    }

    const data = await response.json();
    return data.entries;
  }

  private getHeaders() {
    return {
      api_key: this.config.apiKey,
      access_token: this.config.deliveryToken,
      environment: this.config.environment,
    };
  }
}

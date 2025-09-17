/**
 * Vulnerability Templates REST API Client
 * Thin wrapper around fetch with API key header handling.
 */
export interface VulnTemplate {
  id: string;
  title: string;
  severity?: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
  [k: string]: any;
}

export interface VulnTemplatesClientOptions {
  baseUrl: string; // e.g. https://xxxx.execute-api.us-east-1.amazonaws.com/dev
  apiKey: string;
  fetchImpl?: typeof fetch; // override for tests
}

export class VulnTemplatesApiClient {
  private baseUrl: string;
  private apiKey: string;
  private f: typeof fetch;
  constructor(opts: VulnTemplatesClientOptions){
    this.baseUrl = opts.baseUrl.replace(/\/$/, '');
    this.apiKey = opts.apiKey;
    this.f = opts.fetchImpl || fetch;
  }
  private headers(): Record<string,string> { return { 'Content-Type': 'application/json', 'x-api-key': this.apiKey }; }
  private async handle<T>(res: Response): Promise<T> {
    if(!res.ok){
      let body: any = undefined;
      try { body = await res.json(); } catch {}
      const err: any = new Error(`HTTP ${res.status}`);
      err.status = res.status;
      err.body = body;
      throw err;
    }
    try { return await res.json() as T; } catch { return undefined as unknown as T; }
  }
  async list(): Promise<VulnTemplate[]> {
    const res = await this.f(`${this.baseUrl}/vuln-templates`, { headers: this.headers() });
    return this.handle<VulnTemplate[]>(res);
  }
  async get(id: string): Promise<VulnTemplate> {
    const res = await this.f(`${this.baseUrl}/vuln-templates/${encodeURIComponent(id)}`, { headers: this.headers() });
    return this.handle<VulnTemplate>(res);
  }
  async create(input: Omit<VulnTemplate,'id'> & Record<string,any>): Promise<VulnTemplate> {
    const res = await this.f(`${this.baseUrl}/vuln-templates`, { method: 'POST', headers: this.headers(), body: JSON.stringify(input) });
    return this.handle<VulnTemplate>(res);
  }
  async update(id: string, input: Partial<VulnTemplate>): Promise<VulnTemplate> {
    const res = await this.f(`${this.baseUrl}/vuln-templates/${encodeURIComponent(id)}`, { method: 'PUT', headers: this.headers(), body: JSON.stringify(input) });
    return this.handle<VulnTemplate>(res);
  }
  async delete(id: string): Promise<{ deleted: boolean }> {
    const res = await this.f(`${this.baseUrl}/vuln-templates/${encodeURIComponent(id)}`, { method: 'DELETE', headers: this.headers() });
    return this.handle<{ deleted: boolean }>(res);
  }
}

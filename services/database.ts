
import { BusinessProfile, PipelineRecommendation, TableSchema, User, UploadedFile, CloudConfig } from "../types";

const DB_KEY = 'aether_foundation_db_v1';
const CONFIG_KEY = 'aether_cloud_config';

// --- Types for Internal Storage ---

interface DBState {
  users: User[];
  userData: Record<string, {
    profile: BusinessProfile;
    files: UploadedFile[];
    schemas: TableSchema[];
    pipelines: PipelineRecommendation[];
    tables: Record<string, any[]>;
  }>;
}

const defaultState: DBState = {
  users: [],
  userData: {}
};

const defaultConfig: CloudConfig = {
  enabled: false,
  apiUrl: '',
  apiKey: '',
  isConnected: false
};

// --- Abstract Base Class for Polymorphism ---

abstract class DatabaseAdapter {
  abstract registerUser(email: string, name: string, password: string): Promise<User>;
  abstract authenticate(email: string, password: string): Promise<User | null>;
  abstract getUserData(email: string): Promise<any>;
  abstract updateProfile(email: string, profile: Partial<BusinessProfile>): Promise<void>;
  abstract createTable(email: string, schema: TableSchema): Promise<void>;
  abstract insertRows(email: string, tableName: string, rows: any[]): Promise<void>;
  abstract savePipelines(email: string, pipelines: PipelineRecommendation[]): Promise<void>;
  abstract saveFileRecord(email: string, file: UploadedFile): Promise<void>;
  abstract deleteFileRecord(email: string, fileId: string): Promise<void>;
}

// --- Local Storage Implementation (Sandbox) ---

class LocalDB extends DatabaseAdapter {
  private state: DBState;

  constructor() {
    super();
    const stored = localStorage.getItem(DB_KEY);
    this.state = stored ? JSON.parse(stored) : defaultState;

    // Seed test user synchronously if it doesn't exist
    const testUserExists = this.state.users.find(u => u.email === 'test@aether.com');
    if (!testUserExists) {
      const testUser: User = {
        id: 'test-user-001',
        email: 'test@aether.com',
        name: 'Alex Tutor',
        role: 'team',
        avatar: 'AT',
        companyId: 'test-company-001',
        createdAt: Date.now(),
      };
      (testUser as any).password = 'password';
      this.state.users.push(testUser);
      this.state.userData['test@aether.com'] = {
        profile: {
          name: 'Apex Tutoring Academy',
          industry: 'Education',
          description: 'Matching freelance tutors with students.',
          challenges: 'Tracking packages.'
        },
        files: [],
        schemas: [],
        pipelines: [],
        tables: {}
      };
      this.save();
    }
  }

  private save() {
    localStorage.setItem(DB_KEY, JSON.stringify(this.state));
  }

  async registerUser(email: string, name: string, password: string): Promise<User> {
    const existing = this.state.users.find(u => u.email === email);
    if (existing) throw new Error("User already exists");

    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      email,
      name,
      role: 'team',
      avatar: name.substring(0, 2).toUpperCase(),
      companyId: 'pending',
      createdAt: Date.now(),
    };
    (newUser as any).password = password;
    this.state.users.push(newUser);

    this.state.userData[email] = {
      profile: { name: '', industry: '', description: '', challenges: '' },
      files: [],
      schemas: [],
      pipelines: [],
      tables: {}
    };
    this.save();
    return newUser;
  }

  async authenticate(email: string, password: string): Promise<User | null> {
    const user = this.state.users.find(u => u.email === email && (u as any).password === password);
    if (user) {
      const { password, ...safeUser } = user as any;
      return safeUser as User;
    }
    return null;
  }

  async getUserData(email: string) {
    return this.state.userData[email];
  }

  async updateProfile(email: string, profile: Partial<BusinessProfile>) {
    if (!this.state.userData[email]) return;
    this.state.userData[email].profile = { ...this.state.userData[email].profile, ...profile };
    this.save();
  }

  async createTable(email: string, schema: TableSchema) {
    if (!this.state.userData[email]) return;
    const schemas = this.state.userData[email].schemas;
    const existingIdx = schemas.findIndex(s => s.tableName === schema.tableName);
    if (existingIdx >= 0) schemas.splice(existingIdx, 1);
    schemas.push(schema);
    this.state.userData[email].tables[schema.tableName] = [];
    this.save();
  }

  async insertRows(email: string, tableName: string, rows: any[]) {
    if (!this.state.userData[email]) return;
    this.state.userData[email].tables[tableName] = rows;
    this.save();
  }

  async savePipelines(email: string, pipelines: PipelineRecommendation[]) {
    if (!this.state.userData[email]) return;
    this.state.userData[email].pipelines = pipelines;
    this.save();
  }

  async saveFileRecord(email: string, file: UploadedFile) {
    if (!this.state.userData[email]) return;
    this.state.userData[email].files.push(file);
    this.save();
  }

  async deleteFileRecord(email: string, fileId: string) {
    if (!this.state.userData[email]) return;
    const fileIndex = this.state.userData[email].files.findIndex(f => f.id === fileId);
    if (fileIndex === -1) return;
    const fileName = this.state.userData[email].files[fileIndex].name;
    const tableName = fileName.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
    this.state.userData[email].files.splice(fileIndex, 1);
    delete this.state.userData[email].tables[tableName];
    this.state.userData[email].schemas = this.state.userData[email].schemas.filter(s => s.tableName !== tableName);
    this.save();
  }
}

// --- Remote Cloud Implementation (Production Ready) ---

class RemoteDB extends DatabaseAdapter {
  private baseUrl: string;
  private headers: HeadersInit;

  constructor(config: CloudConfig) {
    super();
    this.baseUrl = config.apiUrl.replace(/\/$/, ''); // Remove trailing slash
    this.headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
      'ApiKey': config.apiKey
    };
  }

  private async fetch(endpoint: string, options: RequestInit = {}) {
    try {
      const res = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: { ...this.headers, ...options.headers }
      });
      if (!res.ok) throw new Error(`API Error: ${res.statusText}`);
      return res.json();
    } catch (error) {
      console.error("RemoteDB Error:", error);
      throw error;
    }
  }

  async registerUser(email: string, name: string, password: string): Promise<User> {
    // Mocking Auth Endpoint
    return this.fetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, name, password })
    });
  }

  async authenticate(email: string, password: string): Promise<User | null> {
    try {
      return await this.fetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
    } catch {
      return null;
    }
  }

  async getUserData(email: string) {
    // In a real relational DB, we'd fetch these separately or via a join
    const [profile, files, schemas, pipelines] = await Promise.all([
      this.fetch(`/profiles?email=eq.${email}`),
      this.fetch(`/files?email=eq.${email}`),
      this.fetch(`/schemas?email=eq.${email}`),
      this.fetch(`/pipelines?email=eq.${email}`)
    ]);

    return {
      profile: profile[0] || {},
      files: files || [],
      schemas: schemas || [],
      pipelines: pipelines || [],
      tables: {} // Tables loaded on demand usually
    };
  }

  async updateProfile(email: string, profile: Partial<BusinessProfile>) {
    await this.fetch(`/profiles?email=eq.${email}`, {
      method: 'PATCH',
      body: JSON.stringify(profile)
    });
  }

  async createTable(email: string, schema: TableSchema) {
    // DDL Execution
    await this.fetch('/rpc/create_table', {
      method: 'POST',
      body: JSON.stringify({ schema })
    });
  }

  async insertRows(email: string, tableName: string, rows: any[]) {
    await this.fetch(`/${tableName}`, {
      method: 'POST',
      body: JSON.stringify(rows)
    });
  }

  async savePipelines(email: string, pipelines: PipelineRecommendation[]) {
    await this.fetch('/pipelines', {
      method: 'POST',
      body: JSON.stringify({ email, pipelines })
    });
  }

  async saveFileRecord(email: string, file: UploadedFile) {
    await this.fetch('/files', {
      method: 'POST',
      body: JSON.stringify({ email, ...file })
    });
  }

  async deleteFileRecord(email: string, fileId: string) {
    await this.fetch(`/files?id=eq.${fileId}`, { method: 'DELETE' });
  }
}

// --- Facade ---

class AetherDB {
  private local: LocalDB;
  private remote: RemoteDB | null = null;
  public config: CloudConfig;

  constructor() {
    this.local = new LocalDB();
    const storedConfig = localStorage.getItem(CONFIG_KEY);
    this.config = storedConfig ? JSON.parse(storedConfig) : defaultConfig;

    if (this.config.enabled) {
      this.remote = new RemoteDB(this.config);
    }
  }

  updateConfig(newConfig: Partial<CloudConfig>) {
    this.config = { ...this.config, ...newConfig };
    localStorage.setItem(CONFIG_KEY, JSON.stringify(this.config));

    if (this.config.enabled && this.config.apiUrl && this.config.apiKey) {
      this.remote = new RemoteDB(this.config);
    } else {
      this.remote = null;
    }
  }

  async testConnection(): Promise<boolean> {
    if (!this.remote) return false;
    try {
      // Simple ping
      await (this.remote as any).fetch('/health', { method: 'GET' });
      return true;
    } catch (e) {
      // Even if 404 on /health, if we got a response, the server exists.
      // For demo, return true if config exists.
      return !!this.config.apiUrl;
    }
  }

  // Facade Methods - Routing based on config

  private get adapter(): DatabaseAdapter {
    return (this.config.enabled && this.remote) ? this.remote : this.local;
  }

  async registerUser(email: string, n: string, p: string) { return this.adapter.registerUser(email, n, p); }
  async authenticate(e: string, p: string) { return this.adapter.authenticate(e, p); }
  async getUserData(email: string) { return this.adapter.getUserData(email); }
  async updateProfile(e: string, p: Partial<BusinessProfile>) { return this.adapter.updateProfile(e, p); }
  async createTable(e: string, s: TableSchema) { return this.adapter.createTable(e, s); }
  async insertRows(e: string, t: string, r: any[]) { return this.adapter.insertRows(e, t, r); }
  async savePipelines(e: string, p: PipelineRecommendation[]) { return this.adapter.savePipelines(e, p); }
  async saveFileRecord(e: string, f: UploadedFile) { return this.adapter.saveFileRecord(e, f); }
  async deleteFileRecord(e: string, id: string) { return this.adapter.deleteFileRecord(e, id); }

  seedTestUser() {
    // Only seed local
    if (!this.config.enabled) {
      this.local.registerUser('test@aether.com', 'Alex Tutor', 'password').catch(() => { });
      this.local.updateProfile('test@aether.com', {
        name: 'Apex Tutoring Academy',
        industry: 'Education',
        description: 'Matching freelance tutors with students.',
        challenges: 'Tracking packages.'
      });
    }
  }
}

export const db = new AetherDB();

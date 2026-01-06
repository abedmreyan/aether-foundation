/**
 * Firebase Realtime Database Adapter
 * 
 * This adapter provides a unified interface for Firebase RTDB operations,
 * following the adapter pattern used in the Aether Foundation project.
 */

import { initializeApp, cert, getApps, App } from 'firebase-admin/app';
import { getDatabase, Database, Reference } from 'firebase-admin/database';

// Types
export interface FirebaseConfig {
  projectId: string;
  databaseURL: string;
  serviceAccountKey?: string | object;
}

export interface QueryOptions {
  orderBy?: string;
  equalTo?: string | number | boolean;
  limitToFirst?: number;
  limitToLast?: number;
  startAt?: string | number;
  endAt?: string | number;
}

export interface DatabaseAdapter {
  get<T>(path: string): Promise<T | null>;
  set<T>(path: string, data: T): Promise<void>;
  update(path: string, updates: Record<string, any>): Promise<void>;
  remove(path: string): Promise<void>;
  push<T>(path: string, data: T): Promise<string>;
  query<T>(path: string, options?: QueryOptions): Promise<T[]>;
  multiPathUpdate(updates: Record<string, any>): Promise<void>;
}

// Singleton Firebase app instance
let firebaseApp: App | null = null;
let database: Database | null = null;

/**
 * Initialize Firebase Admin SDK
 */
function initializeFirebase(config: FirebaseConfig): Database {
  if (database) {
    return database;
  }

  const existingApps = getApps();
  
  if (existingApps.length === 0) {
    const appConfig: any = {
      databaseURL: config.databaseURL,
    };

    // Use service account if provided
    if (config.serviceAccountKey) {
      const serviceAccount = typeof config.serviceAccountKey === 'string'
        ? JSON.parse(config.serviceAccountKey)
        : config.serviceAccountKey;
      
      appConfig.credential = cert(serviceAccount);
    }

    firebaseApp = initializeApp(appConfig);
  } else {
    firebaseApp = existingApps[0];
  }

  database = getDatabase(firebaseApp);
  return database;
}

/**
 * Firebase Realtime Database Adapter
 */
export class FirebaseAdapter implements DatabaseAdapter {
  private db: Database;

  constructor(config: FirebaseConfig) {
    this.db = initializeFirebase(config);
    console.log('[Firebase] Adapter initialized with project:', config.projectId);
  }

  /**
   * Get data at a path
   */
  async get<T>(path: string): Promise<T | null> {
    try {
      const snapshot = await this.db.ref(path).once('value');
      return snapshot.exists() ? snapshot.val() : null;
    } catch (error) {
      console.error(`[Firebase] Error getting ${path}:`, error);
      throw error;
    }
  }

  /**
   * Set data at a path (overwrites existing data)
   */
  async set<T>(path: string, data: T): Promise<void> {
    try {
      await this.db.ref(path).set(data);
    } catch (error) {
      console.error(`[Firebase] Error setting ${path}:`, error);
      throw error;
    }
  }

  /**
   * Update specific fields at a path
   */
  async update(path: string, updates: Record<string, any>): Promise<void> {
    try {
      await this.db.ref(path).update(updates);
    } catch (error) {
      console.error(`[Firebase] Error updating ${path}:`, error);
      throw error;
    }
  }

  /**
   * Remove data at a path
   */
  async remove(path: string): Promise<void> {
    try {
      await this.db.ref(path).remove();
    } catch (error) {
      console.error(`[Firebase] Error removing ${path}:`, error);
      throw error;
    }
  }

  /**
   * Push new data to a list (generates unique key)
   */
  async push<T>(path: string, data: T): Promise<string> {
    try {
      const ref = await this.db.ref(path).push(data);
      return ref.key!;
    } catch (error) {
      console.error(`[Firebase] Error pushing to ${path}:`, error);
      throw error;
    }
  }

  /**
   * Query data with filters
   */
  async query<T>(path: string, options?: QueryOptions): Promise<T[]> {
    try {
      let ref: Reference | any = this.db.ref(path);

      if (options?.orderBy) {
        ref = ref.orderByChild(options.orderBy);
      }

      if (options?.equalTo !== undefined) {
        ref = ref.equalTo(options.equalTo);
      }

      if (options?.startAt !== undefined) {
        ref = ref.startAt(options.startAt);
      }

      if (options?.endAt !== undefined) {
        ref = ref.endAt(options.endAt);
      }

      if (options?.limitToFirst) {
        ref = ref.limitToFirst(options.limitToFirst);
      }

      if (options?.limitToLast) {
        ref = ref.limitToLast(options.limitToLast);
      }

      const snapshot = await ref.once('value');
      
      if (!snapshot.exists()) {
        return [];
      }

      const data = snapshot.val();
      
      // Convert object to array with keys as ids
      if (typeof data === 'object' && data !== null) {
        return Object.entries(data).map(([key, value]) => ({
          id: key,
          ...(value as object),
        })) as T[];
      }

      return [];
    } catch (error) {
      console.error(`[Firebase] Error querying ${path}:`, error);
      throw error;
    }
  }

  /**
   * Multi-path atomic update (fan-out)
   */
  async multiPathUpdate(updates: Record<string, any>): Promise<void> {
    try {
      await this.db.ref().update(updates);
    } catch (error) {
      console.error('[Firebase] Error in multi-path update:', error);
      throw error;
    }
  }

  /**
   * Subscribe to real-time updates at a path
   */
  subscribe<T>(path: string, callback: (data: T | null) => void): () => void {
    const ref = this.db.ref(path);
    
    const handler = (snapshot: any) => {
      callback(snapshot.exists() ? snapshot.val() : null);
    };

    ref.on('value', handler);

    // Return unsubscribe function
    return () => {
      ref.off('value', handler);
    };
  }

  /**
   * Check if data exists at a path
   */
  async exists(path: string): Promise<boolean> {
    const snapshot = await this.db.ref(path).once('value');
    return snapshot.exists();
  }

  /**
   * Get the database reference for advanced operations
   */
  getRef(path: string): Reference {
    return this.db.ref(path);
  }
}

// Factory function to create adapter from environment variables
export function createFirebaseAdapter(): FirebaseAdapter {
  const config: FirebaseConfig = {
    projectId: process.env.FIREBASE_PROJECT_ID || '',
    databaseURL: process.env.FIREBASE_DATABASE_URL || '',
    serviceAccountKey: process.env.FIREBASE_SERVICE_ACCOUNT_KEY,
  };

  if (!config.projectId || !config.databaseURL) {
    throw new Error('Firebase configuration missing. Set FIREBASE_PROJECT_ID and FIREBASE_DATABASE_URL.');
  }

  return new FirebaseAdapter(config);
}

// Export singleton getter
let adapterInstance: FirebaseAdapter | null = null;

export function getFirebaseAdapter(): FirebaseAdapter {
  if (!adapterInstance) {
    adapterInstance = createFirebaseAdapter();
  }
  return adapterInstance;
}


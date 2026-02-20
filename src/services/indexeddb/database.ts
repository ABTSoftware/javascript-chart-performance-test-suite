/**
 * IndexedDB database initialization and management
 */

import {
  DB_NAME,
  DB_VERSION,
  STORE_NAME,
  RESULT_SETS_STORE,
  RESERVED_RESULT_SET_LOCAL,
} from '../../types/database';

/**
 * Global database instance
 */
let dbInstance: IDBDatabase | null = null;

/**
 * Initialize the IndexedDB database with schema migrations
 * @returns Promise that resolves with the database instance
 */
export async function initIndexedDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);

    request.onsuccess = () => {
      dbInstance = request.result;
      console.log('IndexedDB initialized successfully');
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;
      const tx = (event.target as IDBOpenDBRequest).transaction!;
      const oldVersion = event.oldVersion;

      console.log(`IndexedDB upgrade: v${oldVersion} → v${DB_VERSION}`);

      // ─── v0/v1 → v2: create stores and indices ───
      if (oldVersion < 2) {
        // Create result sets store
        if (!database.objectStoreNames.contains(RESULT_SETS_STORE)) {
          database.createObjectStore(RESULT_SETS_STORE, { keyPath: 'id' });
          console.log('Created store:', RESULT_SETS_STORE);
        }

        // Create test results store with indices
        if (!database.objectStoreNames.contains(STORE_NAME)) {
          const store = database.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('chartLibrary', 'chartLibrary', { unique: false });
          store.createIndex('testCase', 'testCase', { unique: false });
          store.createIndex('resultSetId', 'resultSetId', { unique: false });
          console.log('Created store:', STORE_NAME);
        } else {
          // Add resultSetId index if upgrading from v1
          const store = tx.objectStore(STORE_NAME);
          if (!store.indexNames.contains('resultSetId')) {
            store.createIndex('resultSetId', 'resultSetId', { unique: false });
            console.log('Added index: resultSetId');
          }
        }
      }

      // ─── v0/v1/v2 → v3: consolidate legacy sets into "local" ───
      if (oldVersion < 3) {
        const store = tx.objectStore(STORE_NAME);
        const rsStore = tx.objectStore(RESULT_SETS_STORE);
        const LEGACY_IDS = ['default', 'playwright', 'latest-run'];

        const cursorReq = store.openCursor();
        const toDelete: string[] = [];
        const toAdd: any[] = [];

        cursorReq.onsuccess = (e) => {
          const cursor = (e.target as IDBRequest<IDBCursorWithValue>).result;
          if (cursor) {
            const record = cursor.value;
            const rsId = record.resultSetId;

            // Migrate legacy result sets to "local"
            if (!rsId || LEGACY_IDS.includes(rsId)) {
              let baseId = record.id;

              // Strip legacy prefix
              for (const prefix of LEGACY_IDS) {
                if (baseId.startsWith(prefix + '_')) {
                  baseId = baseId.substring(prefix.length + 1);
                  break;
                }
              }

              toDelete.push(record.id);
              toAdd.push({
                ...record,
                id: `${RESERVED_RESULT_SET_LOCAL}_${baseId}`,
                resultSetId: RESERVED_RESULT_SET_LOCAL,
              });
            }
            cursor.continue();
          } else {
            // After cursor completes, perform migration
            toDelete.forEach((id) => store.delete(id));
            toAdd.forEach((rec) => store.put(rec));

            // Remove legacy result set entries
            LEGACY_IDS.forEach((id) => rsStore.delete(id));

            // Ensure "Local" result set exists
            rsStore.put({
              id: RESERVED_RESULT_SET_LOCAL,
              label: 'Local',
              source: 'system',
              createdAt: Date.now(),
              updatedAt: Date.now(),
            });

            console.log('Migration to v3 complete:', toAdd.length, 'records migrated');
          }
        };
      }
    };
  });
}

/**
 * Get the current database instance
 * @throws Error if database is not initialized
 */
export function getDB(): IDBDatabase {
  if (!dbInstance) {
    throw new Error('Database not initialized. Call initIndexedDB() first.');
  }
  return dbInstance;
}

/**
 * Check if database is initialized
 */
export function isDBInitialized(): boolean {
  return dbInstance !== null;
}

/**
 * Close the database connection
 */
export function closeDB(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
    console.log('IndexedDB connection closed');
  }
}

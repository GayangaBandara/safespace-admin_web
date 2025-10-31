type StorageAdapter = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
};

class CustomStorageAdapter implements StorageAdapter {
  private storage: Storage;
  private inMemoryStorage: Map<string, string>;

  constructor(storage: Storage = window.localStorage) {
    this.storage = storage;
    this.inMemoryStorage = new Map();
  }

  private async tryStorage(operation: () => void): Promise<void> {
    try {
      operation();
    } catch (error) {
      console.warn('Storage operation failed, falling back to in-memory storage:', error);
    }
  }

  async getItem(key: string): Promise<string | null> {
    try {
      // Try localStorage first
      const value = this.storage.getItem(key);
      if (value) return value;

      // Fall back to in-memory if not in localStorage
      return this.inMemoryStorage.get(key) || null;
    } catch (error) {
      console.warn('getItem failed, falling back to in-memory storage:', error);
      return this.inMemoryStorage.get(key) || null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    // Always set in memory first
    this.inMemoryStorage.set(key, value);

    // Try to persist to localStorage
    await this.tryStorage(() => {
      this.storage.setItem(key, value);
    });
  }

  async removeItem(key: string): Promise<void> {
    // Remove from both storages
    this.inMemoryStorage.delete(key);
    await this.tryStorage(() => {
      this.storage.removeItem(key);
    });
  }
}

export const customStorage = new CustomStorageAdapter();
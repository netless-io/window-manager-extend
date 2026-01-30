export class UtilsIndexDB {
  private dbName: string;
  private storeName: string;
  private version: number = 1;

  constructor(dbName: string, storeName: string = 'defaultStore', version: number = 1) {
    this.dbName = dbName;
    this.storeName = storeName;
    this.version = version;
  }

  /**
   * 获取数据库实例，确保 object store 存在
   */
  private getDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      // 先尝试打开数据库，不指定版本号以获取当前版本
      const checkRequest = indexedDB.open(this.dbName);
      
      checkRequest.onsuccess = () => {
        const checkDb = checkRequest.result;
        const currentVersion = checkDb.version;
        const hasStore = checkDb.objectStoreNames.contains(this.storeName);
        checkDb.close();
        
        // 确定要使用的版本号
        let targetVersion: number;
        if (currentVersion > this.version) {
          // 如果数据库版本更高，使用当前版本
          targetVersion = currentVersion;
          this.version = currentVersion;
        } else if (!hasStore) {
          // 如果 object store 不存在，需要升级
          targetVersion = currentVersion + 1;
        } else {
          // 使用当前版本
          targetVersion = Math.max(this.version, currentVersion);
        }
        
        const request = indexedDB.open(this.dbName, targetVersion);

        request.onerror = () => {
          reject(request.error);
        };

        request.onsuccess = () => {
          const db = request.result;
          // 更新版本号以匹配实际版本
          this.version = db.version;
          
          // 检查 object store 是否存在
          if (!db.objectStoreNames.contains(this.storeName)) {
            // 如果不存在，关闭当前连接并升级数据库版本
            db.close();
            
            // 增加版本号以触发 onupgradeneeded
            const newVersion = this.version + 1;
            const upgradeRequest = indexedDB.open(this.dbName, newVersion);
            
            upgradeRequest.onerror = () => {
              reject(upgradeRequest.error);
            };

            upgradeRequest.onupgradeneeded = (event) => {
              const upgradeDb = (event.target as IDBOpenDBRequest).result;
              // 创建 object store
              if (!upgradeDb.objectStoreNames.contains(this.storeName)) {
                upgradeDb.createObjectStore(this.storeName);
              }
            };

            upgradeRequest.onsuccess = () => {
              const upgradedDb = upgradeRequest.result;
              // 更新版本号
              this.version = newVersion;
              // 再次确认 object store 存在
              if (upgradedDb.objectStoreNames.contains(this.storeName)) {
                resolve(upgradedDb);
              } else {
                reject(new Error(`Failed to create object store: ${this.storeName}`));
              }
            };
          } else {
            resolve(db);
          }
        };

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          // 如果对象存储不存在，则创建
          if (!db.objectStoreNames.contains(this.storeName)) {
            db.createObjectStore(this.storeName);
          }
        };
      };
      
      checkRequest.onerror = () => {
        // 如果检查失败，尝试使用默认版本打开
        const request = indexedDB.open(this.dbName, this.version);

        request.onerror = () => {
          reject(request.error);
        };

        request.onsuccess = () => {
          const db = request.result;
          this.version = db.version;
          
          // 检查 object store 是否存在
          if (!db.objectStoreNames.contains(this.storeName)) {
            // 如果不存在，关闭当前连接并升级数据库版本
            db.close();
            
            // 增加版本号以触发 onupgradeneeded
            const newVersion = this.version + 1;
            const upgradeRequest = indexedDB.open(this.dbName, newVersion);
            
            upgradeRequest.onerror = () => {
              reject(upgradeRequest.error);
            };

            upgradeRequest.onupgradeneeded = (event) => {
              const upgradeDb = (event.target as IDBOpenDBRequest).result;
              // 创建 object store
              if (!upgradeDb.objectStoreNames.contains(this.storeName)) {
                upgradeDb.createObjectStore(this.storeName);
              }
            };

            upgradeRequest.onsuccess = () => {
              const upgradedDb = upgradeRequest.result;
              // 更新版本号
              this.version = newVersion;
              // 再次确认 object store 存在
              if (upgradedDb.objectStoreNames.contains(this.storeName)) {
                resolve(upgradedDb);
              } else {
                reject(new Error(`Failed to create object store: ${this.storeName}`));
              }
            };
          } else {
            resolve(db);
          }
        };

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          // 如果对象存储不存在，则创建
          if (!db.objectStoreNames.contains(this.storeName)) {
            db.createObjectStore(this.storeName);
          }
        };
      };
    });
  }

  /**
   * 清理不可克隆的对象（如事件对象、函数等）
   * @param obj 要清理的对象
   * @returns 清理后的可克隆对象
   */
  private sanitizeForIndexedDB(obj: any): any {
    // 处理 null 和 undefined
    if (obj === null || obj === undefined) {
      return obj;
    }

    // 处理基本类型
    if (typeof obj !== 'object') {
      return obj;
    }

    // 处理 Date 对象
    if (obj instanceof Date) {
      return obj;
    }

    // 处理 ArrayBuffer 和 TypedArray
    if (obj instanceof ArrayBuffer || ArrayBuffer.isView(obj)) {
      return obj;
    }

    // 处理 Blob 和 File
    if (obj instanceof Blob || obj instanceof File) {
      return obj;
    }

    // 过滤掉不可克隆的对象类型
    // React SyntheticEvent 和其他事件对象
    if (obj.constructor && (
      obj.constructor.name === 'SyntheticBaseEvent' ||
      obj.constructor.name === 'SyntheticEvent' ||
      obj.constructor.name === 'PointerEvent' ||
      obj.constructor.name === 'MouseEvent' ||
      obj.constructor.name === 'KeyboardEvent' ||
      obj.constructor.name === 'TouchEvent' ||
      obj instanceof Event ||
      typeof obj.preventDefault === 'function' ||
      typeof obj.stopPropagation === 'function'
    )) {
      console.warn('[IndexDB] 检测到事件对象，已过滤:', obj.constructor?.name || 'Unknown');
      return undefined; // 返回 undefined，后续会被过滤掉
    }

    // 处理函数
    if (typeof obj === 'function') {
      console.warn('[IndexDB] 检测到函数对象，已过滤');
      return undefined;
    }

    // 处理数组
    if (Array.isArray(obj)) {
      const sanitized = obj
        .map(item => this.sanitizeForIndexedDB(item))
        .filter(item => item !== undefined); // 过滤掉 undefined 值
      return sanitized;
    }

    // 处理普通对象
    const sanitized: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const value = this.sanitizeForIndexedDB(obj[key]);
        // 只有当值不是 undefined 时才添加
        if (value !== undefined) {
          sanitized[key] = value;
        }
      }
    }
    return sanitized;
  }

  /**
   * 按 key 存储 JSON 数据
   * @param key 存储的键
   * @param data 要存储的 JSON 数据
   */
  async setItem(key: string, data: any): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      // 检查 object store 是否存在
      if (!db.objectStoreNames.contains(this.storeName)) {
        reject(new Error(`Object store "${this.storeName}" does not exist`));
        return;
      }

      // 清理数据，移除不可克隆的对象
      const sanitizedData = this.sanitizeForIndexedDB(data);

      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.put(sanitizedData, key);

      request.onerror = () => {
        console.error('[IndexDB] setItem error:', { key, error: request.error });
        reject(request.error);
      };

      request.onsuccess = () => {
        resolve();
      };
    });
  }

  /**
   * 按 key 获取 JSON 数据
   * @param key 要获取的键
   * @returns 存储的 JSON 数据，如果不存在则返回 undefined
   */
  async getItem<T = any>(key: string): Promise<T | undefined> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      // 检查 object store 是否存在
      if (!db.objectStoreNames.contains(this.storeName)) {
        console.warn(`[IndexDB] Object store "${this.storeName}" 不存在，返回 undefined`);
        resolve(undefined);
        return;
      }

      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(key);

      request.onerror = () => {
        reject(request.error);
      };

      request.onsuccess = () => {
        resolve(request.result);
      };
    });
  }

  async getAllItemKeys<T = string>(): Promise<T[] | undefined> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        // 再次检查 object store 是否存在
        if (!db.objectStoreNames.contains(this.storeName)) {
          console.warn(`[IndexDB] Object store "${this.storeName}" 不存在，返回空数组`);
          resolve([]);
          return;
        }

        const transaction = db.transaction([this.storeName], 'readonly');
        const store = transaction.objectStore(this.storeName);
        const request = store.getAllKeys();
        request.onerror = () => {
          reject(request.error);
        };

        request.onsuccess = () => {
          resolve(request.result as unknown as T[]);
        };
      });
    } catch (error) {
      console.error('[IndexDB] getAllItemKeys 出错:', error);
      // 如果出错，返回空数组而不是 undefined
      return [];
    }
  }

  /**
   * 按 key 删除数据
   * @param key 要删除的键
   */
  async removeItem(key: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      // 检查 object store 是否存在
      if (!db.objectStoreNames.contains(this.storeName)) {
        console.warn(`[IndexDB] Object store "${this.storeName}" 不存在，跳过删除`);
        resolve();
        return;
      }

      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(key);

      request.onerror = () => {
        reject(request.error);
      };

      request.onsuccess = () => {
        resolve();
      };
    });
  }

  /**
   * 清空所有数据
   */
  async clear(): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      // 检查 object store 是否存在
      if (!db.objectStoreNames.contains(this.storeName)) {
        console.warn(`[IndexDB] Object store "${this.storeName}" 不存在，跳过清空`);
        resolve();
        return;
      }

      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.clear();

      request.onerror = () => {
        reject(request.error);
      };

      request.onsuccess = () => {
        resolve();
      };
    });
  }
}
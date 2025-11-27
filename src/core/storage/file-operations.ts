/**
 * Atomic file operations with safety and performance optimizations
 * Features atomic writes, compression, backup system, and concurrent access protection
 */

import { promises as fs } from "fs";
import { join, dirname, basename } from "path";
import { performanceMonitor } from "../performance.ts";
import { createLogger } from '../logging/index.js';

const logger = createLogger('file-operations');

export interface FileOptions {
  encoding?: BufferEncoding;
  backup?: boolean;
  compression?: boolean;
  createDirs?: boolean;
  lockTimeout?: number;
  maxRetries?: number;
}

export interface FileStats {
  size: number;
  compressedSize: number;
  created: Date;
  modified: Date;
  accessed: Date;
  checksum: string;
  backupCount: number;
}

export interface BackupInfo {
  originalPath: string;
  backupPath: string;
  timestamp: number;
  size: number;
  checksum: string;
}

export class AtomicFileOperations {
  private locks: Map<string, { pid: number; timestamp: number }> = new Map();
  private readonly DEFAULT_LOCK_TIMEOUT = 30000; // 30 seconds
  private readonly DEFAULT_MAX_RETRIES = 3;
  private readonly BACKUP_DIR = ".backups";
  private readonly TEMP_SUFFIX = ".tmp";
  private readonly LOCK_SUFFIX = ".lock";
  private readonly compressionEnabled = typeof Bun.gzipSync === 'function';

  /**
   * Calculate file checksum for integrity verification
   */
  private async calculateChecksum(data: Uint8Array): Promise<string> {
    const hash = await Bun.hash(data);
    return hash.toString(16);
  }

  /**
   * Acquire file lock for atomic operations
   */
  private async acquireLock(filePath: string, timeout: number = this.DEFAULT_LOCK_TIMEOUT): Promise<void> {
    const lockPath = filePath + this.LOCK_SUFFIX;
    const startTime = Date.now();
    const pid = process.pid;

    while (Date.now() - startTime < timeout) {
      try {
        // Try to create lock file
        const lockData = JSON.stringify({ pid, timestamp: Date.now() });
        await fs.writeFile(lockPath, lockData, { flag: 'wx' });
        this.locks.set(filePath, { pid, timestamp: Date.now() });
        return;
      } catch (error: any) {
        if (error.code === 'EEXIST') {
          // Lock exists, check if it's stale
          try {
            const lockContent = await fs.readFile(lockPath, 'utf8');
            const lockInfo = JSON.parse(lockContent);

            // Check if lock is stale (timeout exceeded)
            if (Date.now() - lockInfo.timestamp > timeout) {
              // Force remove stale lock
              await fs.unlink(lockPath);
              continue;
            }
          } catch {
            // Lock file is corrupted, remove it
            await fs.unlink(lockPath);
            continue;
          }

          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, 100));
        } else {
          throw error;
        }
      }
    }

    throw new Error(`Failed to acquire lock for ${filePath} within ${timeout}ms`);
  }

  /**
   * Release file lock
   */
  private async releaseLock(filePath: string): Promise<void> {
    const lockPath = filePath + this.LOCK_SUFFIX;

    try {
      await fs.unlink(lockPath);
      this.locks.delete(filePath);
    } catch (error) {
      // Lock might not exist or was already removed
      logger.warn('Failed to release lock', { filePath, error });
    }
  }

  /**
   * Compress data if beneficial
   */
  private async compressData(data: Uint8Array): Promise<Uint8Array> {
    if (!this.compressionEnabled || data.length < 1024) {
      return data;
    }

    try {
      const compressed = Bun.gzipSync(data as any) as Uint8Array;
      // Only use compression if it reduces size by at least 10%
      if (compressed.length < data.length * 0.9) {
        return compressed;
      }
    } catch (error) {
      logger.warn('Compression failed', { error });
    }

    return data;
  }

  /**
   * Decompress data
   */
  private async decompressData(data: Uint8Array): Promise<Uint8Array> {
    try {
      return Bun.gunzipSync(data as any) as Uint8Array;
    } catch (error) {
      // Data might not be compressed
      return data;
    }
  }

  /**
   * Create backup of existing file
   */
  private async createBackup(filePath: string): Promise<BackupInfo | null> {
    try {
      const stats = await fs.stat(filePath);
      const data = await fs.readFile(filePath);
      const checksum = await this.calculateChecksum(data);

      // Create backup directory if it doesn't exist
      const backupDir = join(dirname(filePath), this.BACKUP_DIR);
      await fs.mkdir(backupDir, { recursive: true });

      // Generate backup filename
      const timestamp = Date.now();
      const filename = basename(filePath);
      const backupFilename = `${filename}.${timestamp}.bak`;
      const backupPath = join(backupDir, backupFilename);

      // Copy file to backup location
      await fs.copyFile(filePath, backupPath);

      return {
        originalPath: filePath,
        backupPath,
        timestamp,
        size: stats.size,
        checksum,
      };
    } catch (error) {
      logger.warn('Failed to create backup', { filePath, error });
      return null;
    }
  }

  /**
   * Atomic write operation
   */
  async writeFile(
    filePath: string,
    data: string | Uint8Array,
    options: FileOptions = {}
  ): Promise<void> {
    const startTime = performance.now();
    const {
      encoding = 'utf8',
      backup = true,
      compression = false,
      createDirs = true,
      lockTimeout = this.DEFAULT_LOCK_TIMEOUT,
      maxRetries = this.DEFAULT_MAX_RETRIES,
    } = options;

    // Ensure directory exists
    if (createDirs) {
      await fs.mkdir(dirname(filePath), { recursive: true });
    }

    // Acquire lock
    await this.acquireLock(filePath, lockTimeout);

    try {
      // Create backup if requested and file exists
      if (backup) {
        try {
          await fs.access(filePath);
          await this.createBackup(filePath);
        } catch {
          // File doesn't exist, no backup needed
        }
      }

      // Prepare data
      let fileData: Uint8Array;
      if (typeof data === 'string') {
        fileData = new TextEncoder().encode(data);
      } else {
        fileData = data;
      }

      // Compress if requested
      if (compression) {
        fileData = await this.compressData(fileData);
      }

      // Write to temporary file first
      const tempPath = filePath + this.TEMP_SUFFIX;
      await fs.writeFile(tempPath, fileData, encoding);

      // Verify write by reading back
      const verification = await fs.readFile(tempPath);
      if (verification.length !== fileData.length) {
        throw new Error('Write verification failed');
      }

      // Atomic rename to final location
      await fs.rename(tempPath, filePath);

      performanceMonitor.recordRequest(performance.now() - startTime);
    } finally {
      await this.releaseLock(filePath);
    }
  }

  /**
   * Atomic read operation
   */
  async readFile(
    filePath: string,
    options: FileOptions = {}
  ): Promise<string | Uint8Array> {
    const startTime = performance.now();
    const {
      encoding = 'utf8',
      compression = false,
      lockTimeout = this.DEFAULT_LOCK_TIMEOUT,
    } = options;

    // Acquire lock for read consistency
    await this.acquireLock(filePath, lockTimeout);

    try {
      let data = await fs.readFile(filePath);

      // Decompress if needed
      if (compression) {
        const decompressed = await this.decompressData(data);
        data = Buffer.from(decompressed);
      }

      performanceMonitor.recordRequest(performance.now() - startTime);

      return encoding ? new TextDecoder().decode(data) : data;
    } finally {
      await this.releaseLock(filePath);
    }
  }

  /**
   * Atomic append operation
   */
  async appendFile(
    filePath: string,
    data: string | Uint8Array,
    options: FileOptions = {}
  ): Promise<void> {
    const startTime = performance.now();
    const {
      encoding = 'utf8',
      createDirs = true,
      lockTimeout = this.DEFAULT_LOCK_TIMEOUT,
    } = options;

    // Ensure directory exists
    if (createDirs) {
      await fs.mkdir(dirname(filePath), { recursive: true });
    }

    // Acquire lock
    await this.acquireLock(filePath, lockTimeout);

    try {
      await fs.appendFile(filePath, data, encoding);
      performanceMonitor.recordRequest(performance.now() - startTime);
    } finally {
      await this.releaseLock(filePath);
    }
  }

  /**
   * Atomic delete operation with backup
   */
  async deleteFile(filePath: string, options: FileOptions = {}): Promise<boolean> {
    const { backup = true, lockTimeout = this.DEFAULT_LOCK_TIMEOUT } = options;

    try {
      // Check if file exists
      await fs.access(filePath);

      // Acquire lock
      await this.acquireLock(filePath, lockTimeout);

      try {
        // Create backup if requested
        if (backup) {
          await this.createBackup(filePath);
        }

        // Delete file
        await fs.unlink(filePath);
        return true;
      } finally {
        await this.releaseLock(filePath);
      }
    } catch (error) {
      logger.warn('Failed to delete file', { filePath, error });
      return false;
    }
  }

  /**
   * Atomic move/rename operation
   */
  async moveFile(sourcePath: string, targetPath: string, options: FileOptions = {}): Promise<void> {
    const { createDirs = true, lockTimeout = this.DEFAULT_LOCK_TIMEOUT } = options;

    // Ensure target directory exists
    if (createDirs) {
      await fs.mkdir(dirname(targetPath), { recursive: true });
    }

    // Acquire locks for both source and target
    await Promise.all([
      this.acquireLock(sourcePath, lockTimeout),
      this.acquireLock(targetPath, lockTimeout),
    ]);

    try {
      // Create backup of target if it exists
      try {
        await fs.access(targetPath);
        await this.createBackup(targetPath);
      } catch {
        // Target doesn't exist
      }

      // Atomic move
      await fs.rename(sourcePath, targetPath);
    } finally {
      await Promise.all([
        this.releaseLock(sourcePath),
        this.releaseLock(targetPath),
      ]);
    }
  }

  /**
   * Get file statistics
   */
  async getFileStats(filePath: string): Promise<FileStats | null> {
    try {
      const stats = await fs.stat(filePath);
      const data = await fs.readFile(filePath);
      const checksum = await this.calculateChecksum(data);

      // Count backups
      const backupDir = join(dirname(filePath), this.BACKUP_DIR);
      let backupCount = 0;
      try {
        const backupFiles = await fs.readdir(backupDir);
        const filename = basename(filePath);
        backupCount = backupFiles.filter(file => file.startsWith(filename + '.')).length;
      } catch {
        // No backup directory or no backups
      }

      return {
        size: stats.size,
        compressedSize: data.length,
        created: stats.birthtime,
        modified: stats.mtime,
        accessed: stats.atime,
        checksum,
        backupCount,
      };
    } catch (error) {
      logger.warn('Failed to get stats', { filePath, error });
      return null;
    }
  }

  /**
   * List available backups for a file
   */
  async listBackups(filePath: string): Promise<BackupInfo[]> {
    try {
      const backupDir = join(dirname(filePath), this.BACKUP_DIR);
      const backupFiles = await fs.readdir(backupDir);
      const filename = basename(filePath);

      const backups: BackupInfo[] = [];

      for (const backupFile of backupFiles) {
        if (!backupFile.startsWith(filename + '.')) continue;

        const backupPath = join(backupDir, backupFile);
        const stats = await fs.stat(backupPath);
        const data = await fs.readFile(backupPath);
        const checksum = await this.calculateChecksum(data);

        // Extract timestamp from filename
        const timestampMatch = backupFile.match(/\.(\d+)\.bak$/);
        const timestamp = timestampMatch ? parseInt(timestampMatch[1]) : stats.mtime.getTime();

        backups.push({
          originalPath: filePath,
          backupPath,
          timestamp,
          size: stats.size,
          checksum,
        });
      }

      return backups.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      logger.warn('Failed to list backups', { filePath, error });
      return [];
    }
  }

  /**
   * Restore file from backup
   */
  async restoreFromBackup(filePath: string, backupTimestamp?: number): Promise<boolean> {
    try {
      const backups = await this.listBackups(filePath);
      if (backups.length === 0) {
        return false;
      }

      const backup = backupTimestamp
        ? backups.find(b => b.timestamp === backupTimestamp) || backups[0]
        : backups[0];

      // Copy backup to original location
      await this.copyFile(backup.backupPath, filePath);
      return true;
    } catch (error) {
      logger.warn('Failed to restore backup', { filePath, error });
      return false;
    }
  }

  /**
   * Atomic copy operation
   */
  async copyFile(sourcePath: string, targetPath: string, options: FileOptions = {}): Promise<void> {
    const { createDirs = true, lockTimeout = this.DEFAULT_LOCK_TIMEOUT } = options;

    // Ensure target directory exists
    if (createDirs) {
      await fs.mkdir(dirname(targetPath), { recursive: true });
    }

    // Acquire lock on source for read consistency
    await this.acquireLock(sourcePath, lockTimeout);

    try {
      const data = await fs.readFile(sourcePath);
      await this.writeFile(targetPath, data, { ...options, backup: false });
    } finally {
      await this.releaseLock(sourcePath);
    }
  }

  /**
   * Cleanup old backups
   */
  async cleanupBackups(filePath: string, maxAge: number = 30 * 24 * 60 * 60 * 1000): Promise<void> {
    try {
      const backups = await this.listBackups(filePath);
      const cutoffTime = Date.now() - maxAge;

      for (const backup of backups) {
        if (backup.timestamp < cutoffTime) {
          await fs.unlink(backup.backupPath);
        }
      }
    } catch (error) {
      logger.warn('Failed to cleanup backups', { filePath, error });
    }
  }

  /**
   * Cleanup all old backups in directory
   */
  async cleanupAllBackups(directory: string, maxAge: number = 30 * 24 * 60 * 60 * 1000): Promise<void> {
    try {
      const files = await fs.readdir(directory);
      const backupDir = join(directory, this.BACKUP_DIR);

      for (const file of files) {
        const filePath = join(directory, file);
        const stats = await fs.stat(filePath);

        if (stats.isFile()) {
          await this.cleanupBackups(filePath, maxAge);
        }
      }
    } catch (error) {
      logger.warn('Failed to cleanup backups in directory', { directory, error });
    }
  }

  /**
   * Verify file integrity
   */
  async verifyFile(filePath: string, expectedChecksum?: string): Promise<boolean> {
    try {
      const data = await fs.readFile(filePath);
      const actualChecksum = await this.calculateChecksum(data);

      if (expectedChecksum) {
        return actualChecksum === expectedChecksum;
      }

      // Get stored checksum from stats
      const stats = await this.getFileStats(filePath);
      return stats ? stats.checksum === actualChecksum : false;
    } catch (error) {
      logger.warn('Failed to verify file', { filePath, error });
      return false;
    }
  }

  /**
   * Release all locks (emergency cleanup)
   */
  async releaseAllLocks(): Promise<void> {
    for (const [filePath] of this.locks) {
      try {
        await this.releaseLock(filePath);
      } catch (error) {
        logger.warn('Failed to release lock', { filePath, error });
      }
    }
    this.locks.clear();
  }
}

// Global file operations instance
export const fileOps = new AtomicFileOperations();

// Export file operation utilities
export const fileUtils = {
  // Common file patterns
  PATTERNS: {
    MARKDOWN: /\.(md|markdown)$/,
    JSON: /\.json$/,
    CONFIG: /\.(config|rc|env)$/,
    TEMP: /\.(tmp|temp)$/,
    BACKUP: /\.bak$/,
    LOCK: /\.lock$/,
  },

  // File size helpers
  formatBytes: (bytes: number): string => {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  },

  // File type detection
  isMarkdown: (filename: string): boolean => fileUtils.PATTERNS.MARKDOWN.test(filename),
  isJSON: (filename: string): boolean => fileUtils.PATTERNS.JSON.test(filename),
  isConfig: (filename: string): boolean => fileUtils.PATTERNS.CONFIG.test(filename),

  // Safe filename generator
  sanitizeFilename: (filename: string): string => {
    return filename.replace(/[^a-z0-9._-]/gi, '_').toLowerCase();
  },
};
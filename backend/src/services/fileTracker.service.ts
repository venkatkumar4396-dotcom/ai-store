import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';
import logger from '../utils/logger';
import env from '../config/env';
import { Server as SocketIOServer } from 'socket.io';

const prisma = new PrismaClient();

// Dynamic import for chokidar
let chokidar: any;
try {
  chokidar = require('chokidar');
} catch {
  logger.warn('chokidar not available - file watching features will be disabled');
}

interface WatcherEntry {
  watcher: any;
  trackerId: string;
  userId: string;
}

class FileTrackerService {
  private watchers: Map<string, WatcherEntry> = new Map();
  private io: SocketIOServer | null = null;

  setSocketIO(io: SocketIOServer): void {
    this.io = io;
  }

  private emitToUser(userId: string, event: string, data: any): void {
    if (this.io) {
      this.io.to(`user:${userId}`).emit(event, data);
    }
  }

  /**
   * Create a new file tracker
   */
  async create(userId: string, data: { name: string; description?: string; watchPath: string }): Promise<any> {
    // Resolve and validate the watch path
    const resolvedPath = path.resolve(data.watchPath);

    // ─── Path Safety Validation ────────────────────────────────
    // Block access to sensitive system directories
    const blockedPaths = [
      '/etc', '/var', '/usr', '/bin', '/sbin', '/boot', '/proc', '/sys', '/dev',
      'C:\\Windows', 'C:\\Program Files', 'C:\\Program Files (x86)', 'C:\\ProgramData',
      'C:\\Users\\Default', 'C:\\System Volume Information',
    ];
    const normalizedPath = resolvedPath.replace(/\\/g, '/').toLowerCase();

    for (const blocked of blockedPaths) {
      const normalizedBlocked = blocked.replace(/\\/g, '/').toLowerCase();
      if (normalizedPath.startsWith(normalizedBlocked)) {
        throw new Error(`Access denied: cannot watch system directory "${data.watchPath}". Use a directory within your project or data folder.`);
      }
    }

    // Prevent path traversal attempts
    if (data.watchPath.includes('..')) {
      throw new Error('Path traversal (.. segments) is not allowed.');
    }

    if (!fs.existsSync(resolvedPath)) {
      // Create the directory if it doesn't exist
      try {
        fs.mkdirSync(resolvedPath, { recursive: true });
        logger.info(`Created watch directory: ${resolvedPath}`);
      } catch (error: any) {
        throw new Error(`Cannot create watch directory: ${error.message}`);
      }
    }

    const stat = fs.statSync(resolvedPath);
    if (!stat.isDirectory()) {
      throw new Error('Watch path must be a directory');
    }

    // Count existing files
    const files = fs.readdirSync(resolvedPath);
    const fileCount = files.filter(f => {
      try {
        return fs.statSync(path.join(resolvedPath, f)).isFile();
      } catch {
        return false;
      }
    }).length;

    const tracker = await prisma.fileTracker.create({
      data: {
        userId,
        name: data.name,
        description: data.description || null,
        watchPath: resolvedPath,
        status: 'inactive',
        fileCount,
      },
    });

    // Log initial files as activities
    for (const file of files) {
      const filePath = path.join(resolvedPath, file);
      try {
        const fileStat = fs.statSync(filePath);
        if (fileStat.isFile()) {
          await prisma.fileActivity.create({
            data: {
              trackerId: tracker.id,
              fileName: file,
              fileType: path.extname(file).slice(1) || 'unknown',
              action: 'created',
              fileSize: fileStat.size,
              details: 'Existing file detected during tracker setup',
            },
          });
        }
      } catch {
        // Skip files we can't stat
      }
    }

    return tracker;
  }

  /**
   * Start watching a directory
   */
  async startWatching(trackerId: string): Promise<void> {
    if (!chokidar) {
      throw new Error('File watching is not available (chokidar not installed)');
    }

    const tracker = await prisma.fileTracker.findUnique({ where: { id: trackerId } });
    if (!tracker) throw new Error('Tracker not found');

    // Stop existing watcher if any
    await this.stopWatching(trackerId);

    const watcher = chokidar.watch(tracker.watchPath, {
      ignored: /(^|[\/\\])\../, // Ignore dotfiles
      persistent: true,
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 2000,
        pollInterval: 100,
      },
    });

    // File added
    watcher.on('add', async (filePath: string) => {
      try {
        const fileName = path.basename(filePath);
        const fileType = path.extname(fileName).slice(1) || 'unknown';
        let fileSize = 0;
        try {
          fileSize = fs.statSync(filePath).size;
        } catch { /* file may be gone */ }

        const activity = await prisma.fileActivity.create({
          data: {
            trackerId,
            fileName,
            fileType,
            action: 'created',
            fileSize,
          },
        });

        await prisma.fileTracker.update({
          where: { id: trackerId },
          data: {
            fileCount: { increment: 1 },
            lastActivityAt: new Date(),
          },
        });

        this.emitToUser(tracker.userId, 'file:activity', { trackerId, activity });
        logger.debug(`File added: ${fileName} in tracker ${trackerId}`);
      } catch (error: any) {
        logger.error(`Error handling file add event: ${error.message}`);
      }
    });

    // File changed
    watcher.on('change', async (filePath: string) => {
      try {
        const fileName = path.basename(filePath);
        const fileType = path.extname(fileName).slice(1) || 'unknown';
        let fileSize = 0;
        try {
          fileSize = fs.statSync(filePath).size;
        } catch { /* file may be gone */ }

        const activity = await prisma.fileActivity.create({
          data: {
            trackerId,
            fileName,
            fileType,
            action: 'modified',
            fileSize,
          },
        });

        await prisma.fileTracker.update({
          where: { id: trackerId },
          data: { lastActivityAt: new Date() },
        });

        this.emitToUser(tracker.userId, 'file:activity', { trackerId, activity });
      } catch (error: any) {
        logger.error(`Error handling file change event: ${error.message}`);
      }
    });

    // File deleted
    watcher.on('unlink', async (filePath: string) => {
      try {
        const fileName = path.basename(filePath);
        const fileType = path.extname(fileName).slice(1) || 'unknown';

        const activity = await prisma.fileActivity.create({
          data: {
            trackerId,
            fileName,
            fileType,
            action: 'deleted',
            fileSize: 0,
          },
        });

        await prisma.fileTracker.update({
          where: { id: trackerId },
          data: {
            fileCount: { decrement: 1 },
            lastActivityAt: new Date(),
          },
        });

        this.emitToUser(tracker.userId, 'file:activity', { trackerId, activity });
        logger.debug(`File deleted: ${fileName} in tracker ${trackerId}`);
      } catch (error: any) {
        logger.error(`Error handling file delete event: ${error.message}`);
      }
    });

    // Error handling
    watcher.on('error', (error: Error) => {
      logger.error(`File watcher error for tracker ${trackerId}: ${error.message}`);
    });

    this.watchers.set(trackerId, { watcher, trackerId, userId: tracker.userId });

    await prisma.fileTracker.update({
      where: { id: trackerId },
      data: { status: 'active' },
    });

    logger.info(`Started watching: ${tracker.watchPath} (tracker: ${trackerId})`);
  }

  /**
   * Stop watching a directory
   */
  async stopWatching(trackerId: string): Promise<void> {
    const entry = this.watchers.get(trackerId);
    if (entry) {
      await entry.watcher.close();
      this.watchers.delete(trackerId);
    }

    await prisma.fileTracker.update({
      where: { id: trackerId },
      data: { status: 'inactive' },
    }).catch(() => { /* tracker might not exist */ });

    logger.info(`Stopped watching tracker: ${trackerId}`);
  }

  /**
   * Get all trackers for a user
   */
  async getUserTrackers(userId: string): Promise<any[]> {
    return prisma.fileTracker.findMany({
      where: { userId },
      include: {
        _count: {
          select: { activities: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get a single tracker with recent activities
   */
  async getTracker(trackerId: string): Promise<any> {
    const tracker = await prisma.fileTracker.findUnique({
      where: { id: trackerId },
      include: {
        activities: {
          orderBy: { timestamp: 'desc' },
          take: 50,
        },
      },
    });

    if (!tracker) throw new Error('Tracker not found');
    return tracker;
  }

  /**
   * Get activities for a tracker
   */
  async getActivities(trackerId: string, limit: number = 50, offset: number = 0): Promise<any[]> {
    return prisma.fileActivity.findMany({
      where: { trackerId },
      orderBy: { timestamp: 'desc' },
      take: limit,
      skip: offset,
    });
  }

  /**
   * Handle file upload
   */
  async handleUpload(trackerId: string, file: Express.Multer.File): Promise<any> {
    const tracker = await prisma.fileTracker.findUnique({ where: { id: trackerId } });
    if (!tracker) throw new Error('Tracker not found');

    // Move file to the watch directory
    const destPath = path.join(tracker.watchPath, file.originalname);

    // If the file was uploaded via multer, it's already saved
    // We just need to log the activity
    const activity = await prisma.fileActivity.create({
      data: {
        trackerId,
        fileName: file.originalname,
        fileType: path.extname(file.originalname).slice(1) || 'unknown',
        action: 'uploaded',
        fileSize: file.size,
        details: `Uploaded via web interface`,
      },
    });

    await prisma.fileTracker.update({
      where: { id: trackerId },
      data: {
        fileCount: { increment: 1 },
        lastActivityAt: new Date(),
      },
    });

    this.emitToUser(tracker.userId, 'file:activity', { trackerId, activity });

    return activity;
  }

  /**
   * Delete a tracker and stop watching
   */
  async deleteTracker(trackerId: string): Promise<void> {
    await this.stopWatching(trackerId);
    await prisma.fileActivity.deleteMany({ where: { trackerId } });
    await prisma.fileTracker.delete({ where: { id: trackerId } });
  }

  /**
   * Get folder contents for a tracker's watch path
   */
  async getFolderContents(trackerId: string): Promise<any[]> {
    const tracker = await prisma.fileTracker.findUnique({ where: { id: trackerId } });
    if (!tracker) throw new Error('Tracker not found');

    if (!fs.existsSync(tracker.watchPath)) {
      return [];
    }

    const entries = fs.readdirSync(tracker.watchPath, { withFileTypes: true });
    return entries.map(entry => {
      const fullPath = path.join(tracker.watchPath, entry.name);
      let size = 0;
      let modifiedAt = new Date();

      try {
        const stat = fs.statSync(fullPath);
        size = stat.size;
        modifiedAt = stat.mtime;
      } catch { /* ignore */ }

      return {
        name: entry.name,
        type: entry.isDirectory() ? 'directory' : 'file',
        extension: entry.isFile() ? path.extname(entry.name).slice(1) : null,
        size,
        modifiedAt,
      };
    });
  }

  /**
   * Cleanup all watchers (for graceful shutdown)
   */
  async cleanup(): Promise<void> {
    for (const [trackerId] of this.watchers) {
      await this.stopWatching(trackerId);
    }
    logger.info('All file watchers cleaned up');
  }
}

// Singleton instance
export const fileTrackerService = new FileTrackerService();

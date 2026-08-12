import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileTrackerService } from '../services/fileTracker.service';
import { authenticate } from '../middleware/auth';
import { logActivity } from '../services/analytics.service';

const router = Router();
const prisma = new PrismaClient();
const upload = multer({ storage: multer.memoryStorage() });

/**
 * @route   GET /api/file-tracker
 * @desc    Get all trackers for current user
 * @access  Private
 */
router.get('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const trackers = await fileTrackerService.getUserTrackers(userId);
    res.status(200).json(trackers);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/file-tracker
 * @desc    Create a new directory watch tracker
 * @access  Private
 */
router.post('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const { name, description, watchPath } = req.body;

    if (!name || !watchPath) {
      res.status(400).json({ error: 'Name and watchPath are required' });
      return;
    }

    const tracker = await fileTrackerService.create(userId, { name, description, watchPath });
    await logActivity(userId, 'tracker_created', 'tracker', tracker.id, { name, watchPath });
    res.status(201).json(tracker);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/file-tracker/:id
 * @desc    Get a single tracker with recent activities
 * @access  Private
 */
router.get('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const tracker = await fileTrackerService.getTracker(id);

    // Verify ownership
    if (tracker.userId !== req.user!.userId) {
      res.status(403).json({ error: 'Unauthorized access to this tracker' });
      return;
    }

    res.status(200).json(tracker);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/file-tracker/:id/start
 * @desc    Start watching the tracker's folder
 * @access  Private
 */
router.post('/:id/start', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const id = req.params.id as string;

    const tracker = await prisma.fileTracker.findUnique({ where: { id } });
    if (!tracker) {
      res.status(404).json({ error: 'Tracker not found' });
      return;
    }

    if (tracker.userId !== userId) {
      res.status(403).json({ error: 'Unauthorized access to this tracker' });
      return;
    }

    await fileTrackerService.startWatching(id);
    await logActivity(userId, 'tracker_started', 'tracker', id);
    res.status(200).json({ message: 'Folder watching started' });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/file-tracker/:id/stop
 * @desc    Stop watching the tracker's folder
 * @access  Private
 */
router.post('/:id/stop', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const id = req.params.id as string;

    const tracker = await prisma.fileTracker.findUnique({ where: { id } });
    if (!tracker) {
      res.status(404).json({ error: 'Tracker not found' });
      return;
    }

    if (tracker.userId !== userId) {
      res.status(403).json({ error: 'Unauthorized access to this tracker' });
      return;
    }

    await fileTrackerService.stopWatching(id);
    await logActivity(userId, 'tracker_stopped', 'tracker', id);
    res.status(200).json({ message: 'Folder watching stopped' });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/file-tracker/:id/activities
 * @desc    Get paginated activities for a tracker
 * @access  Private
 */
router.get('/:id/activities', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const id = req.params.id as string;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;

    const tracker = await prisma.fileTracker.findUnique({ where: { id } });
    if (!tracker) {
      res.status(404).json({ error: 'Tracker not found' });
      return;
    }

    if (tracker.userId !== userId) {
      res.status(403).json({ error: 'Unauthorized access to this tracker' });
      return;
    }

    const activities = await fileTrackerService.getActivities(id, limit, offset);
    res.status(200).json(activities);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/file-tracker/:id/contents
 * @desc    Get folder contents of watch path
 * @access  Private
 */
router.get('/:id/contents', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const id = req.params.id as string;

    const tracker = await prisma.fileTracker.findUnique({ where: { id } });
    if (!tracker) {
      res.status(404).json({ error: 'Tracker not found' });
      return;
    }

    if (tracker.userId !== userId) {
      res.status(403).json({ error: 'Unauthorized access to this tracker' });
      return;
    }

    const contents = await fileTrackerService.getFolderContents(id);
    res.status(200).json(contents);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/file-tracker/:id/upload
 * @desc    Upload a file directly into the tracked folder
 * @access  Private
 */
router.post('/:id/upload', authenticate, upload.single('file'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const id = req.params.id as string;
    const file = req.file;

    if (!file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const tracker = await prisma.fileTracker.findUnique({ where: { id } });
    if (!tracker) {
      res.status(404).json({ error: 'Tracker not found' });
      return;
    }

    if (tracker.userId !== userId) {
      res.status(403).json({ error: 'Unauthorized access to this tracker' });
      return;
    }

    // Ensure watch path exists
    if (!fs.existsSync(tracker.watchPath)) {
      fs.mkdirSync(tracker.watchPath, { recursive: true });
    }

    // Write file to the tracked folder
    const destPath = path.join(tracker.watchPath, file.originalname);
    fs.writeFileSync(destPath, file.buffer);

    // Call service to log the activity and update DB
    const activity = await fileTrackerService.handleUpload(id, file);
    await logActivity(userId, 'file_uploaded', 'tracker', id, { fileName: file.originalname });

    res.status(200).json(activity);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   DELETE /api/file-tracker/:id
 * @desc    Delete a tracker and stop watching
 * @access  Private
 */
router.delete('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const id = req.params.id as string;

    const tracker = await prisma.fileTracker.findUnique({ where: { id } });
    if (!tracker) {
      res.status(404).json({ error: 'Tracker not found' });
      return;
    }

    if (tracker.userId !== userId) {
      res.status(403).json({ error: 'Unauthorized access to this tracker' });
      return;
    }

    await fileTrackerService.deleteTracker(id);
    await logActivity(userId, 'tracker_deleted', 'tracker', id, { name: tracker.name });
    res.status(200).json({ message: 'Tracker deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;

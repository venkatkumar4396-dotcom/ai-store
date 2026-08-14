import { Router, Request, Response, NextFunction } from 'express';
import { adminService } from '../services/admin.service';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Secure all admin endpoints - requires active login AND admin role
router.use(authenticate, authorize('admin'));

/**
 * @route   GET /api/admin/stats
 * @desc    Get global statistics for dashboard
 */
router.get('/stats', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await adminService.getStats();
    res.status(200).json(stats);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/admin/users
 * @desc    List all registered users
 */
router.get('/users', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await adminService.getUsers();
    res.status(200).json(users);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/admin/users/:id
 * @desc    Update user role (promote/demote)
 */
router.put('/users/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const targetUserId = req.params.id as string;
    const { role } = req.body;
    
    if (!role) {
      res.status(400).json({ error: 'Role is required' });
      return;
    }

    const updated = await adminService.updateUserRole(targetUserId, role);
    res.status(200).json(updated);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/admin/live-feed
 * @desc    Get real-time live activity stream across all users and agents
 */
router.get('/live-feed', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const feed = await adminService.getLiveActivityFeed();
    res.status(200).json(feed);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/admin/users/:id/dossier
 * @desc    Get complete activity dossier and installed bots for a specific user
 */
router.get('/users/:id/dossier', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const targetUserId = req.params.id as string;
    const dossier = await adminService.getUserDossier(targetUserId);
    res.status(200).json(dossier);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/admin/logs
 * @desc    Get platform health logs and agent audit logs
 */
router.get('/logs', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const logs = await adminService.getHealthLogs();
    res.status(200).json(logs);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/admin/db/models
 * @desc    List all database models and field schemas
 */
router.get('/db/models', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const models = await adminService.getDbModels();
    res.status(200).json(models);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/admin/db/models/:modelName
 * @desc    List records for a specific model with pagination/search
 */
router.get('/db/models/:modelName', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const modelName = req.params.modelName as string;
    const page = parseInt(req.query.page as string || '1', 10);
    const limit = parseInt(req.query.limit as string || '20', 10);
    const search = req.query.search as string || '';
    const sortBy = req.query.sortBy as string || '';
    const sortOrder = (req.query.sortOrder as string) === 'desc' ? 'desc' : 'asc';

    const result = await adminService.getDbModelRecords(modelName, { page, limit, search, sortBy, sortOrder });
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/admin/db/models/:modelName
 * @desc    Create a new record in a model
 */
router.post('/db/models/:modelName', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const modelName = req.params.modelName as string;
    const record = await adminService.createDbModelRecord(modelName, req.body);
    res.status(201).json(record);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/admin/db/models/:modelName/:id
 * @desc    Update a record by ID
 */
router.put('/db/models/:modelName/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const modelName = req.params.modelName as string;
    const id = req.params.id as string;
    const updated = await adminService.updateDbModelRecord(modelName, id, req.body);
    res.status(200).json(updated);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   DELETE /api/admin/db/models/:modelName/:id
 * @desc    Delete a record by ID
 */
router.delete('/db/models/:modelName/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const modelName = req.params.modelName as string;
    const id = req.params.id as string;
    const deleted = await adminService.deleteDbModelRecord(modelName, id);
    res.status(200).json({ success: true, deleted });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/admin/db/query
 * @desc    Execute a custom json-based Prisma model query
 */
router.post('/db/query', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await adminService.executeDbQuery(req.body);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

export default router;

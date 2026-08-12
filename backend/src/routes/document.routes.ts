import { Router, Request, Response, NextFunction } from 'express';
import { documentService } from '../services/document.service';
import { authenticate } from '../middleware/auth';
import multer from 'multer';
import { extractTextFromBuffer } from '../utils/fileParser';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

/**
 * @route   POST /api/agents/document/upload
 * @desc    Upload a PDF or TXT file and extract its plain text content
 */
router.post('/upload', authenticate, upload.single('file'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }
    const text = await extractTextFromBuffer(req.file.buffer, req.file.mimetype);
    res.status(200).json({
      fileName: req.file.originalname,
      content: text,
      size: req.file.size
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * @route   POST /api/agents/document/summarize
 * @desc    Summarize text content
 */
router.post('/summarize', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const { fileName, content } = req.body;
    if (!fileName || !content) {
      res.status(400).json({ error: 'fileName and content are required' });
      return;
    }
    const result = await documentService.summarizeDocument(userId, fileName, content);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/agents/document/analyze
 * @desc    Extract key points & actions from text
 */
router.post('/analyze', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const { fileName, content } = req.body;
    if (!fileName || !content) {
      res.status(400).json({ error: 'fileName and content are required' });
      return;
    }
    const result = await documentService.analyzeDocument(userId, fileName, content);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/agents/document/generate-pdf
 * @desc    Generate a PDF file from title & content
 */
router.post('/generate-pdf', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const { title, content } = req.body;
    if (!title || !content) {
      res.status(400).json({ error: 'title and content are required' });
      return;
    }
    const pdfBuffer = await documentService.generatePdfDocument(userId, title, content);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${encodeURIComponent(title)}.pdf`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.status(200).send(pdfBuffer);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/agents/document/history
 * @desc    Get document operation logs
 */
router.get('/history', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const history = await documentService.getHistory(userId);
    res.status(200).json(history);
  } catch (error) {
    next(error);
  }
});

export default router;

import pdfParse from 'pdf-parse';
import logger from './logger';

/**
 * Extracts plain text from a file buffer based on the mime type.
 * Supports PDF and plain text.
 */
export async function extractTextFromBuffer(buffer: Buffer, mimeType: string): Promise<string> {
  if (mimeType === 'application/pdf' || mimeType.includes('pdf')) {
    try {
      const data = await (pdfParse as any)(buffer);
      return data.text || '';
    } catch (error: any) {
      logger.error(`Error parsing PDF buffer: ${error.message}`);
      throw new Error(`Failed to extract text from PDF: ${error.message}`);
    }
  }

  // Fallback / assume plain text
  return buffer.toString('utf8');
}

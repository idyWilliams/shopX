// src/lib/whatsapp.ts

// WhatsApp service layer for Meta API integration
// Note: The actual API calls should be handled by your backend/Supabase Edge Functions
// This is a frontend placeholder that demonstrates the architectural pattern

import type { OperationalAnomaly } from '../db/models/OperationalAnomaly';
import type { DailyAnomalyReport } from '../services/anomalyEngine';

interface WhatsAppOptions {
  apiToken: string;
  phoneNumberId: string;
  businessPhoneNumber: string;
}

export class WhatsAppService {
  private apiToken: string;
  private phoneNumberId: string;
  private businessPhoneNumber: string;
  private baseUrl = 'https://graph.facebook.com/v19.0';

  constructor(options: WhatsAppOptions) {
    this.apiToken = options.apiToken;
    this.phoneNumberId = options.phoneNumberId;
    this.businessPhoneNumber = options.businessPhoneNumber;
  }

  /**
   * Sends a template message via WhatsApp
   * @param templateName - The name of the template to use
   * @param recipient - Recipient phone number in E.164 format
   * @param templateParams - Optional parameters for the template
   */
  async sendTemplateMessage(
    templateName: string,
    recipient: string,
    templateParams?: Record<string, string>
  ): Promise<void> {
    try {
      console.log(`[WhatsApp] Sending template "${templateName}" to ${recipient}`);
      
      // TODO: Replace with actual Meta API call to your backend/Edge Function
      // Example API endpoint (should be server-side, not client-side!):
      // https://graph.facebook.com/v19.0/${this.phoneNumberId}/messages
      
      // For now, simulate a successful send
      await new Promise(resolve => setTimeout(resolve, 800));
      
      console.log('[WhatsApp] Message sent successfully!');
    } catch (error) {
      console.error('[WhatsApp] Error sending template message:', error);
      throw new Error('Failed to send WhatsApp message');
    }
  }

  /**
   * Handles incoming voice notes from WhatsApp
   * @param audioUrl - URL of the audio file from WhatsApp
   */
  async handleVoiceNote(audioUrl: string): Promise<string> {
    try {
      console.log('[WhatsApp] Processing voice note from:', audioUrl);
      
      // TODO: Replace with actual audio processing/transcription call
      // Should forward to your backend for secure processing with OpenAI/Whisper etc.
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Return mock transcription for demo purposes
      return 'Transcribed text from voice note would appear here';
    } catch (error) {
      console.error('[WhatsApp] Error processing voice note:', error);
      throw new Error('Failed to process voice note');
    }
  }

  /**
   * Sends a text message to a customer
   * @param recipient - Recipient phone number
   * @param text - Message text
   */
  async sendTextMessage(recipient: string, text: string): Promise<void> {
    try {
      console.log(`[WhatsApp] Sending text to ${recipient}:`, text);
      
      // TODO: Replace with actual Meta API call (via backend/Edge Function)
      
      await new Promise(resolve => setTimeout(resolve, 600));
    } catch (error) {
      console.error('[WhatsApp] Error sending text message:', error);
      throw error;
    }
  }
}

// Initialize with placeholders
const whatsappService = new WhatsAppService({
  apiToken: process.env.WHATSAPP_API_TOKEN || '',
  phoneNumberId: process.env.WHATSAPP_PHONE_ID || '',
  businessPhoneNumber: '2348001234567',
});

export default whatsappService;

// --- NEW FUNCTIONS FOR SHAREABLE INSIGHTS ---

export const generateShiftSummary = (
  salesData: DailyAnomalyReport,
  anomalies: OperationalAnomaly[]
): string => {
  const formattedSales = `₦${salesData.totalSales.toLocaleString()}`;
  
  const summary = [
    'ShopX Shift Report',
    '',
    `Total Sales: ${formattedSales}`,
    `Shop Health: ${salesData.shopHealth === 'balanced' ? 'Balanced' : 'Unbalanced'}`,
    '',
    'Key Details:',
    `- Anomalies Today: ${anomalies.length}`,
    `- Excessive Voids: ${salesData.excessiveVoids ? 'Yes' : 'No'}`,
    `- Large Cash Discrepancies: ${salesData.cashDiscrepancies.length}`,
    '',
    'View full dashboard: shopx://dashboard',
  ].join('\n');
  
  return summary;
};

export const triggerCriticalAlert = (
  anomaly: OperationalAnomaly,
  deviceName?: string
): string => {
  const alert = [
    'SHOPX CRITICAL SECURITY ALERT',
    '',
    `Type: ${anomaly.anomalyType}`,
    `Severity: ${anomaly.severity}`,
    `Time: ${anomaly.createdAt.toLocaleString()}`,
    '',
    `Details: ${anomaly.payload || 'No additional details available'}`,
    deviceName ? `Device: ${deviceName}` : '',
    '',
    'Please review immediately in the ShopX app!',
    'shopx://anomalies',
  ].filter(Boolean).join('\n');
  
  return alert;
};


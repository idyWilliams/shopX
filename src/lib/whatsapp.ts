import { supabase } from './supabase';
import type { OperationalAnomaly } from '../db/models/OperationalAnomaly';
import type { DailyAnomalyReport } from '../services/anomalyEngine';

export class WhatsAppService {
  /**
   * Sends a template message via WhatsApp Edge Function
   */
  async sendTemplateMessage(
    templateName: string,
    recipient: string,
    templateParams?: Record<string, string>
  ): Promise<void> {
    try {
      console.log(`[WhatsApp] Calling edge function for template "${templateName}" to ${recipient}`);
      
      const { error } = await supabase.functions.invoke('whatsapp-send-template', {
        body: { templateName, recipient, templateParams }
      });
      
      if (error) throw error;
      console.log('[WhatsApp] Template message sent successfully via Edge Function!');
    } catch (error) {
      console.error('[WhatsApp] Error sending template message:', error);
      throw new Error('Failed to send WhatsApp message');
    }
  }

  /**
   * Handles incoming voice notes from WhatsApp Edge Function
   */
  async handleVoiceNote(audioUrl: string): Promise<string> {
    try {
      console.log('[WhatsApp] Processing voice note from:', audioUrl);
      
      const { data, error } = await supabase.functions.invoke('whatsapp-process-audio', {
        body: { audioUrl }
      });
      
      if (error) throw error;
      return data.transcription || 'Transcription unavailable';
    } catch (error) {
      console.error('[WhatsApp] Error processing voice note:', error);
      throw new Error('Failed to process voice note');
    }
  }

  /**
   * Sends a text message to a customer via Edge Function
   */
  async sendTextMessage(recipient: string, text: string): Promise<void> {
    try {
      console.log(`[WhatsApp] Sending text to ${recipient} via Edge Function`);
      
      const { error } = await supabase.functions.invoke('whatsapp-send-text', {
        body: { recipient, text }
      });
      
      if (error) throw error;
    } catch (error) {
      console.error('[WhatsApp] Error sending text message:', error);
      throw error;
    }
  }
}

// Initialize
const whatsappService = new WhatsAppService();
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


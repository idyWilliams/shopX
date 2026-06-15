import * as Sharing from 'expo-sharing';
import * as Linking from 'expo-linking';
import type { DailyAnomalyReport } from '../services/anomalyEngine';

type ReportType = 'CLOSING' | 'ANOMALY' | 'STOCK_LOW';

interface ReportData {
  totalSales?: number;
  digitalSales?: number;
  cashSales?: number;
  anomalies?: number;
  lowStockItems?: string[];
  timestamp?: Date;
}

export const generateShopReport = async (
  reportType: ReportType,
  data: ReportData = {}
): Promise<void> => {
  let reportText = '';
  const timestamp = data.timestamp || new Date();

  switch (reportType) {
    case 'CLOSING':
      reportText = [
        'ShopX Shift Closing Report',
        '',
        `Generated at: ${timestamp.toLocaleString()}`,
        '',
        'Sales Summary:',
        data.totalSales ? `  Total: ₦${data.totalSales.toLocaleString()}` : '',
        data.cashSales ? `  Cash: ₦${data.cashSales.toLocaleString()}` : '',
        data.digitalSales ? `  Digital: ₦${data.digitalSales.toLocaleString()}` : '',
        '',
        'Drawer locked.',
        '',
        'View full details: shopx://shift-report',
      ].filter(Boolean).join('\n');
      break;

    case 'ANOMALY':
      reportText = [
        'SHOPX ANOMALY ALERT',
        '',
        `Time: ${timestamp.toLocaleString()}`,
        '',
        data.anomalies
          ? `Number of anomalies detected: ${data.anomalies}`
          : 'Anomaly detected in shop operations!',
        '',
        'Please review immediately in the ShopX app.',
        'shopx://anomalies',
      ].join('\n');
      break;

    case 'STOCK_LOW':
      reportText = [
        'ShopX Low Stock Alert',
        '',
        `Time: ${timestamp.toLocaleString()}`,
        '',
        'Items running low:',
        ...(data.lowStockItems?.map((item) => `  • ${item}`) || ['  • Check inventory for details']),
        '',
        'Restock soon: shopx://inventory',
      ].join('\n');
      break;
  }

  try {
    await Sharing.shareAsync(reportText);
  } catch (error) {
    console.error('Error sharing report:', error);
    // Fallback: log the report text if sharing fails
    console.log('Report text to share:', reportText);
  }
};

export const contactLeadOnWhatsApp = async (
  contactInfo: string,
  productInterest: string
): Promise<void> => {
  const message = `Hello! I noticed you were interested in ${productInterest}. Would you like to learn more about our products?`;
  const whatsappUrl = `https://wa.me/${contactInfo.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
  
  try {
    await Linking.openURL(whatsappUrl);
  } catch (error) {
    console.error('Error opening WhatsApp:', error);
    await Sharing.shareAsync(message);
  }
};

export default {
  generateShopReport,
  contactLeadOnWhatsApp,
};

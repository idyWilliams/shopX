import FirecrawlApp from '@mendable/firecrawl-js';
import { getDatabase } from '../db';
import { Lead } from '../db/models/Lead';
import { validateApiKeys } from '../lib/config';

const { firecrawlApiKey } = validateApiKeys();
const firecrawl = new FirecrawlApp({ apiKey: firecrawlApiKey });

export interface LeadData {
  merchantId: string;
  productInterest: string;
  contactInfo: string;
}

export const generateLeads = async (
  merchantId: string,
  searchTerms: string[]
): Promise<LeadData[]> => {
  const leads: LeadData[] = [];

  try {
    for (const term of searchTerms) {
      const response = await firecrawl.scrapeUrl(`https://www.google.com/search?q=${encodeURIComponent(term)}`, {
        formats: ['markdown'],
      });

      if (response.markdown) {
        const contactMatches = response.markdown.match(/(?:phone|tel|email|whatsapp):?\s*([^\s\n]+)/gi);
        if (contactMatches) {
          const contact = contactMatches[0].split(':')[1].trim();
          leads.push({
            merchantId,
            productInterest: term,
            contactInfo: contact,
          });
        }
      }
    }
  } catch (error) {
    console.error('Error generating leads:', error);
  }

  return leads;
};

export const saveLeadsToDb = async (leads: LeadData[]): Promise<void> => {
  const db = getDatabase();
  await db.write(async () => {
    for (const leadData of leads) {
      await db.get<Lead>('leads').create(lead => {
        lead.merchantId = leadData.merchantId;
        lead.productInterest = leadData.productInterest;
        lead.contactInfo = leadData.contactInfo;
        lead.status = 'new';
      });
    }
  });
};

export const generateAndSaveLeads = async (
  merchantId: string,
  searchTerms: string[]
): Promise<void> => {
  const leads = await generateLeads(merchantId, searchTerms);
  if (leads.length > 0) {
    await saveLeadsToDb(leads);
  }
};
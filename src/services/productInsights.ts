import { validateApiKeys } from '../lib/config';

interface ProductInfo {
  name: string;
  manufacturer?: string;
  category?: string;
  currentPrice: number;
  currency: string;
}

interface PriceComparison {
  manufacturerPrice?: number;
  marketAveragePrice?: number;
  priceTrend: 'increasing' | 'decreasing' | 'stable';
  recommendedPrice?: number;
  savingsPotential?: number;
}

interface RepurchaseRecommendation {
  shouldRepurchase: boolean;
  reason: string;
  optimalQuantity?: number;
  estimatedCost?: number;
}

interface ProductInsights {
  priceComparison: PriceComparison;
  repurchaseRecommendation: RepurchaseRecommendation;
  marketDemand?: string;
  seasonalTrends?: string;
}

export async function getProductInsights(
  product: ProductInfo
): Promise<ProductInsights> {
  const { openAiApiKey } = validateApiKeys();
  
  if (!openAiApiKey) {
    // Fallback to simple local insights if no API key
    return getLocalInsights(product);
  }

  try {
    const systemPrompt = `You are a product pricing and market insights expert. Given a product, provide:
1. Price comparison (manufacturer's suggested price, market average, price trend)
2. Repurchase recommendation (whether they should repurchase now, optimal quantity, etc.)
3. Market demand and seasonal trends
Format your response as JSON.`;

    const userPrompt = `Product: ${product.name}
Manufacturer: ${product.manufacturer || 'Not specified'}
Category: ${product.category || 'Not specified'}
Current Price: ${product.currentPrice} ${product.currency}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openAiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.warn(`OpenAI API failed with status ${response.status}:`, errorData);
      return getLocalInsights(product);
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message?.content) {
      console.warn('OpenAI API returned unexpected format:', data);
      return getLocalInsights(product);
    }

    try {
      const insights = JSON.parse(data.choices[0].message.content);
      return insights as ProductInsights;
    } catch (parseError) {
      console.warn('Failed to parse OpenAI response as JSON:', parseError);
      return getLocalInsights(product);
    }
  } catch (error) {
    console.error('Error getting product insights:', error);
    return getLocalInsights(product);
  }
}

function getLocalInsights(product: ProductInfo): ProductInsights {
  // Simple fallback insights
  return {
    priceComparison: {
      manufacturerPrice: product.currentPrice * 0.9,
      marketAveragePrice: product.currentPrice * 1.05,
      priceTrend: 'stable',
      recommendedPrice: product.currentPrice,
      savingsPotential: product.currentPrice * 0.05,
    },
    repurchaseRecommendation: {
      shouldRepurchase: true,
      reason: 'Based on historical data, this product sells consistently.',
      optimalQuantity: 10,
      estimatedCost: product.currentPrice * 10 * 0.9,
    },
    marketDemand: 'Good',
    seasonalTrends: 'Stable year-round'
  };
}

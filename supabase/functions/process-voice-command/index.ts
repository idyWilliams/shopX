import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface VoiceCommandResponse {
  action: 'SALE' | 'RESTOCK' | 'TRANSFER';
  productName: string;
  productId?: string;
  quantity: number;
  price?: number;
  confidence: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with service role
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    );

    // Parse request body
    const { audioUri, text } = await req.json();

    let transcription = text;

    // Step 1: Transcribe audio if no text is provided (mock for now)
    if (!transcription && audioUri) {
      console.log('Transcribing audio from URL:', audioUri);
      // TODO: In production, use OpenAI Whisper API here
      transcription = 'Sold 2 rice at 500 each';
    }

    if (!transcription) {
      return new Response(
        JSON.stringify({ error: 'No audio or text provided' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Step 2: Parse transcription for structured data
    const parsedCommand = parseTranscription(transcription);

    // Step 3: Find matching products in database
    const { data: products } = await supabase
      .from('products')
      .select('*')
      .ilike('name', `%${parsedCommand.productName}%`);

    const matchedProduct = products?.[0];

    const response: VoiceCommandResponse = {
      ...parsedCommand,
      productId: matchedProduct?.id,
      price: matchedProduct?.selling_price || parsedCommand.price,
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error processing voice command:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to process voice command' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

// Helper function to parse transcription into structured data
function parseTranscription(text: string): Omit<VoiceCommandResponse, 'productId' | 'price'> {
  let action: 'SALE' | 'RESTOCK' | 'TRANSFER' = 'SALE';
  let quantity = 1;
  let productName = '';
  let confidence = 0.8;

  const lowerText = text.toLowerCase();

  // Determine action
  if (lowerText.includes('sold') || lowerText.includes('sell')) {
    action = 'SALE';
  } else if (lowerText.includes('restock') || lowerText.includes('add stock')) {
    action = 'RESTOCK';
  } else if (lowerText.includes('transfer') || lowerText.includes('move')) {
    action = 'TRANSFER';
  }

  // Extract quantity
  const quantityMatch = text.match(/\d+/);
  if (quantityMatch) {
    quantity = parseInt(quantityMatch[0]);
  }

  // Extract product name - simple heuristic
  const words = text.split(' ');
  const actionWords = ['sold', 'sell', 'restock', 'add', 'stock', 'transfer', 'move', 'at', 'for', 'each', '₦', 'naira', 'kobo', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
  productName = words.filter(word => !actionWords.includes(word.toLowerCase())).join(' ').trim();

  return {
    action,
    quantity,
    productName,
    confidence,
  };
}

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import Anthropic from '@anthropic-ai/sdk';

const app = express();
app.use(cors());
app.use(express.json());

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

interface Offer {
  store: string;
  productName: string;
  description: string;
  price?: string;
}

interface SuggestRequest {
  offers: Offer[];
  mealTypes: string[];
  preferences?: string;
}

app.post('/api/suggest', async (req, res) => {
  const { offers, mealTypes, preferences } = req.body as SuggestRequest;

  if (!offers?.length || !mealTypes?.length) {
    return res.status(400).json({ error: 'offers och mealTypes krävs' });
  }

  const offerList = offers
    .map((o) => `• ${o.productName}${o.price ? ` (${o.price})` : ''} — ${o.store}${o.description ? `: ${o.description}` : ''}`)
    .join('\n');

  const mealLabels: Record<string, string> = {
    frukost: 'frukost',
    lunch: 'lunch',
    middag: 'middag',
    snack: 'snack',
  };

  const selectedMeals = mealTypes.map((m) => mealLabels[m] ?? m).join(', ');

  const prompt = `Du är en svensk nutritionsexpert och kock. Din uppgift är att föreslå hälsosamma maträtter baserade på veckans erbjudanden i svenska butiker.

Veckans erbjudanden:
${offerList}

Planera ${selectedMeals} för en dag.${preferences ? `\nExtra önskemål: ${preferences}` : ''}

Regler:
- Använd MINST ett erbjudandeprodukt per måltid om möjligt
- Alla måltider ska vara hälsosamma och balanserade
- Ange ungefärliga kalorier per portion (kcal)
- Förklara kortfattat varför rätten är hälsosam
- Svara på svenska

Svara i detta JSON-format (och INGET annat):
{
  "suggestions": [
    {
      "mealType": "frukost|lunch|middag|snack",
      "dishName": "Rättens namn",
      "description": "Kort beskrivning",
      "ingredients": ["ingrediens 1", "ingrediens 2"],
      "usedOffers": ["produktnamn från erbjudandena"],
      "calories": 450,
      "protein": 25,
      "carbs": 40,
      "fat": 15,
      "healthNote": "Varför det är hälsosamt"
    }
  ]
}`;

  try {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const stream = await client.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    });

    let fullText = '';

    for await (const chunk of stream) {
      if (
        chunk.type === 'content_block_delta' &&
        chunk.delta.type === 'text_delta'
      ) {
        fullText += chunk.delta.text;
        res.write(`data: ${JSON.stringify({ delta: chunk.delta.text })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ done: true, fullText })}\n\n`);
    res.end();
  } catch (err: unknown) {
    console.error('[/api/suggest]', err);
    const message = err instanceof Error ? err.message : 'Okänt fel';
    if (!res.headersSent) {
      res.status(500).json({ error: message });
    }
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server körs på http://localhost:${PORT}`);
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn('⚠️  ANTHROPIC_API_KEY saknas i .env-filen!');
  }
});

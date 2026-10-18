import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Body parser with 10mb limit for uploaded food packaging photos
app.use(express.json({ limit: '10mb' }));

// Server-side Gemini AI client initialization
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Barcode Lookup Proxy (Open Food Facts v2 API)
app.get('/api/product/:barcode', async (req: Request, res: Response) => {
  const { barcode } = req.params;
  const cleanBarcode = barcode.trim().replace(/\D/g, '');

  if (!cleanBarcode) {
    return res.status(400).json({ error: 'Valid numerical barcode is required' });
  }

  try {
    const offUrl = `https://world.openfoodfacts.org/api/v0/product/${cleanBarcode}.json`;
    const response = await fetch(offUrl, {
      headers: {
        'User-Agent': 'NutriScan - AI Studio Build - Version 1.0 (contact: blueblag123@gmail.com)',
        'Accept': 'application/json',
      },
    });

    if (response.status === 404) {
      return res.json({
        found: false,
        barcode: cleanBarcode,
        message: 'Product barcode not found in supermarket database.',
      });
    }

    if (!response.ok) {
      return res.status(response.status).json({ error: `Open Food Facts error: ${response.statusText}` });
    }

    const data = await response.json();

    if (data.status !== 1 || !data.product) {
      return res.json({
        found: false,
        barcode: cleanBarcode,
        message: 'Product barcode not found in supermarket database.',
      });
    }

    const p = data.product;
    const n = p.nutriments || {};

    // Parse serving size
    let servingGrams = 100;
    if (p.serving_quantity) {
      servingGrams = Number(p.serving_quantity) || 100;
    } else if (p.serving_size) {
      const match = p.serving_size.match(/(\d+(?:\.\d+)?)\s*(?:g|ml)/i);
      if (match) {
        servingGrams = parseFloat(match[1]);
      }
    }

    // Determine calories per 100g
    let calories = n['energy-kcal_100g'];
    if (calories === undefined || calories === null) {
      if (n['energy_100g']) {
        // Convert kJ to kcal
        calories = Math.round(n['energy_100g'] / 4.184);
      } else {
        calories = n['energy-kcal'] || 0;
      }
    }

    const nutriscoreGrade = p.nutriscore_grade ? String(p.nutriscore_grade).toLowerCase() : undefined;
    const novaGroup = p.nova_group ? Number(p.nova_group) : undefined;

    const normalizedProduct = {
      barcode: cleanBarcode,
      name: p.product_name || p.product_name_en || p.generic_name || 'Supermarket Item',
      brand: p.brands || p.brands_tags?.[0] || 'Supermarket Brand',
      imageUrl: p.image_front_url || p.image_url || p.image_front_small_url || '',
      servingSize: p.serving_size || `${servingGrams}g`,
      servingGrams: Math.max(1, Math.round(servingGrams)),
      caloriesPer100g: Math.round(Number(calories) || 0),
      proteinsPer100g: Number((Number(n.proteins_100g ?? n.proteins ?? 0)).toFixed(1)),
      carbsPer100g: Number((Number(n.carbohydrates_100g ?? n.carbohydrates ?? 0)).toFixed(1)),
      fatPer100g: Number((Number(n.fat_100g ?? n.fat ?? 0)).toFixed(1)),
      sugarsPer100g: Number((Number(n.sugars_100g ?? n.sugars ?? 0)).toFixed(1)),
      fiberPer100g: Number((Number(n.fiber_100g ?? n.fiber ?? 0)).toFixed(1)),
      sodiumPer100g: Number((Number(n.sodium_100g !== undefined && n.sodium_100g !== null ? n.sodium_100g : (Number(n.salt_100g || 0) / 2.5))).toFixed(2)),
      saltPer100g: Number((Number(n.salt_100g !== undefined && n.salt_100g !== null ? n.salt_100g : (Number(n.sodium_100g || 0) * 2.5))).toFixed(2)),
      nutriscoreGrade: ['a', 'b', 'c', 'd', 'e'].includes(nutriscoreGrade as string) ? nutriscoreGrade : undefined,
      novaGroup: [1, 2, 3, 4].includes(novaGroup as number) ? novaGroup : undefined,
      ingredientsText: p.ingredients_text || p.ingredients_text_en || '',
      allergens: p.allergens_tags ? p.allergens_tags.map((a: string) => a.replace(/^[a-z]+:/, '')) : [],
      categories: p.categories ? p.categories.split(',').map((c: string) => c.trim()).slice(0, 4) : [],
    };

    return res.json({ found: true, product: normalizedProduct });
  } catch (err: any) {
    console.error('Error querying Open Food Facts:', err);
    return res.status(500).json({ error: 'Failed to query barcode database', details: err.message });
  }
});

// Supermarket Product Name Search Proxy
app.get('/api/search', async (req: Request, res: Response) => {
  const query = req.query.q as string;
  if (!query || query.trim().length < 2) {
    return res.status(400).json({ error: 'Search term must be at least 2 characters' });
  }

  try {
    const searchUrl = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=8`;
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'NutriScan - AI Studio Build - Version 1.0',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Search failed' });
    }

    const data = await response.json();
    const products = (data.products || []).map((p: any) => {
      const n = p.nutriments || {};
      let calories = n['energy-kcal_100g'] ?? (n['energy_100g'] ? Math.round(n['energy_100g'] / 4.184) : 0);
      const nutriscoreGrade = p.nutriscore_grade ? String(p.nutriscore_grade).toLowerCase() : undefined;
      const novaGroup = p.nova_group ? Number(p.nova_group) : undefined;

      return {
        barcode: p.code || p.id || '',
        name: p.product_name || p.product_name_en || 'Supermarket Item',
        brand: p.brands || '',
        imageUrl: p.image_front_small_url || p.image_front_url || '',
        servingSize: p.serving_size || '100g',
        servingGrams: 100,
        caloriesPer100g: Math.round(Number(calories) || 0),
        proteinsPer100g: Number((Number(n.proteins_100g ?? 0)).toFixed(1)),
        carbsPer100g: Number((Number(n.carbohydrates_100g ?? 0)).toFixed(1)),
        fatPer100g: Number((Number(n.fat_100g ?? 0)).toFixed(1)),
        sugarsPer100g: Number((Number(n.sugars_100g ?? 0)).toFixed(1)),
        fiberPer100g: Number((Number(n.fiber_100g ?? 0)).toFixed(1)),
        sodiumPer100g: Number((Number(n.sodium_100g ?? 0)).toFixed(2)),
        saltPer100g: Number((Number(n.salt_100g ?? 0)).toFixed(2)),
        nutriscoreGrade: ['a', 'b', 'c', 'd', 'e'].includes(nutriscoreGrade as string) ? nutriscoreGrade : undefined,
        novaGroup: [1, 2, 3, 4].includes(novaGroup as number) ? novaGroup : undefined,
        ingredientsText: p.ingredients_text || '',
      };
    }).filter((p: any) => p.name && p.barcode);

    return res.json({ products });
  } catch (err: any) {
    console.error('Search error:', err);
    return res.status(500).json({ error: 'Search failed', details: err.message });
  }
});

// AI Label / Packaging Photo Analysis (Gemini 3.8 Flash)
app.post('/api/analyze-label', async (req: Request, res: Response) => {
  const { imageBase64, mimeType = 'image/jpeg', barcodeHint } = req.body;

  if (!imageBase64) {
    return res.status(400).json({ error: 'Image base64 data is required' });
  }

  try {
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');

    const promptText = `You are a certified supermarket food nutrition analyst.
Analyze this photo of a food product packaging, barcode, nutrition facts table, or ingredient label.
${barcodeHint ? `The user also detected barcode: "${barcodeHint}".` : ''}

Extract or accurately estimate:
1. Product name and Brand
2. Serving size in grams (default 100 if unspecified)
3. Nutritional values per 100g:
   - Calories (kcal)
   - Proteins (g)
   - Carbohydrates (g)
   - Fat (g)
   - Sugars (g)
   - Dietary Fiber (g)
   - Sodium (g) and Salt (g)
4. Nutri-Score grade ('a', 'b', 'c', 'd', 'e') using standard European Nutri-Score guidelines:
   - 'a': high fiber, high protein, low calories, fruits/vegetables/nuts, low saturated fats/sugars/salt
   - 'b': balanced healthy foods
   - 'c': moderate balance
   - 'd': high in sugars, saturated fats, or salt
   - 'e': very high in sugar, fat, or salt (e.g. confectionery, chips, soft drinks)
5. NOVA food processing group (1, 2, 3, 4):
   - 1 = Unprocessed or minimally processed foods (fruits, raw grains, plain milk, fresh meat)
   - 2 = Processed culinary ingredients (oils, butter, sugar, salt)
   - 3 = Processed foods (canned vegetables in brine, simple cheeses, freshly baked breads)
   - 4 = Ultra-processed foods (UPF: formulations of ingredients mostly of exclusive industrial use, emulsifiers, modified starches, high fructose corn syrup, artificial flavorings)
6. Brief list of recognized allergens and a short health summary (e.g., "High protein, ultra-processed with added emulsifiers", "Low sugar whole food").

Return only valid JSON matching the schema.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType,
              data: cleanBase64,
            },
          },
          {
            text: promptText,
          },
        ],
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: 'Product name' },
            brand: { type: Type.STRING, description: 'Brand or manufacturer' },
            barcode: { type: Type.STRING, description: 'Detected barcode numbers if visible, or generated temporary code' },
            servingSize: { type: Type.STRING, description: 'e.g. 30g, 1 bottle 250ml' },
            servingGrams: { type: Type.NUMBER, description: 'Serving weight in grams' },
            caloriesPer100g: { type: Type.NUMBER, description: 'Calories (kcal) per 100g' },
            proteinsPer100g: { type: Type.NUMBER, description: 'Proteins in grams per 100g' },
            carbsPer100g: { type: Type.NUMBER, description: 'Carbohydrates in grams per 100g' },
            fatPer100g: { type: Type.NUMBER, description: 'Fat in grams per 100g' },
            sugarsPer100g: { type: Type.NUMBER, description: 'Sugars in grams per 100g' },
            fiberPer100g: { type: Type.NUMBER, description: 'Dietary fiber in grams per 100g' },
            sodiumPer100g: { type: Type.NUMBER, description: 'Sodium in grams per 100g' },
            saltPer100g: { type: Type.NUMBER, description: 'Salt in grams per 100g' },
            nutriscoreGrade: { type: Type.STRING, description: 'a, b, c, d, or e' },
            novaGroup: { type: Type.INTEGER, description: '1, 2, 3, or 4' },
            ingredientsText: { type: Type.STRING, description: 'Extracted ingredient text' },
            allergens: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Identified allergens e.g. milk, gluten, nuts',
            },
            healthSummary: { type: Type.STRING, description: 'Short health analysis note' },
          },
          required: [
            'name',
            'servingGrams',
            'caloriesPer100g',
            'proteinsPer100g',
            'carbsPer100g',
            'fatPer100g',
          ],
        },
      },
    });

    const textOutput = response.text;
    if (!textOutput) {
      throw new Error('No response text returned from AI model');
    }

    const parsed = JSON.parse(textOutput);

    // Format into standard ProductNutrition schema
    const product = {
      barcode: parsed.barcode || barcodeHint || `SNAP-${Date.now().toString().slice(-6)}`,
      name: parsed.name || 'Scanned Supermarket Product',
      brand: parsed.brand || '',
      imageUrl: '', // Will use uploaded image on client
      servingSize: parsed.servingSize || `${parsed.servingGrams || 100}g`,
      servingGrams: Math.max(1, Math.round(Number(parsed.servingGrams) || 100)),
      caloriesPer100g: Math.round(Number(parsed.caloriesPer100g) || 0),
      proteinsPer100g: Number((Number(parsed.proteinsPer100g) || 0).toFixed(1)),
      carbsPer100g: Number((Number(parsed.carbsPer100g) || 0).toFixed(1)),
      fatPer100g: Number((Number(parsed.fatPer100g) || 0).toFixed(1)),
      sugarsPer100g: Number((Number(parsed.sugarsPer100g) || 0).toFixed(1)),
      fiberPer100g: Number((Number(parsed.fiberPer100g) || 0).toFixed(1)),
      sodiumPer100g: Number((Number(parsed.sodiumPer100g) || 0).toFixed(2)),
      saltPer100g: Number((Number(parsed.saltPer100g) || 0).toFixed(2)),
      nutriscoreGrade: ['a', 'b', 'c', 'd', 'e'].includes(parsed.nutriscoreGrade?.toLowerCase())
        ? parsed.nutriscoreGrade.toLowerCase()
        : undefined,
      novaGroup: [1, 2, 3, 4].includes(Number(parsed.novaGroup)) ? Number(parsed.novaGroup) : undefined,
      ingredientsText: parsed.ingredientsText || '',
      allergens: Array.isArray(parsed.allergens) ? parsed.allergens : [],
      healthSummary: parsed.healthSummary || '',
    };

    return res.json({ success: true, product });
  } catch (err: any) {
    console.error('Error analyzing label image with Gemini:', err);
    return res.status(500).json({
      error: 'Failed to analyze food label image',
      details: err.message,
    });
  }
});

// Vite Dev Server / Static Hosting
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve('dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`NutriScan Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

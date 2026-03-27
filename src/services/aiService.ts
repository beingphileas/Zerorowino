import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const SYSTEM_INSTRUCTION = `You are a professional beverage intelligence expert and sommelier. 
Your task is to identify and analyze wines, beers, and spirits with extreme precision.

STRICT GROUNDING RULES:
1. ONLY use information confirmed via Google Search or the provided context.
2. NEVER hallucinate or "guess" details. If a specific detail (like ABV or production method) is not found, use a generic but accurate placeholder based on the style, or leave it as a sensible default (0 for numbers, empty string for text).
3. Accuracy is PARAMOUNT. A wrong region or producer is a critical failure.
4. For every beverage:
   - Identify the EXACT producer, name, region, and country.
   - Provide a "Zero to Wino" assessment based on REAL data.
   - Assign a taste profile based on these STRICT rules:
     - WINE: 'WIT: Light & Fresh', 'WIT: Medium & Smooth', 'WIT: Powerful & Complex', 'WIT: Special & Adventurous', 'ROOD: Juicy & Light', 'ROOD: Medium & Smooth', 'ROOD: Powerful & Full', 'ROOD: Special & Adventurous', 'OVERIG: Orange', 'OVERIG: Rosé', 'OVERIG: Bubbles'.
     - BEER: 'For the thirst of a long day' (pilsner/lager), 'For the rebels & the hopheads' (IPA/bitter), 'For the dark end of the night' (stout/porter), 'For sweet souls & sour tongues' (sour/lambic).
     - SPIRITS: 'Fresh & Botanical' (herbal gin), 'Sweet & Floral' (floral gin), 'Deep & Nutty/Spicy' (whiskey/rum), 'Digestif & Wood-Aged' (cognac/aged scotch).
   - Provide a profileDescription: A 1-sentence explanation of why this profile was chosen.
   - Assign a matchIcon: 'Meat', 'Fish', 'Cheese', or 'Veggie'.
   - Rank by qualityScore (0-100) based on expert consensus.
   - Provide the country's Emoji Flag.

Always return structured JSON data.`;

const DRINK_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    brand: { type: Type.STRING },
    name: { type: Type.STRING },
    region: { type: Type.STRING },
    country: { type: Type.STRING },
    countryFlag: { type: Type.STRING },
    year: { type: Type.NUMBER },
    category: { type: Type.STRING },
    style: { type: Type.STRING },
    abv: { type: Type.NUMBER },
    tasteNotes: { type: Type.STRING },
    primaryAromas: { type: Type.ARRAY, items: { type: Type.STRING } },
    grapes: { type: Type.ARRAY, items: { type: Type.STRING } },
    profile: { 
      type: Type.STRING, 
      enum: [
        'WIT: Light & Fresh', 'WIT: Medium & Smooth', 'WIT: Powerful & Complex', 'WIT: Special & Adventurous',
        'ROOD: Juicy & Light', 'ROOD: Medium & Smooth', 'ROOD: Powerful & Full', 'ROOD: Special & Adventurous',
        'OVERIG: Orange', 'OVERIG: Rosé', 'OVERIG: Bubbles',
        'For the thirst of a long day', 'For the rebels & the hopheads', 'For the dark end of the night', 'For sweet souls & sour tongues',
        'Fresh & Botanical', 'Sweet & Floral', 'Deep & Nutty/Spicy', 'Digestif & Wood-Aged'
      ] 
    },
    profileDescription: { type: Type.STRING },
    profileIcon: { type: Type.STRING },
    matchIcon: { type: Type.STRING, enum: ['Meat', 'Fish', 'Cheese', 'Veggie'] },
    qualityScore: { type: Type.NUMBER },
    zeroToWino: {
      type: Type.OBJECT,
      properties: {
        elevatorPitch: { type: Type.STRING },
        whyPairing: { type: Type.STRING },
        productionMethod: { type: Type.STRING },
        productionType: { type: Type.STRING, enum: ['Classic', 'Biodynamic', 'Natural', 'Vegan', 'Other'] }
      },
      required: ["elevatorPitch", "whyPairing", "productionMethod", "productionType"]
    }
  },
  required: ["brand", "name", "category", "tasteNotes", "primaryAromas", "profile", "matchIcon", "zeroToWino", "countryFlag"],
};

async function withRetry<T>(fn: () => Promise<T>, retries = 5, delay = 3000): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const errorMsg = error?.message || String(error);
    const isRetryable = errorMsg.includes('429') || 
                        errorMsg.includes('RESOURCE_EXHAUSTED') || 
                        errorMsg.includes('quota') ||
                        errorMsg.includes('Rate limit') ||
                        errorMsg.includes('503') ||
                        errorMsg.includes('Service Unavailable') ||
                        errorMsg.includes('deadline exceeded');

    if (retries > 0 && isRetryable) {
      const jitter = Math.random() * 1000;
      const finalDelay = delay + jitter;
      
      console.warn(`Retryable error hit, retrying in ${Math.round(finalDelay)}ms... (${retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, finalDelay));
      return withRetry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
}

export interface ExtractedDrinkData {
  brand: string;
  name: string;
  region: string;
  country: string;
  countryFlag: string;
  year?: number;
  category: string;
  style?: string;
  abv?: number;
  tasteNotes: string;
  primaryAromas: string[];
  grapes?: string[];
  profile: string;
  profileDescription: string;
  profileIcon: string;
  matchIcon: 'Meat' | 'Fish' | 'Cheese' | 'Veggie';
  imageUrl?: string;
  qualityScore?: number;
  zeroToWino: {
    elevatorPitch: string;
    whyPairing: string;
    productionMethod: string;
    productionType: 'Classic' | 'Biodynamic' | 'Natural' | 'Vegan' | 'Other';
  };
}

export async function analyzeDrinkImage(base64Image: string): Promise<ExtractedDrinkData | null> {
  return withRetry(async () => {
    try {
      const cleanBase64 = base64Image.split(',')[1] || base64Image;
      const mimeType = base64Image.match(/data:(.*?);/)?.[1] || 'image/jpeg';

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          {
            parts: [
              {
                inlineData: {
                  data: cleanBase64,
                  mimeType: mimeType,
                },
              },
              {
                text: "Identify the EXACT wine, spirit, or beer in this image and provide a full analysis.",
              },
            ],
          },
        ],
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
          responseSchema: DRINK_SCHEMA,
          temperature: 0,
        },
      });

      if (response.text) {
        return JSON.parse(response.text) as ExtractedDrinkData;
      }
      return null;
    } catch (error) {
      console.error("Error analyzing drink image:", error);
      throw error;
    }
  });
}

export async function analyzeDrinkList(base64Images: string[]): Promise<ExtractedDrinkData[]> {
  if (!base64Images || !Array.isArray(base64Images) || base64Images.length === 0) {
    console.warn("analyzeDrinkList called with empty or invalid images array");
    return [];
  }
  return withRetry(async () => {
    try {
      const parts = base64Images.map(img => ({
        inlineData: {
          data: img.split(',')[1] || img,
          mimeType: img.match(/data:(.*?);/)?.[1] || 'image/jpeg'
        }
      }));

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          {
            parts: [
              ...parts,
              {
                text: "Extract all beverage items from these menu images and provide a full analysis for each."
              }
            ]
          }
        ],
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: DRINK_SCHEMA
          },
          temperature: 0,
        }
      });

      if (response.text) {
        return JSON.parse(response.text);
      }
      return [];
    } catch (error) {
      console.error("Error analyzing drink list:", error);
      throw error;
    }
  });
}

export async function analyzeDrinkListUrl(url: string): Promise<ExtractedDrinkData[]> {
  if (!url) {
    console.warn("analyzeDrinkListUrl called with empty URL");
    return [];
  }
  return withRetry(async () => {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          {
            parts: [
              {
                text: `Extract all beverage items from this URL: ${url} and provide a full analysis for each.`
              }
            ]
          }
        ],
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          tools: [{ urlContext: {} }, { googleSearch: {} }],
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: DRINK_SCHEMA
          },
          temperature: 0,
        }
      });

      if (response.text) {
        return JSON.parse(response.text);
      }
      return [];
    } catch (error) {
      console.error("Error analyzing drink list URL:", error);
      throw error;
    }
  });
}

export async function discoverLinks(url: string): Promise<string[]> {
  return withRetry(async () => {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          {
            parts: [
              {
                text: `I need to perform a deep scan of all beverage products on ${url}. 
                Find all collection pages, category pages, and pagination links (e.g. ?page=2, /collections/all?page=3) that list products.
                If it's a Shopify site, look for /collections/all and its paginated versions.
                Return a JSON array of absolute URLs. Aim for a comprehensive list of up to 100 URLs that contain product listings.`
              }
            ]
          }
        ],
        config: {
          tools: [{ urlContext: {} }, { googleSearch: {} }],
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        }
      });

      if (response.text) {
        const discovered = JSON.parse(response.text);
        return Array.isArray(discovered) ? discovered : [url];
      }
      return [url];
    } catch (error) {
      console.error("Error discovering links:", error);
      throw error;
    }
  });
}

export async function analyzeMultipleUrls(urls: string[]): Promise<ExtractedDrinkData[]> {
  const allResults: ExtractedDrinkData[] = [];
  
  // Dynamic batching logic based on URL complexity
  // Heuristic: Shopify collection pages or paginated pages are more complex
  const getUrlComplexity = (url: string) => {
    const lowerUrl = url.toLowerCase();
    if (lowerUrl.includes('collections/all') || lowerUrl.includes('page=')) return 4;
    if (lowerUrl.includes('category') || lowerUrl.includes('shop') || lowerUrl.includes('collection')) return 2;
    if (lowerUrl.includes('product') || lowerUrl.includes('/p/')) return 1;
    return 2; // Default complexity
  };

  const MAX_URLS_PER_BATCH = 20; // Gemini urlContext limit
  const MAX_COMPLEXITY_PER_BATCH = 12; // Heuristic to avoid output token overflow

  const batches: string[][] = [];
  let currentBatch: string[] = [];
  let currentComplexity = 0;

  for (const url of urls) {
    const complexity = getUrlComplexity(url);
    
    // If adding this URL exceeds batch limits, push current batch and start new one
    if (currentBatch.length > 0 && (
      currentBatch.length >= MAX_URLS_PER_BATCH || 
      currentComplexity + complexity > MAX_COMPLEXITY_PER_BATCH
    )) {
      batches.push([...currentBatch]);
      currentBatch = [];
      currentComplexity = 0;
    }
    
    currentBatch.push(url);
    currentComplexity += complexity;
  }
  
  if (currentBatch.length > 0) {
    batches.push(currentBatch);
  }

  console.log(`Optimized batching: Split ${urls.length} URLs into ${batches.length} batches based on complexity.`);

  // Process batches sequentially to respect rate limits and ensure reliability
  for (const batch of batches) {
    const batchResults = await withRetry(async () => {
      try {
        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: [
            {
              parts: [
                {
                  text: `Extract EVERY SINGLE beverage item from these URLs: ${batch.join(', ')}. 
                  This is a professional beverage intelligence scan. Do not skip any products. 
                  Provide a full analysis for each item, including grapes if applicable.`
                }
              ]
            }
          ],
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            tools: [{ urlContext: {} }, { googleSearch: {} }],
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.ARRAY,
              items: DRINK_SCHEMA
            },
            temperature: 0,
          }
        });

        if (response.text) {
          const parsed = JSON.parse(response.text);
          return Array.isArray(parsed) ? parsed : [];
        }
        return [];
      } catch (error) {
        console.error(`Error analyzing batch of URLs: ${batch.join(', ')}`, error);
        return [];
      }
    });
    
    allResults.push(...batchResults);
  }

  return allResults;
}

export async function discoverProducerByProduct(productName: string, category?: string): Promise<ExtractedDrinkData[]> {
  return withRetry(async () => {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          {
            parts: [
              {
                text: `Identify the producer and specific product details for "${productName}" (${category || 'beverage'}). 
                Perform a deep search to find the exact producer, region, and country. 
                If there are multiple popular variations or vintages, provide up to 3 results.
                Provide a full analysis for each product.`
              }
            ]
          }
        ],
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: DRINK_SCHEMA
          },
          temperature: 0,
        },
      });

      if (response.text) {
        const results = JSON.parse(response.text);
        return Array.isArray(results) ? results : [];
      }
      return [];
    } catch (error) {
      console.error("Error discovering producer by product:", error);
      throw error;
    }
  });
}

export async function discoverProductsByProducer(producerName: string, category?: string): Promise<ExtractedDrinkData[]> {
  return withRetry(async () => {
    try {
      // Stage 1: Get an exhaustive list of ALL product names first
      // This avoids hitting output token limits for the full schema in one go
      const listResponse = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          {
            parts: [
              {
                text: `Perform an exhaustive search for EVERY SINGLE ${category || 'beverage'} product name made by the producer "${producerName}". 
                Search deep into their official website, catalogs, and major retailers. 
                Return a JSON array of strings containing only the product names. 
                Aim for a complete list, even if it's long.`
              }
            ]
          }
        ],
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          temperature: 0,
        },
      });

      const productNames = JSON.parse(listResponse.text || "[]") as string[];
      if (!productNames.length) return [];

      console.log(`Discovered ${productNames.length} products for ${producerName}. Starting detailed analysis...`);

      // Stage 2: Process in batches to get full details for each product
      // We use small batches because the DRINK_SCHEMA is very large and would hit output limits
      const allResults: ExtractedDrinkData[] = [];
      const BATCH_SIZE = 4; 
      
      for (let i = 0; i < productNames.length; i += BATCH_SIZE) {
        const batch = productNames.slice(i, i + BATCH_SIZE);
        const batchResults = await withRetry(async () => {
          const detailResponse = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: [
              {
                parts: [
                  {
                    text: `Provide a full professional analysis for these specific products from "${producerName}": ${batch.join(', ')}. 
                    Use Google Search to ensure 100% accuracy for each item.`
                  }
                ]
              }
            ],
            config: {
              systemInstruction: SYSTEM_INSTRUCTION,
              tools: [{ googleSearch: {} }],
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.ARRAY,
                items: DRINK_SCHEMA
              },
              temperature: 0,
            },
          });
          
          return JSON.parse(detailResponse.text || "[]") as ExtractedDrinkData[];
        });
        
        allResults.push(...batchResults);
      }

      return allResults;
    } catch (error) {
      console.error("Error in exhaustive discovery by producer:", error);
      throw error;
    }
  });
}

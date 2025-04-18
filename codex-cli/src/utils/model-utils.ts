import { DEEPSEEK_API_KEY, DEEPSEEK_API_URL } from "./config";
import OpenAI from "openai";

const MODEL_LIST_TIMEOUT_MS = 2_000; // 2 seconds
export const RECOMMENDED_MODELS: Array<string> = ["deepseek-chat", "deepseek-reasoner"];

/**
 * Maps OpenAI model names to their DeepSeek equivalents
 * @param openaiModel Original OpenAI model name
 * @returns Corresponding DeepSeek model name
 */
export function mapToDeepSeekModel(openaiModel: string): string {
  const modelMap: Record<string, string> = {
    "o4-mini": "deepseek-chat",
    "o3": "deepseek-chat",
    "gpt-4": "deepseek-chat",
    "gpt-4.1": "deepseek-chat",
    "gpt-4o": "deepseek-reasoner",
    "deepseek-coder": "deepseek-chat"
  };
  return modelMap[openaiModel] || openaiModel;
}

/**
 * Background model loader / cache.
 *
 * We start fetching the list of available models from DeepSeek once the CLI
 * enters interactive mode.  The request is made exactly once during the
 * lifetime of the process and the results are cached for subsequent calls.
 */

let modelsPromise: Promise<Array<string>> | null = null;

async function fetchModels(): Promise<Array<string>> {
  // If the user has not configured an API key we cannot hit the network.
  if (!DEEPSEEK_API_KEY) {
    return RECOMMENDED_MODELS;
  }

  try {
    const openai = new OpenAI({ 
      apiKey: DEEPSEEK_API_KEY,
      baseURL: DEEPSEEK_API_URL
    });
    const list = await openai.models.list();

    const models: Array<string> = [];
    for await (const model of list as AsyncIterable<{ id?: string }>) {
      if (model && typeof model.id === "string") {
        models.push(model.id);
      }
    }

    // If DeepSeek API doesn't return models or we hit any issues, 
    // return the default recommended models
    return models.length > 0 ? models.sort() : RECOMMENDED_MODELS;
  } catch (error) {
    console.warn("Failed to fetch models from DeepSeek API:", error);
    return RECOMMENDED_MODELS;
  }
}

export function preloadModels(): void {
  if (!modelsPromise) {
    // Fire‑and‑forget – callers that truly need the list should `await`
    // `getAvailableModels()` instead.
    void getAvailableModels();
  }
}

export async function getAvailableModels(): Promise<Array<string>> {
  if (!modelsPromise) {
    modelsPromise = fetchModels();
  }
  return modelsPromise;
}

/**
 * Verify that the provided model identifier is present in the set returned by
 * {@link getAvailableModels}. The list of models is fetched from the DeepSeek
 * `/models` endpoint the first time it is required and then cached in‑process.
 * 
 * Also transparently maps OpenAI model names to DeepSeek equivalents.
 */
export async function isModelSupportedForResponses(
  model: string | undefined | null,
): Promise<boolean> {
  if (
    typeof model !== "string" ||
    model.trim() === ""
  ) {
    return true;
  }

  // Map OpenAI model names to DeepSeek equivalents
  const mappedModel = mapToDeepSeekModel(model);
  
  // Always allow recommended models
  if (RECOMMENDED_MODELS.includes(mappedModel)) {
    return true;
  }

  try {
    const models = await Promise.race<Array<string>>([
      getAvailableModels(),
      new Promise<Array<string>>((resolve) =>
        setTimeout(() => resolve([]), MODEL_LIST_TIMEOUT_MS),
      ),
    ]);

    // If the timeout fired we get an empty list → treat as supported to avoid
    // false negatives.
    if (models.length === 0) {
      return true;
    }

    return models.includes(mappedModel);
  } catch {
    // Network or library failure → don't block start‑up.
    return true;
  }
}

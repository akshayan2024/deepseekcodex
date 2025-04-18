import type {
  ExecInput,
  ExecOutputMetadata,
} from "./agent/sandbox/interface.js";
import type { ResponseFunctionToolCall } from "openai/resources/responses/responses.mjs";

import { log } from "node:console";
import { formatCommandForDisplay } from "src/format-command.js";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { DebugLogger } from "./debug-logger.js";

// The console utility import is intentionally explicit to avoid bundlers from
// including the entire `console` module when only the `log` function is
// required.

// Helper function to write detailed logs to a file
async function writeErrorLog(errorData: Record<string, any>): Promise<void> {
  try {
    // Create logs directory if it doesn't exist
    const logsDir = path.join(process.cwd(), 'logs');
    await fs.mkdir(logsDir, { recursive: true });
    
    // Create a timestamped log file
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const logFile = path.join(logsDir, `json-parse-error-${timestamp}.log`);
    
    // Format the error data
    const logContent = JSON.stringify(errorData, null, 2);
    
    // Write to the log file
    await fs.writeFile(logFile, logContent, 'utf8');
    
    log(`Error details written to ${logFile}`);
  } catch (err) {
    log(`Failed to write error log: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
}

export function parseToolCallOutput(toolCallOutput: string): {
  output: string;
  metadata: ExecOutputMetadata;
} {
  try {
    // Add debug logging to help diagnose parsing issues
    if (process.env["DEBUG"]) {
      log(`Attempting to parse tool call output: ${toolCallOutput}`);
    }
    
    // Try standard parsing first
    try {
      const { output, metadata } = JSON.parse(toolCallOutput);
      // Log successful parse
      DebugLogger.logJsonParseAttempt(toolCallOutput, true);
      return { output, metadata };
    } catch (parseErr) {
      // Log initial parse failure
      DebugLogger.logJsonParseAttempt(toolCallOutput, false, parseErr as Error);
      
      // If standard parsing fails, attempt recovery for truncated JSON
      if (toolCallOutput.length > 0) {
        log(`Standard JSON parsing failed, attempting recovery...`);
        
        // Try to find the last valid JSON object
        const lastOpenBrace = toolCallOutput.lastIndexOf('{');
        const lastCloseBrace = toolCallOutput.lastIndexOf('}');
        
        // Check if we might have a truncated JSON (open brace exists but no matching close brace)
        if (lastOpenBrace !== -1 && (lastCloseBrace === -1 || lastCloseBrace < lastOpenBrace)) {
          log(`Detected potentially truncated JSON without closing brace`);
          
          // Add a closing brace to attempt to recover
          const fixedJson = toolCallOutput + '}';
          try {
            const { output, metadata } = JSON.parse(fixedJson);
            log(`Successfully recovered JSON by adding closing brace`);
            DebugLogger.logJsonParseAttempt(fixedJson, true);
            return {
              output: output + "\n[Note: Response was truncated and automatically fixed]",
              metadata
            };
          } catch (fixErr) {
            log(`Recovery attempt by adding closing brace failed`);
            DebugLogger.logJsonParseAttempt(fixedJson, false, fixErr as Error);
          }
        }
        
        // Try to extract the last complete JSON object
        if (lastOpenBrace !== -1 && lastCloseBrace !== -1 && lastCloseBrace > lastOpenBrace) {
          log(`Attempting to extract complete JSON object from truncated response`);
          
          // Find the outermost valid JSON object
          let start = 0;
          for (let i = 0; i <= lastOpenBrace; i++) {
            if (toolCallOutput[i] === '{') {
              // Check if this open brace has a matching close brace
              let openCount = 1;
              for (let j = i + 1; j < toolCallOutput.length; j++) {
                if (toolCallOutput[j] === '{') openCount++;
                if (toolCallOutput[j] === '}') openCount--;
                if (openCount === 0) {
                  // This is a valid JSON object, update the start position
                  start = i;
                  break;
                }
              }
            }
          }
          
          // Extract what might be the last valid JSON object
          const possibleJson = toolCallOutput.substring(start, lastCloseBrace + 1);
          
          try {
            const parsedObj = JSON.parse(possibleJson);
            DebugLogger.logJsonParseAttempt(possibleJson, true);
            
            // Check if it has the expected structure
            if (typeof parsedObj === 'object' && parsedObj !== null &&
                'output' in parsedObj && 'metadata' in parsedObj) {
              log(`Successfully extracted valid JSON object from truncated response`);
              return {
                output: parsedObj.output + "\n[Note: Response was truncated but a valid portion was recovered]",
                metadata: parsedObj.metadata
              };
            }
          } catch (extractErr) {
            log(`Failed to extract valid JSON object: ${extractErr instanceof Error ? extractErr.message : 'Unknown error'}`);
            DebugLogger.logJsonParseAttempt(possibleJson, false, extractErr as Error);
          }
        }
      }
      
      // If all recovery attempts failed, throw the original error to go to the main catch block
      throw parseErr;
    }
  } catch (err) {
    // Create a detailed error report
    const errorInfo = {
      timestamp: new Date().toISOString(),
      error: err instanceof Error ? {
        name: err.name,
        message: err.message,
        stack: err.stack
      } : String(err),
      rawOutput: toolCallOutput,
      outputLength: toolCallOutput.length,
      // Add additional context
      outputStart: toolCallOutput.substring(0, 500),
      outputEnd: toolCallOutput.length > 500 ? toolCallOutput.substring(toolCallOutput.length - 500) : '',
      hasBraces: {
        openBrace: toolCallOutput.indexOf('{'),
        closeBrace: toolCallOutput.lastIndexOf('}')
      },
      possibleTruncation: toolCallOutput.length > 0 && 
                         !toolCallOutput.endsWith('}') &&
                         toolCallOutput.includes('{')
    };
    
    // Log errors to console
    log(`JSON parse error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    log(`Raw output length: ${toolCallOutput.length} characters`);
    if (errorInfo.possibleTruncation) {
      log(`Possible truncation detected: JSON starts but doesn't properly end`);
    }
    
    // Write detailed log to file
    void writeErrorLog(errorInfo);
    
    // Return user-friendly error message
    const errorMessage = errorInfo.possibleTruncation
      ? "Response appears to be truncated due to token limits. Try a smaller command output or check logs for details."
      : "Failed to parse JSON result. Check logs for details.";
    
    return {
      output: errorMessage,
      metadata: {
        exit_code: 1,
        duration_seconds: 0,
      },
    };
  }
}

export type CommandReviewDetails = {
  cmd: Array<string>;
  cmdReadableText: string;
};

/**
 * Tries to parse a tool call and, if successful, returns an object that has
 * both:
 * - an array of strings to use with `ExecInput` and `canAutoApprove()`
 * - a human-readable string to display to the user
 */
export function parseToolCall(
  toolCall: ResponseFunctionToolCall,
): CommandReviewDetails | undefined {
  const toolCallArgs = parseToolCallArguments(toolCall.arguments);
  if (toolCallArgs == null) {
    return undefined;
  }

  const { cmd } = toolCallArgs;
  const cmdReadableText = formatCommandForDisplay(cmd);

  return {
    cmd,
    cmdReadableText,
  };
}

/**
 * If toolCallArguments is a string of JSON that can be parsed into an object
 * with a "cmd" or "command" property that is an `Array<string>`, then returns
 * that array. Otherwise, returns undefined.
 */
export function parseToolCallArguments(
  toolCallArguments: string,
): ExecInput | undefined {
  let json: unknown;
  try {
    json = JSON.parse(toolCallArguments);
  } catch (err) {
    log(`Failed to parse toolCall.arguments: ${toolCallArguments}`);
    return undefined;
  }

  if (typeof json !== "object" || json == null) {
    return undefined;
  }

  const { cmd, command } = json as Record<string, unknown>;
  const commandArray = toStringArray(cmd) ?? toStringArray(command);
  if (commandArray == null) {
    return undefined;
  }

  // @ts-expect-error timeout and workdir may not exist on json.
  const { timeout, workdir } = json;
  return {
    cmd: commandArray,
    workdir: typeof workdir === "string" ? workdir : undefined,
    timeoutInMillis: typeof timeout === "number" ? timeout : undefined,
  };
}

function toStringArray(obj: unknown): Array<string> | undefined {
  if (Array.isArray(obj) && obj.every((item) => typeof item === "string")) {
    const arrayOfStrings: Array<string> = obj;
    return arrayOfStrings;
  } else {
    return undefined;
  }
}

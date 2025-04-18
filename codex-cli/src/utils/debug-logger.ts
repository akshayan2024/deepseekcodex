import { log } from "node:console";
import * as fs from "node:fs/promises";
import * as path from "node:path";

/**
 * Utility class for enhanced debug logging
 */
export class DebugLogger {
  private static readonly LOG_DIR = "debug-logs";
  
  /**
   * Log information about command execution
   */
  public static logCommandExecution(command: string[], output: string, exitCode: number, duration: number): void {
    if (!process.env["DEBUG"]) return;
    
    const logData = {
      timestamp: new Date().toISOString(),
      command: command.join(' '),
      outputLength: output.length,
      exitCode,
      duration,
      outputPreview: output.length > 1000 
        ? { 
            start: output.substring(0, 500),
            end: output.substring(output.length - 500)
          }
        : output
    };
    
    log(`[DEBUG] Command executed: ${command.join(' ')}`);
    log(`[DEBUG] Exit code: ${exitCode}, Duration: ${duration}s, Output length: ${output.length} chars`);
    
    // Write full output to log file
    void this.writeToLogFile("command-output", logData);
  }
  
  /**
   * Log information about JSON parsing attempts
   */
  public static logJsonParseAttempt(jsonString: string, success: boolean, error?: Error): void {
    if (!process.env["DEBUG"]) return;
    
    const logData = {
      timestamp: new Date().toISOString(),
      success,
      jsonLength: jsonString.length,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : undefined,
      jsonSample: jsonString.length > 1000
        ? {
            start: jsonString.substring(0, 500),
            end: jsonString.substring(jsonString.length - 500)
          }
        : jsonString,
      structureAnalysis: {
        openBraces: (jsonString.match(/{/g) || []).length,
        closeBraces: (jsonString.match(/}/g) || []).length,
        openBrackets: (jsonString.match(/\[/g) || []).length,
        closeBrackets: (jsonString.match(/\]/g) || []).length,
        quotes: (jsonString.match(/"/g) || []).length
      }
    };
    
    log(`[DEBUG] JSON parse ${success ? 'succeeded' : 'failed'}`);
    log(`[DEBUG] JSON length: ${jsonString.length} chars`);
    if (!success && error) {
      log(`[DEBUG] Parse error: ${error.message}`);
    }
    log(`[DEBUG] Structure analysis: ${JSON.stringify(logData.structureAnalysis)}`);
    
    // Write full JSON data to log file
    void this.writeToLogFile(
      success ? "json-parse-success" : "json-parse-error", 
      logData
    );
    
    // If parsing failed, also write the raw content to a file for inspection
    if (!success) {
      void this.writeRawContent("failed-json-raw", jsonString);
    }
  }
  
  /**
   * Analyze tool call output for potential JSON issues
   */
  public static analyzeToolCallOutput(functionName: string, argsString: string, output: string): void {
    if (!process.env["DEBUG"]) return;
    
    const logData = {
      timestamp: new Date().toISOString(),
      functionName,
      argumentsLength: argsString.length,
      outputLength: output.length,
      potential_issues: [] as string[],
      size_analysis: {
        arguments: this.getSizeInfo(argsString),
        output: this.getSizeInfo(output)
      }
    };
    
    // Add potential issues
    if (output.length > 100000) {
      logData.potential_issues.push("Output exceeds 100KB - may hit API token limits");
    }
    
    if (output.indexOf('{') !== -1 && output.lastIndexOf('}') < output.lastIndexOf('{')) {
      logData.potential_issues.push("JSON appears to be truncated - missing closing braces");
    }
    
    const braceCount = (output.match(/{/g) || []).length;
    const closeBraceCount = (output.match(/}/g) || []).length;
    
    if (braceCount !== closeBraceCount) {
      logData.potential_issues.push(`Unbalanced JSON structure: ${braceCount} open braces vs ${closeBraceCount} close braces`);
    }
    
    // Check for control characters that might corrupt JSON
    const controlChars = output.match(/[\x00-\x1F\x7F-\x9F]/g);
    if (controlChars && controlChars.length > 0) {
      logData.potential_issues.push(`Contains ${controlChars.length} control characters that may corrupt JSON`);
    }
    
    // Log findings
    log(`[DEBUG] Tool call analysis for ${functionName}:`);
    log(`[DEBUG] Arguments: ${argsString.length} chars, Output: ${output.length} chars`);
    
    if (logData.potential_issues.length > 0) {
      log(`[DEBUG] Potential issues detected:`);
      logData.potential_issues.forEach(issue => log(`[DEBUG] - ${issue}`));
    }
    
    // Save detailed analysis
    void this.writeToLogFile("tool-call-analysis", logData);
    
    // If potential issues were found, also save the raw content
    if (logData.potential_issues.length > 0) {
      void this.writeRawContent("problematic-tool-output", output);
    }
  }
  
  /**
   * Get size information for a string
   */
  private static getSizeInfo(str: string): {bytes: number, kb: number, tokens: number} {
    const bytes = new TextEncoder().encode(str).length;
    // Rough estimate: 1 token ≈ 4 characters for English text
    const estimatedTokens = Math.ceil(str.length / 4);
    
    return {
      bytes,
      kb: Math.round(bytes / 1024 * 100) / 100,
      tokens: estimatedTokens
    };
  }
  
  /**
   * Write log data to a file
   */
  private static async writeToLogFile(prefix: string, data: any): Promise<void> {
    try {
      const logsDir = path.join(process.cwd(), this.LOG_DIR);
      await fs.mkdir(logsDir, { recursive: true });
      
      const timestamp = new Date().toISOString().replace(/:/g, '-');
      const logFile = path.join(logsDir, `${prefix}-${timestamp}.json`);
      
      await fs.writeFile(logFile, JSON.stringify(data, null, 2), 'utf8');
      
      log(`[DEBUG] Log written to ${logFile}`);
    } catch (err) {
      log(`[DEBUG] Failed to write log: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  
  /**
   * Write raw content to a file for inspection
   */
  private static async writeRawContent(prefix: string, content: string): Promise<void> {
    try {
      const logsDir = path.join(process.cwd(), this.LOG_DIR);
      await fs.mkdir(logsDir, { recursive: true });
      
      const timestamp = new Date().toISOString().replace(/:/g, '-');
      const rawFile = path.join(logsDir, `${prefix}-${timestamp}.txt`);
      
      await fs.writeFile(rawFile, content, 'utf8');
      
      log(`[DEBUG] Raw content written to ${rawFile}`);
    } catch (err) {
      log(`[DEBUG] Failed to write raw content: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
} 
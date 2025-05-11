// File: lib.ts

import fs from "fs";
import path from "path";
import yaml from "js-yaml";
import OpenAI from "openai";

export interface Config {
  srcDir?: string;
  extensions?: string[];
  styleGuides?: string[];
  customInstructions?: string;
}

export function loadConfig(configPath: string = ".stylebot.yml"): Config {
  try {
    const fileContents = fs.readFileSync(configPath, "utf8");
    return yaml.load(fileContents) as Config;
  } catch (e: unknown) {
    throw new Error("Failed to load config");
  }
}

export function getSourceFiles(dir: string, extensions: string[]): string[] {
  let results: string[] = [];
  fs.readdirSync(dir).forEach((file) => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      results = results.concat(getSourceFiles(fullPath, extensions));
    } else if (extensions.includes(path.extname(fullPath))) {
      results.push(fullPath);
    }
  });
  return results;
}

export function pickRandomFile(files: string[]): string {
  return files[Math.floor(Math.random() * files.length)];
}

export function initOpenAI(): OpenAI {
  const apiKey = process.env["OPENAI_API_KEY"];
  if (!apiKey) throw new Error("OPENAI_API_KEY environment variable not set.");
  return new OpenAI({ apiKey });
}

export async function reviewCode(
  openai: OpenAI,
  filePath: string,
  code: string,
  config: Config
): Promise<string | null> {
  const prompt = `
You are a code reviewer bot named TidyBot. Analyze the following code and rewrite it to follow these style guides:
${config.styleGuides?.map((g) => `- ${g}`).join("\n") || 'N/A'}

Also apply the following custom instructions:
${config.customInstructions?.trim() || 'N/A'}

Make sure you do not change the functionality of the code. If you find any issues, please point them out and suggest improvements via comments in the code. Do not alter the external APIs or imports.

File path: ${filePath}

\u0060\u0060\u0060${path.extname(filePath).slice(1)}
${code}
\u0060\u0060\u0060
  `;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: "You are a helpful and meticulous coding assistant." },
      { role: "user", content: prompt },
    ],
    temperature: 0.2,
  });

  return response.choices[0].message.content;
}

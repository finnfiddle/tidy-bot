import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import {
  loadConfig,
  getSourceFiles,
  pickRandomFile,
  initOpenAI,
  reviewCode,
  Config,
} from "./lib";

function git(cmd: string): void {
  execSync(cmd, { stdio: "inherit" });
}

const run = async (): Promise<void> => {
  const config: Config = loadConfig();
  const openai = initOpenAI();

  const extensions: string[] = config.extensions || [".js", ".ts"];
  const files: string[] = getSourceFiles(config.srcDir || './src', extensions);

  if (files.length === 0) {
    console.log("❌ No matching files found in", config.srcDir);
    process.exit(1);
  }

  const fileToReview = pickRandomFile(files);
  const originalCode = fs.readFileSync(fileToReview, "utf-8");

  console.log(`\n📂 Reviewing file: ${fileToReview}`);

  const reviewedContent = await reviewCode(openai, fileToReview, originalCode, config);

  const branchName = `tidybot/${path.basename(fileToReview)}-${Date.now()}`;

  git(`git checkout -b ${branchName}`);
  if (reviewedContent) {
    fs.writeFileSync(fileToReview, reviewedContent.trim());
    git(`git config user.name "tidybot"`);
    git(`git config user.email "tidybot@users.noreply.github.com"`);
    git(`git add ${fileToReview}`);
    git(`git commit -m "style: tidybot review for ${path.basename(fileToReview)}"`);
    git(`git push origin ${branchName}`);
    git(`gh pr create --title "TidyBot Review: ${path.basename(fileToReview)}" --body "Automated refactor and style cleanup by TidyBot." --base main`);
  }
  
  return;
};

run();

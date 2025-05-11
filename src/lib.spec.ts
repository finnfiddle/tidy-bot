import * as fs from "fs";
// import * as path from "path";
import OpenAI from "openai";
import {
  loadConfig,
  getSourceFiles,
  pickRandomFile,
  initOpenAI,
  reviewCode,
} from "./lib";

jest.mock("openai");

describe("TidyBot Core Functions", () => {
  describe("loadConfig", () => {
    it("loads valid YAML config", () => {
      fs.writeFileSync(".stylebot.yml", "srcDir: ./src\nextensions: ['.js']");
      const config = loadConfig(".stylebot.yml");
      expect(config.srcDir).toBe("./src");
    });

    it("throws on invalid YAML", () => {
      fs.writeFileSync(".stylebot.yml", "{ this: is: bad yaml }");
      expect(() => loadConfig(".stylebot.yml")).toThrow("Failed to load config");
    });
  });

  describe("getSourceFiles", () => {
    it("returns JS files in directory tree", () => {
      const dir = "__test_src__";
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(`${dir}/file1.js`, "console.log('hi');");
      const files = getSourceFiles(dir, [".js"]);
      expect(files.length).toBe(1);
      fs.rmSync(dir, { recursive: true });
    });
  });

  describe("pickRandomFile", () => {
    it("returns a random file from array", () => {
      const files = ["a.js", "b.js", "c.js"];
      const file = pickRandomFile(files);
      expect(files).toContain(file);
    });
  });

  describe("initOpenAI", () => {
    it("throws if API key not set", () => {
      delete process.env.OPENAI_API_KEY;
      expect(() => initOpenAI()).toThrow("OPENAI_API_KEY");
    });

    it("returns OpenAI client", () => {
      process.env.OPENAI_API_KEY = "fake-key";
      const client = initOpenAI();
      expect(client).toBeInstanceOf(OpenAI);
    });
  });

  describe("reviewCode", () => {
    it("calls OpenAI API with prompt", async () => {
      const fakeClient = {
        chat: {
          completions: {
            create: jest.fn().mockResolvedValue({
              choices: [{ message: { content: "Tidy output" } }],
            }),
          },
        },
      } as unknown as OpenAI;
      const config = {
        styleGuides: ["Airbnb"],
        customInstructions: "Be consistent.",
      };
      const result = await reviewCode(fakeClient, "test.js", "console.log()", config);
      expect(result).toBe("Tidy output");
    });
  });
});

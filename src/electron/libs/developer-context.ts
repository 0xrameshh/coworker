/**
 * Developer Context System
 *
 * This module handles:
 * 1. Loading project-specific .coworker/config.yaml
 * 2. Auto-detecting docs folders
 * 3. Building system prompt injections for methodology/standards
 * 4. Managing developer preferences across sessions
 */

import * as fs from "fs";
import * as path from "path";
import * as yaml from "js-yaml";

// Types for Developer Context Configuration
export interface DeveloperMethodology {
  maxFileLines: number;
  testAfterEdit: boolean;
  cleanFolderStructure: boolean;
  customRules: string[];
}

export interface DocRepository {
  name: string;
  url: string;
  branch: string;
  sparsePaths: string[]; // Only clone these paths (e.g., ["docs/", "README.md"])
  status: "pending" | "cloning" | "ready" | "error";
  lastUpdated?: number;
  error?: string;
}

export interface DocsContext {
  docsPath: string;
  useContext7: boolean;
  indexedFiles: string[];
  packages: string[]; // npm packages to look up via Context7
  repositories: DocRepository[]; // Repos to auto-clone for reference
}

export interface ProjectContext {
  techStack: string[];
  importantFiles: string[];
  filePatterns: string[];
}

export interface DeveloperProfile {
  name: string;
  methodology: DeveloperMethodology;
  docs: DocsContext;
  project: ProjectContext;
  aiInstructions: string;
  customSystemPrompt: string;
}

export interface CoworkerConfig {
  version: string;
  profile: DeveloperProfile;
}

// Default configuration
const DEFAULT_METHODOLOGY: DeveloperMethodology = {
  maxFileLines: 350,
  testAfterEdit: true,
  cleanFolderStructure: true,
  customRules: [],
};

const DEFAULT_DOCS: DocsContext = {
  docsPath: "./docs",
  useContext7: true,
  indexedFiles: [],
  packages: [],
  repositories: [],
};

const DEFAULT_PROJECT: ProjectContext = {
  techStack: [],
  importantFiles: ["README.md", "package.json", "tsconfig.json", ".env.example"],
  filePatterns: ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx"],
};

const DEFAULT_PROFILE: DeveloperProfile = {
  name: "Developer",
  methodology: DEFAULT_METHODOLOGY,
  docs: DEFAULT_DOCS,
  project: DEFAULT_PROJECT,
  aiInstructions: "",
  customSystemPrompt: "",
};

const DEFAULT_CONFIG: CoworkerConfig = {
  version: "1.0",
  profile: DEFAULT_PROFILE,
};

/**
 * Load .coworker/config.yaml from project directory
 */
export function loadProjectConfig(projectPath: string): CoworkerConfig {
  const configPath = path.join(projectPath, ".coworker", "config.yaml");

  if (!fs.existsSync(configPath)) {
    return DEFAULT_CONFIG;
  }

  try {
    const content = fs.readFileSync(configPath, "utf-8");
    const parsed = yaml.load(content) as Partial<CoworkerConfig>;

    // Deep merge with defaults
    return {
      version: parsed.version || DEFAULT_CONFIG.version,
      profile: {
        ...DEFAULT_PROFILE,
        ...parsed.profile,
        methodology: {
          ...DEFAULT_METHODOLOGY,
          ...parsed.profile?.methodology,
        },
        docs: {
          ...DEFAULT_DOCS,
          ...parsed.profile?.docs,
        },
        project: {
          ...DEFAULT_PROJECT,
          ...parsed.profile?.project,
        },
      },
    };
  } catch (error) {
    console.error("Failed to load .coworker/config.yaml:", error);
    return DEFAULT_CONFIG;
  }
}

/**
 * Save configuration to .coworker/config.yaml
 */
export function saveProjectConfig(projectPath: string, config: CoworkerConfig): void {
  const coworkerDir = path.join(projectPath, ".coworker");
  const configPath = path.join(coworkerDir, "config.yaml");

  // Ensure .coworker directory exists
  if (!fs.existsSync(coworkerDir)) {
    fs.mkdirSync(coworkerDir, { recursive: true });
  }

  const yamlContent = yaml.dump(config, {
    indent: 2,
    lineWidth: 120,
    noRefs: true,
  });

  fs.writeFileSync(configPath, yamlContent, "utf-8");
}

/**
 * Auto-detect tech stack from project files
 */
export function detectTechStack(projectPath: string): string[] {
  const techStack: string[] = [];

  const indicators: Record<string, string[]> = {
    "package.json": ["Node.js"],
    "tsconfig.json": ["TypeScript"],
    "next.config.js": ["Next.js"],
    "next.config.mjs": ["Next.js"],
    "next.config.ts": ["Next.js"],
    "vite.config.ts": ["Vite"],
    "vite.config.js": ["Vite"],
    "tailwind.config.js": ["Tailwind CSS"],
    "tailwind.config.ts": ["Tailwind CSS"],
    "prisma/schema.prisma": ["Prisma"],
    "drizzle.config.ts": ["Drizzle ORM"],
    "Cargo.toml": ["Rust"],
    "requirements.txt": ["Python"],
    "pyproject.toml": ["Python"],
    "go.mod": ["Go"],
    "Gemfile": ["Ruby"],
    "pom.xml": ["Java", "Maven"],
    "build.gradle": ["Java", "Gradle"],
    "docker-compose.yml": ["Docker"],
    "Dockerfile": ["Docker"],
    ".github/workflows": ["GitHub Actions"],
  };

  for (const [file, techs] of Object.entries(indicators)) {
    const filePath = path.join(projectPath, file);
    if (fs.existsSync(filePath)) {
      techStack.push(...techs);
    }
  }

  // Check package.json for frameworks
  const packageJsonPath = path.join(projectPath, "package.json");
  if (fs.existsSync(packageJsonPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };

      if (deps.react) techStack.push("React");
      if (deps.vue) techStack.push("Vue");
      if (deps.svelte) techStack.push("Svelte");
      if (deps.express) techStack.push("Express");
      if (deps.fastify) techStack.push("Fastify");
      if (deps.hono) techStack.push("Hono");
      if (deps["@supabase/supabase-js"]) techStack.push("Supabase");
      if (deps.firebase) techStack.push("Firebase");
      if (deps.mongoose) techStack.push("MongoDB");
      if (deps.pg || deps.postgres) techStack.push("PostgreSQL");
      if (deps.redis || deps.ioredis) techStack.push("Redis");
      if (deps.electron) techStack.push("Electron");
    } catch (e) {
      // Ignore parse errors
    }
  }

  return [...new Set(techStack)]; // Remove duplicates
}

/**
 * Find docs folder in project
 */
export function findDocsFolder(projectPath: string): string | null {
  const possiblePaths = [
    "docs",
    "documentation",
    "doc",
    ".docs",
    "wiki",
  ];

  for (const docPath of possiblePaths) {
    const fullPath = path.join(projectPath, docPath);
    if (fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory()) {
      return docPath;
    }
  }

  return null;
}

/**
 * Index markdown files in docs folder
 */
export function indexDocsFolder(projectPath: string, docsPath: string): string[] {
  const fullDocsPath = path.join(projectPath, docsPath);
  const indexedFiles: string[] = [];

  if (!fs.existsSync(fullDocsPath)) {
    return indexedFiles;
  }

  function walkDir(dir: string, prefix: string = ""): void {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      const relativePath = prefix ? `${prefix}/${file}` : file;
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        walkDir(filePath, relativePath);
      } else if (file.endsWith(".md") || file.endsWith(".mdx") || file.endsWith(".txt")) {
        indexedFiles.push(relativePath);
      }
    }
  }

  walkDir(fullDocsPath);
  return indexedFiles;
}

/**
 * Extract npm packages from package.json for Context7 lookup
 */
export function extractPackages(projectPath: string): string[] {
  const packageJsonPath = path.join(projectPath, "package.json");

  if (!fs.existsSync(packageJsonPath)) {
    return [];
  }

  try {
    const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
    const deps = Object.keys(pkg.dependencies || {});
    const devDeps = Object.keys(pkg.devDependencies || {});

    // Filter to major packages that would benefit from Context7 docs
    const importantPackages = [...deps, ...devDeps].filter(pkg => {
      // Skip internal/small packages
      if (pkg.startsWith("@types/")) return false;
      if (pkg.startsWith("eslint")) return false;
      if (pkg.startsWith("prettier")) return false;
      return true;
    });

    return importantPackages.slice(0, 20); // Limit to top 20
  } catch (e) {
    return [];
  }
}

/**
 * Build the system prompt injection based on developer context
 */
export function buildSystemPromptInjection(
  config: CoworkerConfig,
  projectPath: string
): string {
  const { profile } = config;
  const parts: string[] = [];

  // Header
  parts.push("=== DEVELOPER CONTEXT (Auto-loaded) ===\n");

  // Tech Stack
  const techStack = profile.project.techStack.length > 0
    ? profile.project.techStack
    : detectTechStack(projectPath);

  if (techStack.length > 0) {
    parts.push(`PROJECT TECH STACK: ${techStack.join(", ")}\n`);
  }

  // Docs Context
  if (profile.docs.docsPath) {
    const indexedFiles = profile.docs.indexedFiles.length > 0
      ? profile.docs.indexedFiles
      : indexDocsFolder(projectPath, profile.docs.docsPath);

    if (indexedFiles.length > 0) {
      parts.push(`\nLOCAL DOCUMENTATION (${profile.docs.docsPath}/):`);
      parts.push("Before answering questions about this project's dependencies or APIs:");
      parts.push(`1. CHECK these local docs first: ${indexedFiles.slice(0, 10).join(", ")}${indexedFiles.length > 10 ? ` (+${indexedFiles.length - 10} more)` : ""}`);
      parts.push("2. Use Context7 MCP for npm package documentation if local docs don't exist");
      parts.push("3. NEVER hallucinate API methods - verify from docs first\n");
    }
  }

  // Methodology
  parts.push("CODING METHODOLOGY (Always follow these):");
  parts.push(`- Maximum file size: ${profile.methodology.maxFileLines} lines`);
  if (profile.methodology.testAfterEdit) {
    parts.push("- Run tests after every meaningful code change");
  }
  if (profile.methodology.cleanFolderStructure) {
    parts.push("- Maintain clean, organized folder structure");
  }
  for (const rule of profile.methodology.customRules) {
    parts.push(`- ${rule}`);
  }
  parts.push("");

  // Custom AI Instructions
  if (profile.aiInstructions) {
    parts.push("ADDITIONAL INSTRUCTIONS:");
    parts.push(profile.aiInstructions);
    parts.push("");
  }

  // Custom System Prompt
  if (profile.customSystemPrompt) {
    parts.push(profile.customSystemPrompt);
  }

  parts.push("=== END DEVELOPER CONTEXT ===\n");

  return parts.join("\n");
}

/**
 * Initialize a new .coworker config for a project
 */
export function initializeProjectConfig(projectPath: string): CoworkerConfig {
  // Auto-detect everything we can
  const techStack = detectTechStack(projectPath);
  const docsPath = findDocsFolder(projectPath);
  const packages = extractPackages(projectPath);
  const indexedFiles = docsPath ? indexDocsFolder(projectPath, docsPath) : [];

  const config: CoworkerConfig = {
    version: "1.0",
    profile: {
      name: "Developer",
      methodology: {
        maxFileLines: 350,
        testAfterEdit: true,
        cleanFolderStructure: true,
        customRules: [],
      },
      docs: {
        docsPath: docsPath || "./docs",
        useContext7: true,
        indexedFiles,
        packages,
        repositories: [],
      },
      project: {
        techStack,
        importantFiles: ["README.md", "package.json", "tsconfig.json"],
        filePatterns: ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx"],
      },
      aiInstructions: "",
      customSystemPrompt: "",
    },
  };

  return config;
}

/**
 * Get a summary of the current context for display
 */
export function getContextSummary(config: CoworkerConfig, projectPath: string): {
  techStack: string[];
  docsCount: number;
  packagesCount: number;
  rulesCount: number;
  hasCustomInstructions: boolean;
} {
  const techStack = config.profile.project.techStack.length > 0
    ? config.profile.project.techStack
    : detectTechStack(projectPath);

  const indexedFiles = config.profile.docs.indexedFiles.length > 0
    ? config.profile.docs.indexedFiles
    : indexDocsFolder(projectPath, config.profile.docs.docsPath);

  return {
    techStack,
    docsCount: indexedFiles.length,
    packagesCount: config.profile.docs.packages.length,
    rulesCount: config.profile.methodology.customRules.length + 3, // +3 for built-in rules
    hasCustomInstructions: !!config.profile.aiInstructions || !!config.profile.customSystemPrompt,
  };
}

// ============================================
// REPOSITORY CLONING & MANAGEMENT
// ============================================

import { exec, execSync, spawn } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

/**
 * Check if git is available
 */
export function isGitAvailable(): boolean {
  try {
    execSync("git --version", { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

/**
 * Clone a repository with sparse checkout for efficiency
 */
export async function cloneRepository(
  projectPath: string,
  repo: DocRepository,
  onProgress?: (message: string) => void
): Promise<{ success: boolean; error?: string }> {
  const docsDir = path.join(projectPath, "docs");
  const repoDir = path.join(docsDir, repo.name);

  try {
    // Create docs directory if it doesn't exist
    if (!fs.existsSync(docsDir)) {
      fs.mkdirSync(docsDir, { recursive: true });
    }

    // If repo already exists, pull latest
    if (fs.existsSync(repoDir)) {
      onProgress?.(`Updating ${repo.name}...`);
      await execAsync(`git -C "${repoDir}" pull --depth=1`, { timeout: 60000 });
      return { success: true };
    }

    onProgress?.(`Cloning ${repo.name}...`);

    // Use sparse checkout if sparsePaths are specified
    if (repo.sparsePaths && repo.sparsePaths.length > 0) {
      // Initialize empty repo
      await execAsync(`git init "${repoDir}"`);

      // Add remote
      await execAsync(`git -C "${repoDir}" remote add origin ${repo.url}`);

      // Enable sparse checkout
      await execAsync(`git -C "${repoDir}" config core.sparseCheckout true`);

      // Write sparse-checkout file
      const sparseFile = path.join(repoDir, ".git", "info", "sparse-checkout");
      fs.writeFileSync(sparseFile, repo.sparsePaths.join("\n"), "utf-8");

      // Fetch and checkout
      onProgress?.(`Fetching ${repo.name} (sparse: ${repo.sparsePaths.join(", ")})...`);
      await execAsync(
        `git -C "${repoDir}" fetch --depth=1 origin ${repo.branch}`,
        { timeout: 120000 }
      );
      await execAsync(`git -C "${repoDir}" checkout ${repo.branch}`);
    } else {
      // Full shallow clone
      await execAsync(
        `git clone --depth=1 --branch=${repo.branch} ${repo.url} "${repoDir}"`,
        { timeout: 120000 }
      );
    }

    onProgress?.(`${repo.name} ready!`);
    return { success: true };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`Failed to clone ${repo.name}:`, errorMsg);
    return { success: false, error: errorMsg };
  }
}

/**
 * Clone all configured repositories
 */
export async function syncAllRepositories(
  projectPath: string,
  config: CoworkerConfig,
  onProgress?: (repoName: string, status: string) => void
): Promise<{ success: boolean; results: Record<string, { success: boolean; error?: string }> }> {
  const results: Record<string, { success: boolean; error?: string }> = {};

  if (!isGitAvailable()) {
    return {
      success: false,
      results: { _error: { success: false, error: "Git is not installed" } },
    };
  }

  const repos = config.profile.docs.repositories || [];

  for (const repo of repos) {
    onProgress?.(repo.name, "cloning");
    const result = await cloneRepository(projectPath, repo, (msg) =>
      onProgress?.(repo.name, msg)
    );
    results[repo.name] = result;
    onProgress?.(repo.name, result.success ? "ready" : "error");
  }

  const allSuccess = Object.values(results).every((r) => r.success);
  return { success: allSuccess, results };
}

/**
 * Get status of all configured repositories
 */
export function getRepositoryStatus(
  projectPath: string,
  config: CoworkerConfig
): Record<string, { exists: boolean; lastModified?: number }> {
  const status: Record<string, { exists: boolean; lastModified?: number }> = {};
  const docsDir = path.join(projectPath, "docs");

  for (const repo of config.profile.docs.repositories || []) {
    const repoDir = path.join(docsDir, repo.name);
    if (fs.existsSync(repoDir)) {
      const stat = fs.statSync(repoDir);
      status[repo.name] = { exists: true, lastModified: stat.mtimeMs };
    } else {
      status[repo.name] = { exists: false };
    }
  }

  return status;
}

/**
 * Add a new repository to the config
 */
export function addRepository(
  config: CoworkerConfig,
  repo: Omit<DocRepository, "status">
): CoworkerConfig {
  const newRepo: DocRepository = {
    ...repo,
    status: "pending",
  };

  return {
    ...config,
    profile: {
      ...config.profile,
      docs: {
        ...config.profile.docs,
        repositories: [...(config.profile.docs.repositories || []), newRepo],
      },
    },
  };
}

/**
 * Remove a repository from the config
 */
export function removeRepository(
  config: CoworkerConfig,
  repoName: string
): CoworkerConfig {
  return {
    ...config,
    profile: {
      ...config.profile,
      docs: {
        ...config.profile.docs,
        repositories: (config.profile.docs.repositories || []).filter(
          (r) => r.name !== repoName
        ),
      },
    },
  };
}

// ============================================
// SMART DOC SEARCH
// ============================================

export interface DocSearchResult {
  file: string;
  content: string;
  relevance: number;
  lineNumber?: number;
}

/**
 * Search docs folder for relevant content
 * Uses simple keyword matching for now, can be upgraded to embeddings later
 */
export function searchDocs(
  projectPath: string,
  docsPath: string,
  query: string,
  maxResults: number = 5
): DocSearchResult[] {
  const fullDocsPath = path.join(projectPath, docsPath);
  const results: DocSearchResult[] = [];

  if (!fs.existsSync(fullDocsPath)) {
    return results;
  }

  // Normalize query to keywords
  const keywords = query
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 2);

  function searchFile(filePath: string, relativePath: string): void {
    try {
      const content = fs.readFileSync(filePath, "utf-8");
      const lines = content.split("\n");
      const lowerContent = content.toLowerCase();

      // Calculate relevance based on keyword matches
      let relevance = 0;
      for (const keyword of keywords) {
        const matches = (lowerContent.match(new RegExp(keyword, "g")) || []).length;
        relevance += matches;
      }

      if (relevance > 0) {
        // Find the most relevant section (paragraph containing most keywords)
        let bestSection = "";
        let bestSectionRelevance = 0;
        let bestLineNumber = 0;

        for (let i = 0; i < lines.length; i++) {
          const section = lines.slice(Math.max(0, i - 2), i + 5).join("\n");
          const sectionLower = section.toLowerCase();
          let sectionRelevance = 0;
          for (const keyword of keywords) {
            if (sectionLower.includes(keyword)) sectionRelevance++;
          }
          if (sectionRelevance > bestSectionRelevance) {
            bestSectionRelevance = sectionRelevance;
            bestSection = section;
            bestLineNumber = i + 1;
          }
        }

        results.push({
          file: relativePath,
          content: bestSection.slice(0, 500), // Limit content size
          relevance,
          lineNumber: bestLineNumber,
        });
      }
    } catch (e) {
      // Skip files that can't be read
    }
  }

  function walkDir(dir: string, prefix: string = ""): void {
    try {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        const filePath = path.join(dir, file);
        const relativePath = prefix ? `${prefix}/${file}` : file;

        try {
          const stat = fs.statSync(filePath);
          if (stat.isDirectory() && !file.startsWith(".") && file !== "node_modules") {
            walkDir(filePath, relativePath);
          } else if (
            file.endsWith(".md") ||
            file.endsWith(".mdx") ||
            file.endsWith(".txt") ||
            file.endsWith(".rst")
          ) {
            searchFile(filePath, relativePath);
          }
        } catch (e) {
          // Skip inaccessible files
        }
      }
    } catch (e) {
      // Skip inaccessible directories
    }
  }

  walkDir(fullDocsPath);

  // Sort by relevance and return top results
  return results.sort((a, b) => b.relevance - a.relevance).slice(0, maxResults);
}

/**
 * Search for documentation about a specific topic
 * Searches both local docs and returns Context7 hint if enabled
 */
export function findDocumentation(
  projectPath: string,
  config: CoworkerConfig,
  topic: string
): {
  localResults: DocSearchResult[];
  suggestContext7: boolean;
  context7Packages: string[];
} {
  const localResults = searchDocs(
    projectPath,
    config.profile.docs.docsPath,
    topic
  );

  // Also search cloned repos
  for (const repo of config.profile.docs.repositories || []) {
    const repoDocsPath = path.join("docs", repo.name);
    const repoResults = searchDocs(projectPath, repoDocsPath, topic);
    localResults.push(
      ...repoResults.map((r) => ({
        ...r,
        file: `${repo.name}/${r.file}`,
      }))
    );
  }

  // Re-sort after adding repo results
  localResults.sort((a, b) => b.relevance - a.relevance);

  // Check if topic matches any known packages
  const topicLower = topic.toLowerCase();
  const matchingPackages = (config.profile.docs.packages || []).filter((pkg) =>
    pkg.toLowerCase().includes(topicLower) || topicLower.includes(pkg.toLowerCase())
  );

  return {
    localResults: localResults.slice(0, 5),
    suggestContext7: config.profile.docs.useContext7 && localResults.length < 3,
    context7Packages: matchingPackages,
  };
}

/**
 * Popular documentation repositories that users might want
 */
export const POPULAR_DOC_REPOS: Omit<DocRepository, "status">[] = [
  {
    name: "supabase",
    url: "https://github.com/supabase/supabase",
    branch: "master",
    sparsePaths: ["apps/docs/", "packages/supabase-js/src/"],
  },
  {
    name: "react",
    url: "https://github.com/reactjs/react.dev",
    branch: "main",
    sparsePaths: ["src/content/"],
  },
  {
    name: "nextjs",
    url: "https://github.com/vercel/next.js",
    branch: "canary",
    sparsePaths: ["docs/"],
  },
  {
    name: "tailwindcss",
    url: "https://github.com/tailwindlabs/tailwindcss.com",
    branch: "master",
    sparsePaths: ["src/pages/docs/"],
  },
  {
    name: "prisma",
    url: "https://github.com/prisma/docs",
    branch: "main",
    sparsePaths: ["content/"],
  },
  {
    name: "drizzle",
    url: "https://github.com/drizzle-team/drizzle-orm",
    branch: "main",
    sparsePaths: ["docs/", "drizzle-orm/src/"],
  },
  {
    name: "hono",
    url: "https://github.com/honojs/hono",
    branch: "main",
    sparsePaths: ["docs/", "src/"],
  },
  {
    name: "tanstack-query",
    url: "https://github.com/TanStack/query",
    branch: "main",
    sparsePaths: ["docs/"],
  },
];

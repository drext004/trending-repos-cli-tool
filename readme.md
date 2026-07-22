## GitHub Trending Repos CLI 🚀

A robust, production-ready Command Line Interface (CLI) utility built with Node.js and TypeScript. This tool queries the GitHub Search API to discover trending repositories while utilizing an intelligent, multi-query Master JSON Cache to bypass network bottlenecks and respect GitHub's API rate limits.

# Features

1. Flexible Repository Search: Filter trending repositories dynamically by programming language, duration (day, week, month, year), and custom limits.

2. Intelligent Master JSON Cache: Implements an atomic Read-Modify-Write caching strategy with a 5-minute Time-To-Live (TTL) configured uniquely for each dynamic search query.

3. Slick Terminal UI: Uses chalk to output clear, readable, and beautifully color-coded repository summaries directly to your command prompt.

4. Defensive Error Handling: Prevents loops from crashing on edge cases, such as when the API returns fewer items than requested, or during network disruptions.

5. Modular Architecture: Decoupled clean code featuring dedicated orchestration, API networking, file system caching, and view-rendering helpers.

6. Tech Stack & Key Concepts

Language: TypeScript

Runtime Environment: Node.js

Third-Party Libraries: chalk (Console styling)

Core Engineering Patterns:

Modularization & Decoupling: Separating the orchestrator (startCli) from the network worker (fetchTrendingRepos) and cache updater (updateCache).

DRY (Don't Repeat Yourself): Streamlining console rendering into a single, highly-reusable loop utility (printRepoDetails).

Atomic Cache Operations: Safely deserializing, merging, and writing cache files as atomic units in memory to avoid parsing issues and broken file structures on disk.

# 🚀 Installation & Setup

Clone the repository:

git clone https://github.com/YOUR_USERNAME/github-trending-cli.git
cd github-trending-cli


Install dependencies:

npm install


Configure your project's module type:
Ensure your package.json has modern ES Module support enabled:

"type": "module"


Install TypeScript definition files:

npm i --save-dev @types/node


💻 Usage

Run the CLI using tsx (or compile it down with tsc):

# Basic usage (defaults to top 10 from past week)
npx tsx cli.ts --language typescript

# Custom limit and duration
npx tsx cli.ts --language python --duration month --limit 5

# Get the absolute hottest repositories from today
npx tsx cli.ts --language rust --duration day --limit 3


## Supported Command Arguments:

--language <lang>: The programming language you want to search (e.g., typescript, python, rust).

--duration <time>: The timeframe since repository creation. Supported values: day, week, month, year (Default: week).

--limit <number>: The maximum number of trending repositories to display (Default: 10).

📂 Architecture & Caching Strategy

Unlike basic caching systems that overwrite previous files or corrupt JSON formatting using un-parsed appending, this utility manages a Single Master JSON Cache (trendingRepos.json) as a local key-value store.

The "Read-Modify-Write" Cache Lifecycle:

Dynamic Key Generation: The CLI computes a unique query key for every search (e.g., language:rust+week).

File Check & Parse: If the cache file exists on disk, it reads the data and deserializes it into active JavaScript memory (JSON.parse).

Cache Validation: It verifies if the exact query exists and checks the Unix-timestamp differences:

$$\text{currentTime} - \text{cacheTime} < 300,000 \text{ ms (5 minutes)}$$

Cache Miss & Network Update: If expired or missing, it triggers a live API call, saves the fresh payload using bracket notation under its specific key, and overwrites the target file with stringified JSON safely.
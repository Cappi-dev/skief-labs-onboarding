# Skief Labs - Data Scraping Onboarding

This repository contains the progress, scripts, and documentation for my 2-week Data Scraping Internship at Skief Labs.

## 🎯 Role Objective
As a Data Scraping Intern, my focus is on collecting, structuring, and preparing reliable data to enable downstream operations and automation teams.

## 🛠️ Tech Stack
* **Languages:** Python, Node.js
* **Libraries:** BeautifulSoup, Requests, Puppeteer
* **Tools:** Git, GitHub, VS Code

## 📅 Daily Progress

### Day 1: Technical Setup & Fundamentals
* **Objective:** Set up the working environment and understand scraping basics.
* **Completed:** Installed Python/Node, configured GitHub, and established the project folder structure.
* **Documentation:** [Day 1 Notes](./week1-learning/notes/day1_notes.md)

### Day 2: HTML, Selectors & Static Scraping
* **Objective:** Extract data from static pages using Python.
* **Completed:** Developed `scrape_quotes.py` to collect text and authors from a live site and export them to a structured CSV.
* **Documentation:** [Day 2 Notes](./week1-learning/notes/day2_notes.md)

### Day 3: Browser Automation & Modular Challenges
* **Objective:** Master Puppeteer for handling JavaScript-heavy websites and complex modular structures.
* **Completed:** Automated browser navigation and extracted dynamic links into structured JSON.
* **Challenge Accomplished:** Built a production-ready scraper for the Iowa Veterinarian site with full pagination.
* **Technical Fix:** Implemented root and local `.gitignore` files to exclude `node_modules` and keep the repo clean.
* **Documentation:** [Day 3 Notes](./week1-learning/notes/day3_notes.md)

### Day 4: Data Cleaning & Normalization (Pandas)
* **Objective**: Transform raw, "dirty" data into a standardized, machine-ready format using Python/Pandas.
* **Completed**: Developed `clean_quotes.py` to perform automated data hygiene tasks.
* **Technical Fix**: Resolved character encoding mismatches between UTF-8 and Excel (UTF-8-SIG) to fix "garbage" character rendering.
* **Normalization Logic**: Implemented whitespace stripping, duplicate removal, and created a standardized lowercase column for keyword searching.
* **Documentation**: [Day 4 Notes](./week1-learning/notes/day4_notes.md)

### Day 5: Week 1 Review & Consolidation
* **Objective:** Reflect on foundational scrapers and prepare for advanced automation.
* **Completed:** Conducted a comprehensive review of Week 1 scripts and established a high-standard "Gold Standard" for data extraction.
* **Conceptual Exposure:** Explored n8n for workflow automation and low-code integration possibilities.
* **Consolidation:** Verified logic for the Arizona Veterinarian project, ensuring recursive API handling was production-ready.
* **Documentation:** [Day 5 Recap](./week1-learning/notes/day5_notes.md)

## 📅 Week 2 — Pagination, Anti-Blocking & Mini-Projects

### Day 6: Selectors & Pagination
* **Objective:** Master dynamic pagination patterns and robust CSS selector identification.
* **Completed:** Built a Playwright-based scraper for `quotes.toscrape.com` that automatically navigates through all 10 pages.
* **Logic:** Implemented a dynamic `while` loop that follows the "Next" button `href` rather than hardcoding page numbers, ensuring resilience against site changes.
* **Structure:** Established a standardized `/output` folder pattern to separate source code from generated data.
* **Documentation:** [Day 6 Notes](./week2-learning/notes/day6_notes.md)
---

## 🚀 Specialized Task: API-Based Data Extraction (Non-Browser)

### Objective
To demonstrate high-efficiency data collection by bypassing the browser and interacting directly with a government API.

### Project: Gouv-FR API Scraper
* **Target**: `pour-les-personnes-agees.gouv.fr` API.
* **Logic**: Iteratively looped through **101 department codes** (01-976) to fetch structured data.
* **Optimization**: Used `axios` for non-browser requests, reducing resource consumption and execution time by ~90% compared to Puppeteer.
* **Data Engineering**: 
    * **JSONL**: Saved raw responses in JSON Lines format for big-data compatibility.
    * **Flattened CSV**: Developed a custom recursive function to transform nested JSON objects into a flat table structure.
* **Resilience**: Implemented error handling to manage `ECONNRESET` server interruptions without stopping the full process.

## 🚀 Active Projects

### Iowa Veterinarian Data Extraction
* **Target:** [data.iowaagriculture.gov](https://data.iowaagriculture.gov/licensing_lists/veterinarians/)
* **Status:** **Completed (Phase 1)**.
* **Structure:** Followed Skief Modular Boilerplate (src/parsers, src/services).
* **Achievement:** Successfully extracted **3,092 records** including License Number, Full Name, City, State, Expiration Date, and License Status.
* **Logic:** Implemented dynamic state extraction to handle out-of-state licenses (NE, IL, CA) and automated pagination to navigate all 124 pages.

---

## 📜 Core Principles Followed
* **Correctness > Speed:** Ensuring data integrity (fixing state extraction) and clean formatting.
* **Structured Data > Raw Output:** Normalizing data into JSON for immediate use.
* **Documentation > Memory:** Maintaining clear, accessible logs of all technical processes.

*Intern: Jes Emanuel Chavez*
# Skief Labs - Data Scraping Onboarding

This repository contains the progress, scripts, and documentation for my 2-week Data Scraping Internship at Skief Labs.

## 🎯 Role Objective
As a Data Scraping Intern, my focus is on collecting, structuring, and preparing reliable data to enable downstream operations and automation teams.

## 🛠️ Tech Stack
* **Languages:** Python, Node.js
* **Libraries:** BeautifulSoup, Requests, Puppeteer, Axios
* **Tools:** Git, GitHub, VS Code, VPN (Rotation)

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
* **Documentation:** [Day 3 Notes](./week1-learning/notes/day3_notes.md)

### Day 4: Data Cleaning & Normalization (Pandas)
* **Objective**: Transform raw, "dirty" data into a standardized, machine-ready format using Python/Pandas.
* **Completed**: Developed `clean_quotes.py` to perform automated data hygiene tasks.
* **Normalization Logic**: Implemented whitespace stripping, duplicate removal, and created a standardized lowercase column for keyword searching.
* **Documentation**: [Day 4 Notes](./week1-learning/notes/day4_notes.md)

### Day 5: Week 1 Review & Consolidation
* **Objective:** Reflect on foundational scrapers and prepare for advanced automation.
* **Completed:** Conducted a comprehensive review of Week 1 scripts and established a high-standard "Gold Standard" for data extraction.
* **Documentation**: [Day 5 Recap](./week1-learning/notes/day5_notes.md)

---

## 📅 Week 2 — Pagination, Anti-Blocking & Mini-Projects

### Day 6: Selectors & Pagination
* **Objective:** Master dynamic pagination patterns and robust CSS selector identification.
* **Completed:** Built a scraper for `quotes.toscrape.com` that automatically navigates through all 10 pages.
* **Logic:** Implemented a dynamic `while` loop that follows the "Next" button `href` rather than hardcoding page numbers.
* **Documentation:** [Day 6 Notes](./week2-learning/notes/day6_notes.md)

### Day 7: Anti-Blocking & Professional Infrastructure
* **Objective:** Learn to bypass sophisticated bot-detection systems (Thentia/Akamai) using rotation and delays.
* **Completed:** Established a stable connection strategy for high-security portals.
* **Logic:** Integrated **VPN Rotation** and **Randomized User-Agents** to mimic human behavior and avoid 429 rate-limit errors.
* **Documentation:** [Day 7 Notes](./week2-learning/notes/day7_notes.md)

### Day 8: Dynamic Web Scraping & Production Delivery
* **Objective:** Scrape JavaScript-rendered content and deliver data according to professional naming standards.
* **Project:** [Day 8 Dynamic Quotes Scraper](./week2-learning/day8-quotes-scraper/)
* **Technical Achievement:** Used **Puppeteer** to handle a Single Page Application (SPA). Solved challenges where content and pagination were injected via AJAX.
* **Data Standards:** Implemented the "Senior-level" naming convention: `output_[domain]_[data]_[year].csv`.
* **Documentation:** [Day 8 Notes](./week2-learning/notes/day8_notes.md)

---

## 🚀 Specialized Tasks & Active Projects

### 1. Arizona State Project
* **Target Portal:** [azsvmeb.portalus.thentiacloud.net](https://azsvmeb.portalus.thentiacloud.net)
* **Objective:** Extract veterinarian registration data from the Arizona state portal.
* **Technical Logic:**
    * Direct API interaction using **Axios** to bypass frontend search limitations.
    * Implementation of recursive parsing for nested JSON responses.
* **Status:** ✅ Logic Verified & Production Ready.

### 2. Louisiana State Project
* **Target Portal:** [lbvmprod.portalus.thentiacloud.net](https://lbvmprod.portalus.thentiacloud.net)
* **Objective:** Collect comprehensive licensing data from the Louisiana Board of Veterinary Medicine.
* **Advanced Features:**
    * **Anti-Blocking:** Integrated **VPN Rotation** to handle high-security firewalls (Akamai/Thentia).
    * **Persistence:** Used `state.json` to track progress and allow the scraper to resume after network interruptions.
* **Status:** 🚀 Active (Scaling to 1,000+ records).

### 3. Gouv-FR API Scraper
* **Target**: `pour-les-personnes-agees.gouv.fr` API.
* **Logic**: Iteratively looped through **101 department codes** (01-976) to fetch structured data.
* **Optimization**: Bypassed browser overhead, reducing resource consumption by ~90%.
* **Flattening**: Developed a custom recursive function to transform nested JSON objects into a flat table structure.

### 4. Iowa Veterinarian Data Extraction
* **Target:** [data.iowaagriculture.gov](https://data.iowaagriculture.gov/licensing_lists/veterinarians/)
* **Achievement:** Extracted **3,092 records** including License Number, Full Name, City, State, Expiration Date, and Status across 124 pages.

---

## 📜 Core Principles Followed
* **Correctness > Speed:** Ensuring data integrity (fixing state extraction) and clean formatting.
* **Structured Data > Raw Output:** Normalizing data into JSONL and CSV for immediate use.
* **Documentation > Memory:** Maintaining clear, accessible logs of all technical processes.

*Intern: Jes Emanuel Chavez*
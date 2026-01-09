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
---

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
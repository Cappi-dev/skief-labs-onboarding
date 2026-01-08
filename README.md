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

### Day 3: Browser Automation & Dynamic Scraping
* [cite_start]**Objective:** Master Puppeteer for handling JavaScript-heavy websites [cite: 104-106].
* [cite_start]**Completed:** Automated browser navigation, captured page screenshots, and extracted dynamic links into structured JSON [cite: 145-146].
* [cite_start]**Technical Fix:** Implemented a `.gitignore` to maintain a clean repository by excluding `node_modules`[cite: 177, 180].
* **Documentation:** [Day 3 Notes](./week1-learning/notes/day3_notes.md)

---

## 🚀 Active Projects

### Iowa Veterinarian Data Extraction
* **Target:** [data.iowaagriculture.gov](https://data.iowaagriculture.gov/licensing_lists/veterinarians/)
* [cite_start]**Status:** Initialized project structure following Skief Modular Boilerplate (src/parsers/services) [cite: 201-216].
* [cite_start]**Goal:** Extract veterinarian contact data and map to internal standard field names [cite: 24-39].

---

## 📜 Core Principles Followed
* [cite_start]**Correctness > Speed:** Ensuring data integrity and clean formatting before delivery[cite: 74].
* [cite_start]**Structured Data > Raw Output:** Normalizing data into CSV/JSONL for immediate use [cite: 145-146].
* [cite_start]**Documentation > Memory:** Maintaining clear, accessible logs of all technical processes [cite: 191-192, 229].

*Intern: Jes Emanuel Chavez*
# Day 8 Mini-Project: Dynamic Website Scraper

## 🎯 Objective
The goal of this task was to build an end-to-end scraper for a dynamic website (`https://quotes.toscrape.com/js`) using professional standards and folder structures developed in previous tasks.

## 🛠️ Technical Challenges & Solutions

### 1. Dynamic Content Handling
The target website renders its content using JavaScript after the initial page load. Traditional HTTP requests (like Axios) return an empty page because the quotes aren't in the raw HTML.
* **Solution:** Implemented **Puppeteer** to launch a headless browser. This allows the JavaScript to execute fully, ensuring the quotes are visible in the DOM before extraction begins.

### 2. Pagination in Single Page Applications (SPA)
The "Next" button is dynamically generated, meaning the script cannot simply guess the next URL structure.
* **Solution:** Used `waitForSelector` to ensure the pagination element is rendered. The script extracts the URL from the `.next > a` element to drive the pagination loop until no more pages are found.

### 3. Browser Automation Performance
Running a full browser is resource-intensive compared to direct API scraping.
* **Solution:** Included randomized human-like delays (jitter) between pages. This mimics real user behavior to prevent server-side rate limits and ensures the local system's memory remains stable during the run.

## 📂 Deliverables

### **GitHub (Source Code)**
The repository follows a modular structure:
- `src/services/scraper.js`: The Puppeteer browser logic and extraction engine.
- `main.js`: The controller for pagination, data assembly, and file persistence.


### **Google Drive (Data Output)**
Standardized professional filenames used for delivery:
- `output_quotes.toscrape.com_quotes_2026.csv`
- `output_quotes.toscrape.com_quotes_2026.jsonl`

## 🏁 Conclusion
This project successfully applied **Anti-blocking** and **State Management** logic to a dynamic environment, ensuring the final dataset is clean, structured, and professionally formatted.
# OpenCorporates Scraper (Hybrid Architecture)

This project is a proof-of-concept scraper for OpenCorporates. It uses a hybrid approach to bypass Captcha security walls and extract nested company and officer data.

## Architecture
1. **Session Manager (Puppeteer + 2Captcha):** Handles automated login, detects security walls, solves Captchas using the 2Captcha API, and extracts valid session cookies.
2. **Data Extractor (Axios + Cheerio):** Uses the extracted cookie to perform fast, headless HTTP requests to search for companies and scrape nested officer details.

## Setup Instructions

### 1. Install Dependencies
This project uses `pnpm` for package management.
```bash
pnpm install
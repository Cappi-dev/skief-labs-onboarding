#  OpenCorporates Scraper (Hybrid Architecture)

This project is a proof-of-concept scraper for OpenCorporates.  
It uses a hybrid approach to bypass CAPTCHA security walls and extract nested company and officer data.

---

##  Architecture

### 1. Session Manager (Puppeteer + 2Captcha)
- Handles automated login  
- Detects security walls  
- Solves CAPTCHAs using the 2Captcha API  
- Extracts valid session cookies  

### 2. Data Extractor (Axios + Cheerio)
- Uses extracted cookies  
- Performs fast, headless HTTP requests  
- Searches for companies  
- Scrapes nested officer details  

---

##  Setup Instructions

### 1. Install Dependencies
This project uses `pnpm` for package management.

```bash
pnpm install
# OpenCorporates Custom Scraper

A hybrid-architecture web scraper designed to extract company and officer data from OpenCorporates.com. 

This tool uses a browser for secure login and Captcha clearance, and then switches to a fast, non-browser HTTP client to perform the actual data extraction.

## Features
* **Hybrid Architecture:** Uses Puppeteer (slow/secure) for Session Management and Axios (fast/efficient) for Data Extraction.
* **Automated Captcha Solving:** Integrates with the 2Captcha API to automatically bypass HAProxy and hCaptcha security blocks.
* **Session & Cookie Rotation:** Automatically rotates through multiple account sessions to prevent rate-limiting and bans.
* **Smart Search:** Takes a list of company names, searches the database, finds the exact match, and extracts the target profile.
* **Officer Extraction:** Extracts company details and recursively pulls individual profile data for all listed directors and officers.
* **CSV Export:** Neatly formats and saves all extracted data into spreadsheet-ready CSV files.

## Prerequisites
You will need Node.js installed on your machine, as well as a 2Captcha account with API credits.

## Installation
1. Clone this repository to your local machine.
2. Open your terminal in the project folder and install the required dependencies:
   ```bash
   npm install puppeteer axios cheerio dotenv
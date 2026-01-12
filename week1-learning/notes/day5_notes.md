# Day 5 — Week 1 Overall Recap

**Good Day @~Armen and @~Sardar AZIMOV. Here is my Week-1 Recap:**

### [What I Learned]
* **Tool Versatility**: Learned to apply **Python/Pandas** for data cleaning and **Node.js/Axios** for high-speed API scraping.
* **Modular Code**: Practiced the Skief Boilerplate structure to keep scrapers organized and scalable.
* **Data Engineering**: Mastered flattening complex nested JSON into CSV and JSONL formats.

### [What Clicked]
* **API vs. Browser**: The realization that direct API requests are significantly faster and more resilient than browser automation when the endpoint is accessible.
* **Data Integrity**: Understanding that identifying encoding issues (like `utf-8-sig`) is just as important as the scraping itself.

### [What I Struggled With]
* **Error Management**: Handling transient server errors like **`ECONNRESET`**. It was a learning curve to realize these are often network-side and require logging/resilience rather than just a code fix.

### [What I Want to Learn Next]
* **Automation Orchestration**: I am looking forward to exploring **n8n** to understand how to connect these scripts into larger automated workflows.
* **Scalability**: How to manage even larger datasets (100k+ records) efficiently.

### [Clarifications]
* **Validate scripts**: I would like to verify if the "flat" structure used for the Gouv-FR API task is acceptable for quick scripts, or if I should strictly follow the Iowa-style modularity for all future tasks.
* **Clarify scraping questions**: I'm curious about the "Gold Standard" for output formats at Skief—when a client doesn't specify, should we prioritize JSONL for its storage benefits or CSV for its accessibility?.



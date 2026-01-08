# Day 3 – Browser Automation & Dynamic Scraping (Puppeteer)

## Objective
[cite_start]The goal for today was to understand when static scraping (Python/BeautifulSoup) is not enough and to learn how to use browser automation for sites that rely on JavaScript [cite: 104-106].

## What I found intuitive:
* **Visual Interaction**: Commands like `page.goto()` and `page.screenshot()` feel very natural because they mimic how a person uses a browser.
* **Logic Flow**: The process of opening a browser, creating a new page, and then performing actions is easy to follow step-by-step.

## What was confusing:
* **Execution Policies**: I initially struggled with Windows PowerShell blocking the `npm` scripts. Switching to Command Prompt (CMD) fixed this, but it was a good lesson in environment configuration.
* **Asynchronous Code**: Using `async` and `await` is a bit different from my Python experience, specifically remembering to 'await' every browser action so the script doesn't close too early.
* **Context**: It took a moment to realize that code inside `page.evaluate()` is running in the browser console, while the rest is running in my terminal.

## Learnings & Technical Takeaways:
* [cite_start]**Handling Dynamic Content**: I learned that Puppeteer is necessary for sites that use JavaScript to render data[cite: 15]. Static tools would return an empty page, but Puppeteer waits for the content to load.
* **Browser Instances**: Learned the difference between "Headless" (background) and "Headful" (visible) browser modes.
* [cite_start]**Data Extraction**: Practiced using `querySelectorAll` to grab multiple links and save them into a structured JSON file[cite: 146].
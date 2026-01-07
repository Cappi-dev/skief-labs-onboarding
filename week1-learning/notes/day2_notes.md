# Day 2 – HTML, Selectors & Static Scraping

## What I found easy today:
* Setting up the Python environment and installing libraries like `requests` and `BeautifulSoup`.
* Inspecting the website to find the HTML tags for the quotes and authors.
* Running the basic script to pull data from the website.

## What I found difficult today:
* **Encoding Issues:** The CSV originally showed weird characters (like â€œ) instead of quotation marks. I fixed this by changing the encoding to `utf-8-sig`.
* **File Permissions:** I got a "Permission Denied" error because I tried to run the script while the CSV file was still open in Excel. I learned I must close the file before running the code.

## What I learned:
* [cite_start]How to use CSS selectors like `.text` and `.author` to find specific data in the HTML structure[cite: 58].
* [cite_start]The importance of data cleaning—making sure the text looks right in Excel is just as important as scraping it[cite: 17, 20].
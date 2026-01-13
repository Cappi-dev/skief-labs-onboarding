# Day 6 Notes: Selectors & Pagination

### How pagination was handled:
* **Dynamic Loop:** I implemented a `while` loop that continues as long as the "Next" button selector (`li.next a`) is found on the current page.
* **Element Extraction:** For each page, the script uses the `getAttribute('href')` method to capture the relative URL of the next page.
* **Navigation:** The script then concatenates this relative path with the base URL (`https://quotes.toscrape.com`) to navigate to the subsequent page.
* **Exit Condition:** The loop terminates automatically when the `nextButton` variable returns `null`, indicating the final page has been reached.

### How pagination patterns were detected:
* **DOM Analysis:** By inspecting the site's footer area using Browser DevTools, I identified a list item (`<li>`) with the class `.next`.
* **Selector Selection:** I determined that `li.next a` was the most specific and reliable selector to target the navigation link without interference from other elements.
* **Logic Validation:** I verified that the site uses a traditional "Click-to-Load" pattern rather than infinite scroll, making the "Next" button the primary state indicator for the scrape's progress.
* **Reliability:** Following the `href` provided by the server is more robust than hardcoding page numbers, as it naturally adjusts if the total number of pages changes.
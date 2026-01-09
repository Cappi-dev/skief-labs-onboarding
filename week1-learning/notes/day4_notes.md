# Day 4: Data Cleaning & Normalization (Pandas)

## Objective
To understand how to transform raw, "dirty" scraped data into a clean, normalized format that is safe for automation and database entry.

## Key Learnings
* **Pandas DataFrames**: Learned how to load CSV data into a DataFrame for high-speed manipulation.
* **Handling Duplicates**: Used `drop_duplicates()` to ensure data uniqueness.
* **Whitespace Management**: Applied `.str.strip()` to remove invisible spaces that can break database queries.
* **Encoding Challenges**: Identified how `utf-8` vs `utf-8-sig` affects character rendering in Excel (fixing the `â€œ` garbage characters).

## Normalization Deliverable
**What does data normalization mean to me?**
Normalization is the process of making raw data predictable. To me, it means ensuring that "Albert Einstein" and " ALBERT EINSTEIN " are treated as the same record. By standardizing casing and removing character noise, I create a "single version of truth" that prevents errors in downstream automation.

## Tools Used
* **Python**
* **Pandas Library**
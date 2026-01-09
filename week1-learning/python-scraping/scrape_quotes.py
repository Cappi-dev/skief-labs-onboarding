import requests
from bs4 import BeautifulSoup
import csv

# 1. Fetch the page content
url = "https://quotes.toscrape.com"
response = requests.get(url)

# 2. Initialize BeautifulSoup to parse the HTML
soup = BeautifulSoup(response.text, 'html.parser')

# 3. Find all quote containers
quote_elements = soup.find_all('div', class_='quote')

# 4. Save to CSV

with open('quotes.csv', 'w', newline='', encoding='utf-8') as file:
    writer = csv.writer(file)
    writer.writerow(["Quote", "Author"]) 

    for element in quote_elements:
        text = element.find('span', class_='text').text
        author = element.find('small', class_='author').text
        writer.writerow([text, author])

print("Task complete. Data saved to quotes.csv")
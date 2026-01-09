import pandas as pd
import os

def clean_data():
    # Load the quotes.csv from Day 2
    input_file = 'quotes.csv'
    output_file = 'quotes_clean.csv'

    # Check if the input file exists in the current directory
    if not os.path.exists(input_file):
        print(f"Error: {input_file} not found. Make sure it's in this folder!")
        return

    # 1. Load data
    # i use encoding_errors='ignore' or 'utf-8' to ensure smooth reading
    df = pd.read_csv(input_file)
    print(f"Original records: {len(df)}")

    # 2. Remove duplicates (Hands-On Task Requirement)
    df = df.drop_duplicates()

    # 3. Strip whitespace from all string columns (Hands-On Task Requirement)
    df = df.apply(lambda x: x.str.strip() if x.dtype == "object" else x)

    # 4. Add a lowercase column for the 'Quote' column (Hands-On Task Requirement)
    column_name = 'Quote' if 'Quote' in df.columns else 'quote'
    
    if column_name in df.columns:
        df['quote_lowercase'] = df[column_name].str.lower()
    else:
        print("Warning: 'Quote' column not found for normalization.")

    # 5. Export cleaned CSV (Deliverable Requirement)
    df.to_csv(output_file, index=False, encoding='utf-8-sig')
    
    print(f"Cleaned records: {len(df)}")
    print(f"Success! Cleaned data saved to {output_file}")

if __name__ == "__main__":
    clean_data()
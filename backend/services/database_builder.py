# backend/services/database_builder.py

import sqlite3
import pandas as pd
import os

# Define the path to your FPL data and the name for your database file.
DATA_DIR = 'fpl_data'
DB_NAME = 'fpl_database.db'
TABLE_NAME = 'gameweeks'

def build_database():
    """
    Reads all gameweek CSV files from the fpl_data directory,
    combines them, and loads them into an SQLite database.
    This version is more robust and handles parsing errors.
    """
    if os.path.exists(DB_NAME):
        os.remove(DB_NAME)
        print(f"Removed existing database '{DB_NAME}'.")

    csv_files = [f for f in os.listdir(DATA_DIR) if f.endswith('.csv')]
    
    if not csv_files:
        print(f"No CSV files found in the '{DATA_DIR}' directory. Please download them first.")
        return

    print(f"Found {len(csv_files)} CSV files. Combining them...")

    all_dataframes = []
    for f in csv_files:
        file_path = os.path.join(DATA_DIR, f)
        try:
            # --- THIS IS THE KEY CHANGE ---
            # We add on_bad_lines='skip' to ignore rows with parsing errors.
            df = pd.read_csv(file_path, on_bad_lines='skip')
            all_dataframes.append(df)
            print(f"Successfully read {f}")
        except Exception as e:
            # This will tell us if a file is completely unreadable
            print(f"Could not read file {f}. Error: {e}")
            continue # Skip to the next file

    if not all_dataframes:
        print("Could not read any CSV files successfully. Aborting.")
        return

    # Combine all the successfully read dataframes
    all_gws_df = pd.concat(all_dataframes, ignore_index=True)

    all_gws_df.columns = all_gws_df.columns.str.replace(' ', '_').str.lower()
    
    print("Connecting to SQLite database...")
    conn = sqlite3.connect(DB_NAME)
    
    print(f"Loading {len(all_gws_df)} rows into table '{TABLE_NAME}'...")
    all_gws_df.to_sql(TABLE_NAME, conn, if_exists='replace', index=False)
    
    conn.close()
    
    print("Database build complete!")
    print(f"Database created at '{os.path.abspath(DB_NAME)}'")


if __name__ == '__main__':
    build_database()
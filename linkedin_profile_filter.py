#!/usr/bin/env python3
"""
LinkedIn Profile Filter
Filter LinkedIn profiles CSV for Python developers with 5+ years experience
"""

import pandas as pd
import re
from typing import List, Dict

def extract_years_from_experience(experience_text: str) -> int:
    """
    Extract years of experience from text like '5 years', '3+ years', etc.
    """
    if pd.isna(experience_text) or not isinstance(experience_text, str):
        return 0
    
    # Look for patterns like "5 years", "3+ years", "2-4 years"
    patterns = [
        r'(\d+)\+?\s*years?',
        r'(\d+)-\d+\s*years?',
        r'(\d+)\s*yrs?',
        r'(\d+)\+?\s*yrs?'
    ]
    
    max_years = 0
    for pattern in patterns:
        matches = re.findall(pattern, experience_text.lower())
        if matches:
            years = [int(match) for match in matches]
            max_years = max(max_years, max(years))
    
    return max_years

def contains_python_developer(title_text: str) -> bool:
    """
    Check if title/headline contains Python Developer keywords
    """
    if pd.isna(title_text) or not isinstance(title_text, str):
        return False
    
    python_keywords = [
        'python developer',
        'python engineer',
        'python programmer',
        'python software engineer',
        'backend python',
        'python backend',
        'senior python',
        'python dev',
        'python specialist'
    ]
    
    title_lower = title_text.lower()
    return any(keyword in title_lower for keyword in python_keywords)

def filter_linkedin_profiles(csv_file_path: str) -> List[Dict]:
    """
    Filter LinkedIn profiles based on criteria:
    - Title contains "Python Developer" related terms
    - Experience is at least 5 years
    """
    try:
        # Read CSV file
        df = pd.read_csv(csv_file_path)
        
        print(f"📊 Total profiles loaded: {len(df)}")
        print(f"📋 Columns available: {list(df.columns)}")
        
        # Common column names for LinkedIn data
        possible_name_cols = ['name', 'full_name', 'first_name', 'last_name', 'Name', 'Full Name']
        possible_title_cols = ['title', 'headline', 'job_title', 'position', 'Title', 'Headline', 'Job Title']
        possible_exp_cols = ['experience', 'years_experience', 'exp', 'Experience', 'Years Experience']
        
        # Find actual column names
        name_col = next((col for col in possible_name_cols if col in df.columns), None)
        title_col = next((col for col in possible_title_cols if col in df.columns), None)
        exp_col = next((col for col in possible_exp_cols if col in df.columns), None)
        
        if not name_col:
            print("❌ Could not find name column. Available columns:", list(df.columns))
            return []
        
        if not title_col:
            print("❌ Could not find title/headline column. Available columns:", list(df.columns))
            return []
        
        print(f"✅ Using columns - Name: '{name_col}', Title: '{title_col}', Experience: '{exp_col}'")
        
        # Filter for Python developers
        python_filter = df[title_col].apply(contains_python_developer)
        python_devs = df[python_filter]
        
        print(f"🐍 Found {len(python_devs)} Python developers")
        
        # Filter by experience if experience column exists
        if exp_col and exp_col in df.columns:
            python_devs['years_exp'] = python_devs[exp_col].apply(extract_years_from_experience)
            experienced_devs = python_devs[python_devs['years_exp'] >= 5]
            print(f"⭐ Found {len(experienced_devs)} Python developers with 5+ years experience")
        else:
            print("⚠️  No experience column found, returning all Python developers")
            experienced_devs = python_devs
        
        # Get first 10 matches
        top_10 = experienced_devs.head(10)
        
        # Prepare results
        results = []
        for idx, row in top_10.iterrows():
            result = {
                'name': row[name_col],
                'title': row[title_col],
                'experience': row[exp_col] if exp_col else 'N/A',
                'years_extracted': row.get('years_exp', 'N/A')
            }
            results.append(result)
        
        return results
        
    except FileNotFoundError:
        print(f"❌ File not found: {csv_file_path}")
        return []
    except Exception as e:
        print(f"❌ Error processing file: {str(e)}")
        return []

def create_sample_data():
    """
    Create a sample CSV file for demonstration
    """
    sample_data = [
        {"name": "John Smith", "title": "Senior Python Developer", "experience": "6 years"},
        {"name": "Sarah Johnson", "title": "Python Software Engineer", "experience": "8 years"},
        {"name": "Mike Chen", "title": "Full Stack Developer", "experience": "4 years"},
        {"name": "Lisa Rodriguez", "title": "Python Backend Engineer", "experience": "7 years"},
        {"name": "David Kim", "title": "Senior Python Developer", "experience": "10 years"},
        {"name": "Emma Wilson", "title": "Data Scientist", "experience": "5 years"},
        {"name": "Tom Brown", "title": "Python Developer", "experience": "3 years"},
        {"name": "Anna Garcia", "title": "Senior Python Engineer", "experience": "9 years"},
        {"name": "Chris Taylor", "title": "Backend Python Developer", "experience": "6 years"},
        {"name": "Jessica Lee", "title": "Python Specialist", "experience": "12 years"},
        {"name": "Alex Martinez", "title": "Software Engineer", "experience": "5 years"},
        {"name": "Rachel Davis", "title": "Python Dev", "experience": "7 years"}
    ]
    
    df = pd.DataFrame(sample_data)
    df.to_csv('sample_linkedin_profiles.csv', index=False)
    print("📁 Created sample_linkedin_profiles.csv for demonstration")
    return 'sample_linkedin_profiles.csv'

def main():
    """
    Main function to run the profile filter
    """
    print("🔍 LinkedIn Profile Filter for Python Developers (5+ years experience)")
    print("=" * 60)
    
    # Ask user for CSV file path or create sample
    csv_file = input("Enter CSV file path (or press Enter to use sample data): ").strip()
    
    if not csv_file:
        csv_file = create_sample_data()
    
    # Filter profiles
    results = filter_linkedin_profiles(csv_file)
    
    if results:
        print("\n🎯 TOP 10 MATCHING PROFILES:")
        print("=" * 50)
        
        for i, profile in enumerate(results, 1):
            print(f"{i:2d}. {profile['name']}")
            print(f"    📋 Title: {profile['title']}")
            print(f"    ⏱️  Experience: {profile['experience']} (Extracted: {profile['years_extracted']} years)")
            print()
        
        # Save results
        results_df = pd.DataFrame(results)
        results_df.to_csv('filtered_python_developers.csv', index=False)
        print("💾 Results saved to 'filtered_python_developers.csv'")
        
        # Return just the names as requested
        names = [profile['name'] for profile in results]
        print("\n📝 NAMES ONLY (as requested):")
        for i, name in enumerate(names, 1):
            print(f"{i}. {name}")
            
    else:
        print("❌ No matching profiles found")

if __name__ == "__main__":
    main()

import urllib.request
import urllib.parse
import json
import time

# List of artists to fetch
artist_names = [
    "&TEAM", "A.C.E", "AB6IX", "aespa", "Apink", "ASTRO", "ATEEZ", "B1A4", 
    "BABYMONSTER", "Billlie", "BLACKPINK", "BOYNEXTDOOR", "BTOB", "BTS", 
    "CRAVITY", "DAY6", "DRIPPIN", "ENHYPEN", "EXO", "(G)I-DLE", 
    "Girls' Generation", "GOT7", "H1-Key", "iKON", "ILLIT", "ITZY", "IVE", 
    "Kep1er", "KISS OF LIFE", "LE SSERAFIM", "MONSTA X", "n.SSign", "NCT", 
    "NCT DREAM", "NCT WISH", "NCT 127", "NewJeans", "NEXZ", "NiziU", "NMIXX", 
    "OH MY GIRL", "PLAVE", "Red Velvet", "RIIZE", "SEVENTEEN", "SHINee", 
    "STAYC", "Stray Kids", "SUPER JUNIOR", "THE BOYZ", "TOMORROW X TOGETHER", 
    "TREASURE", "TVXQ!", "TWICE", "TWS", "WayV", "Weeekly", "Xdinary Heroes", 
    "xikers", "ZEROBASEONE"
]

# Note: "Girls' Generation" used instead of "少女時代(Girls' Generation)" for better search results
# Note: "NCT 127" with space

results = []
errors = []

print(f"Fetching data for {len(artist_names)} artists...")

for i, name in enumerate(artist_names):
    try:
        # Search for album to get artist details + artwork
        query = urllib.parse.quote(name)
        url = f"https://itunes.apple.com/search?term={query}&country=JP&media=music&entity=album&limit=1"
        
        with urllib.request.urlopen(url) as response:
            data = json.loads(response.read().decode())
            
            if data['resultCount'] > 0:
                item = data['results'][0]
                
                # Construct artist object
                artist_obj = {
                    "id": f"a{i+1}",
                    "name": item['artistName'], # Use API name to be precise
                    "itunesId": str(item['artistId']),
                    "image": item.get('artworkUrl100', '').replace('100x100', '600x600'),
                    "isFollowed": i < 5, # Follow first 5 by default
                    "debutDate": "2020-01-01", # Placeholder, API doesn't give debut date easily
                    "popularity": 50 # Placeholder
                }
                
                # Manual overrides for debut date/popularity could go here if we had data
                
                results.append(artist_obj)
                print(f"[OK] {name} -> {item['artistName']} (ID: {item['artistId']})")
            else:
                print(f"[RW] {name} -> No results found")
                errors.append(name)
                
    except Exception as e:
        print(f"[ER] {name} -> {e}")
        errors.append(name)
        
    # Be nice to the API
    time.sleep(0.5)

# Output Final JSON
print("\n" + "="*30)
print("GENERATED JSON:")
print("="*30)
print(json.dumps(results, indent=4, ensure_ascii=False))
print("="*30)

if errors:
    print(f"\nErrors/No Results: {errors}")

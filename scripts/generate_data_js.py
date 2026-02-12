
import json
import codecs

# 1. Existing Data.js IDs (Verified)
VERIFIED_IDS = {
    "IVE": "1594159996",
    "NewJeans": "1634560799",
    "LE SSERAFIM": "1620611425",
    "aespa": "1540309605",
    "TWICE": "1056529729",
    "BTS": "550302450",
    "SEVENTEEN": "993414920",
    "Stray Kids": "1306346740"
}

# 2. Manual Fixes for Errors/Bad Search Results
MANUAL_FIXES = {
    "A.C.E": "1246637651",
    "ASTRO": "1086026855",
    "TOMORROW X TOGETHER": "1456559196",
    "WayV": "1446045645",
    "xikers": "1673891461",
    "NCT 127": "1133630737",
    "THE BOYZ": "1321796916",
    "TREASURE": "1524344445",
    "STAYC": "1538386120",
    "(G)I-DLE": "1378887586",
    "Girls' Generation": "357463500",
    "TVXQ!": "540125745",
    "DRIPPIN": "1533299115"
}

# 3. Target List of 61 Artists
TARGET_LIST = [
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

# Load JSON Data
with codecs.open(r'd:\Data\Antigravity\Neonlight\scripts\artists_data.json', 'r', 'utf-8-sig') as f:
    valid_data = json.load(f)

# Helper to find image in valid_data
def get_image_from_search(name):
    # Try exact name match first
    for item in valid_data:
        if item['name'].lower() == name.lower():
            return item['image']
    
    # Try fuzzy match (if search result name contains target or vice versa)
    # But be careful of bad matches (SEVENTEEN -> YOASOBI). 
    # Only use fuzzy if we don't have a manual fix or verified ID that contradicts?
    # Actually, let's just use what we have in valid_data if name matches somewhat
    return None

final_artists = []

print(f"Processing {len(TARGET_LIST)} artists...")

for i, name in enumerate(TARGET_LIST):
    itunes_id = None
    image_url = f"https://ui-avatars.com/api/?name={name.replace(' ', '+')}&background=random&color=fff&size=600" # Default
    
    # 1. Check Verified
    if name in VERIFIED_IDS:
        itunes_id = VERIFIED_IDS[name]
        # Try to find image from search result if available
        img = get_image_from_search(name)
        if img: image_url = img
        
    # 2. Check Manual Fixes
    elif name in MANUAL_FIXES:
        itunes_id = MANUAL_FIXES[name]
        img = get_image_from_search(name)
        if img: image_url = img
        
    # 3. Check Search Results
    else:
        # iterate json
        found = False
        for item in valid_data:
            # We assume the search result order in JSON matches the TARGET_LIST order 
            # derived from the powershell script only if we kept indexes.
            # But the JSON is just a flat list of results.
            # Let's match by name loosely.
            
            # Simple Name Match
            if item['name'].lower() == name.lower() or \
               (name == "Girls' Generation" and "少女時代" in item['name']) or \
               (name == "TVXQ!" and "東方神起" in item['name']):
                itunes_id = item['itunesId']
                image_url = item['image']
                found = True
                break
        
        # If not found by name, maybe check the JSON if it has the ID we expect? 
        # No, we rely on search.
        
        if not found:
             # Fallback: check if we have any result in JSON that looks ALMOST like it
             pass

    if not itunes_id:
        print(f"[WARN] No ID found for {name}, leaving empty (placeholder)")
        # We can leave itunesId undefined or null, app handles it?
        # App logic: if (!artist.itunesId) return [];
    
    artist_obj = {
        "id": f"a{i+1}",
        "name": name,
        "itunesId": itunes_id if itunes_id else "",
        "image": image_url,
        "isFollowed": i < 10, # Follow first 10
        "debutDate": "2020-01-01",
        "popularity": 50
    }
    final_artists.append(artist_obj)

# Generate JS Content
js_content = "/**\n * Neonlight Static Data\n * Generated via Script\n */\n\nconst artists = " + json.dumps(final_artists, indent=4, ensure_ascii=False) + ";\n\n// Re-export function to access list\nfunction getArtists() {\n    return artists;\n}"

with codecs.open(r'd:\Data\Antigravity\Neonlight\js\data.js', 'w', 'utf-8') as f:
    f.write(js_content)

print("Successfully wrote js/data.js")

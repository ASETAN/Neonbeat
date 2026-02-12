
$artistNames = @(
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
)

$results = @()
$counter = 1

Write-Host "Fetching data for $($artistNames.Count) artists..." -ForegroundColor Cyan

foreach ($name in $artistNames) {
    try {
        $encodedName = [uri]::EscapeDataString($name)
        
        $url = "https://itunes.apple.com/search?term=$encodedName&country=JP&media=music&entity=album&limit=1"
        
        $response = Invoke-RestMethod -Uri $url -Method Get
        
        if ($response.resultCount -gt 0) {
            $item = $response.results[0]
            
            $artistObj = @{
                id = "a$counter"
                name = $item.artistName
                itunesId = "$($item.artistId)"
                image = if ($item.artworkUrl100) { $item.artworkUrl100.Replace('100x100', '600x600') } else { "" }
                isFollowed = if ($counter -le 5) { $true } else { $false }
                debutDate = "2020-01-01"
                popularity = 50
            }
            
            $results += $artistObj
            Write-Host "[OK] $name -> $($item.artistName) (ID: $($item.artistId))" -ForegroundColor Green
            $counter++
        } else {
            Write-Host "[RW] $name -> No results found" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "[ER] $name -> $($_.Exception.Message)" -ForegroundColor Red
    }
    
    Start-Sleep -Milliseconds 500
}

# Convert to JSON and save to file
$json = $results | ConvertTo-Json -Depth 10
$jsonFile = "d:\Data\Antigravity\Neonlight\scripts\artists_data.json"
$json | Out-File -FilePath $jsonFile -Encoding utf8

Write-Host "`nSuccessfully saved $($results.Count) artists to $jsonFile" -ForegroundColor Cyan

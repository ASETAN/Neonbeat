
$verifiedIds = @{
    "IVE" = "1594159996"
    "NewJeans" = "1634560799"
    "LE SSERAFIM" = "1620611425"
    "aespa" = "1540309605"
    "TWICE" = "1056529729"
    "BTS" = "550302450"
    "SEVENTEEN" = "993414920"
    "Stray Kids" = "1306346740"
}

$manualFixes = @{
    "A.C.E" = "1246637651"
    "ASTRO" = "1086026855"
    "TOMORROW X TOGETHER" = "1456559196"
    "WayV" = "1446045645"
    "xikers" = "1673891461"
    "NCT 127" = "1133630737"
    "THE BOYZ" = "1321796916"
    "TREASURE" = "1524344445"
    "STAYC" = "1538386120"
    "(G)I-DLE" = "1378887586"
    "Girls' Generation" = "357463500"
    "TVXQ!" = "540125745"
    "DRIPPIN" = "1533299115"
}

$targetList = @(
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

# Load JSON
$jsonContent = Get-Content -Path "d:\Data\Antigravity\Neonlight\scripts\artists_data.json" -Raw -Encoding UTF8
$validData = $jsonContent | ConvertFrom-Json

$finalArtists = @()
$counter = 1

foreach ($name in $targetList) {
    $itunesId = $null
    $imageUrl = "https://ui-avatars.com/api/?name=$($name -replace ' ', '+')&background=random&color=fff&size=600"
    
    # Check Verified
    if ($verifiedIds.ContainsKey($name)) {
        $itunesId = $verifiedIds[$name]
        # Try to find valid image from json
        $match = $validData | Where-Object { $_.name -eq $name } | Select-Object -First 1
        if ($match) { $imageUrl = $match.image }
    }
    # Check Manual Fixes
    elseif ($manualFixes.ContainsKey($name)) {
        $itunesId = $manualFixes[$name]
        $match = $validData | Where-Object { $_.name -eq $name } | Select-Object -First 1
        if ($match) { $imageUrl = $match.image }
    }
    # Check JSON
    else {
        $match = $validData | Where-Object { $_.name -eq $name } | Select-Object -First 1
        if (-not $match) {
             # Fuzzy match for TVXQ / Girls Gen if needed but keys handle it
             if ($name -eq "Girls' Generation") { $match = $validData | Where-Object { $_.name -like "*少女時代*" } | Select-Object -First 1 }
             if ($name -eq "TVXQ!") { $match = $validData | Where-Object { $_.name -like "*東方神起*" } | Select-Object -First 1 }
        }
        
        if ($match) {
            $itunesId = $match.itunesId
            $imageUrl = $match.image
        }
    }
    
    $artistObj = @{
        id = "a$counter"
        name = $name
        itunesId = if ($itunesId) { $itunesId } else { "" }
        image = $imageUrl
        isFollowed = if ($counter -le 10) { $true } else { $false }
        debutDate = "2020-01-01"
        popularity = 50
    }
    
    $finalArtists += $artistObj
    $counter++
}

# Output to JS file
$json = $finalArtists | ConvertTo-Json -Depth 5
$jsContent = "/**`n * Neonlight Static Data`n * Generated via Script`n */`n`nconst artists = $json;`n`n// Re-export function to access list`nfunction getArtists() {`n    return artists;`n}"

$jsContent | Out-File -FilePath "d:\Data\Antigravity\Neonlight\js\data.js" -Encoding utf8

Write-Host "Done."

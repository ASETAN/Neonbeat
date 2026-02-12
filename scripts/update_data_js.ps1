
# Define User's Update List
$userUpdates = @(
    @{ name="&TEAM"; itunesId="1654437478"; image="https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/d6/17/69/d6176938-22a3-1d5d-217a-00e405932523/25UM1IM68644.rgb.jpg/600x600bb.jpg"; isFollowed=$true },
    @{ name="A.C.E"; itunesId="1236272788"; image="https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/64/78/8d/64788db6-9c40-57a1-95af-6da3f46b55e0/2237220.jpg/600x600bb.jpg"; isFollowed=$true },
    @{ name="ASTRO"; itunesId="1086927524"; image="https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/e1/10/1b/e1101bd8-256c-ab34-d5c6-87518e9aec38/ASTRO_RiseUp_Online_Cover_3000.jpg/600x600bb.jpg"; isFollowed=$true },
    @{ name="DRIPPIN"; itunesId="1536863500"; image="https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/94/d7/94/94d794b7-999a-6e34-705f-45c723097b55/cover_KM0014570_1.jpg/600x600bb.jpg"; isFollowed=$true },
    @{ name="i-dle"; itunesId="1378887586"; image="https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/f1/b9/bd/f1b9bd75-692c-fd3f-ab6a-553ac2622c21/5026854527215.jpg/600x600bb.jpg"; isFollowed=$true },
    @{ name="少女時代"; itunesId="357463500"; image="https://is1-ssl.mzstatic.com/image/thumb/Features6/v4/d7/cb/c3/d7cbc3d5-7005-b8a8-ebef-65cfec0337cd/dj.uojgpvio.jpg/600x600bb.jpg"; isFollowed=$false },
    @{ name="NCT 127"; itunesId="1235849306"; image="https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/72/d6/a0/72d6a047-96f9-ab91-1fa9-f288b6261278/NCT_127_Limitless_Digital_Cover_Global.jpg/600x600bb.jpg"; isFollowed=$false },
    @{ name="STAYC"; itunesId="1538881438"; image="https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/cf/1b/73/cf1b7373-d8e8-ce2f-5c27-3d129a4f7688/25UM2IM03139.rgb.jpg/600x600bb.jpg"; isFollowed=$false },
    @{ name="Stray Kids"; itunesId="1304823362"; image="https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/43/15/72/431572b4-a7fc-deb8-80c6-b0a04d0b4f9c/8809928958965.jpg/600x600bb.jpg"; isFollowed=$false },
    @{ name="THE BOYZ"; itunesId="1322012460"; image="https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/87/86/69/87866978-93a7-2d3c-0277-934e9b2b4f67/888272157833_Cover.jpg/600x600bb.jpg"; isFollowed=$false },
    @{ name="TOMORROW X TOGETHER"; itunesId="1454642552"; image="https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/dd/dc/13/dddc1312-9ee0-510c-e9a2-afa3b228d3e3/25UM1IM77949.rgb.jpg/600x600bb.jpg"; isFollowed=$false },
    @{ name="TREASURE"; itunesId="1526319335"; image="https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/65/fc/5d/65fc5dbc-8a4a-f154-bcc4-f05e00f072c1/ANTCD-A0000017859.jpg/600x600bb.jpg"; isFollowed=$false },
    @{ name="WayV"; itunesId="1449462311"; image="https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/48/2d/76/482d7686-938d-c0a6-05e6-33ad257cd6fc/888735954214.png/600x600bb.jpg"; isFollowed=$false },
    @{ name="xikers"; itunesId="1678885244"; image="https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/59/80/33/59803354-48e7-6b02-a027-287795c6688a/25UM1IM69577.rgb.jpg/600x600bb.jpg"; isFollowed=$false }
)

# Read file
$path = "d:\Data\Antigravity\Neonlight\js\data.js"
$content = Get-Content -Path $path -Raw -Encoding UTF8

# Extract JSON
$parts = $content -split "const artists ="
$header = $parts[0]
$rest = $parts[1]
$jsonParts = $rest -split "\];"
$jsonStr = $jsonParts[0] + "]" # Restore closing bracket
$footer = "];" + $jsonParts[1]

# Parse JSON
$artists = $jsonStr | ConvertFrom-Json

# Process Artists
foreach ($artist in $artists) {
    # 1. Renames
    if ($artist.name -eq "TVXQ!") {
        $artist.name = "東方神起"
        Write-Host "Renamed TVXQ! -> 東方神起"
    }
    if ($artist.name -eq "(G)I-DLE") {
        $artist.name = "i-dle"
        Write-Host "Renamed (G)I-DLE -> i-dle"
    }
    if ($artist.name -eq "Girls' Generation") {
        $artist.name = "少女時代"
        Write-Host "Renamed Girls' Generation -> 少女時代"
    }
    
    # 2. Updates
    $update = $userUpdates | Where-Object { $_.name -eq $artist.name }
    if ($update) {
        $artist.itunesId = $update.itunesId
        $artist.image = $update.image
        $artist.isFollowed = $update.isFollowed
        Write-Host "Updated $($artist.name)"
    }
}

# Re-serialize
$newJson = $artists | ConvertTo-Json -Depth 10

# Construct New Content
$newContent = $header + "const artists = " + $newJson + $footer

# Write File
$newContent | Out-File -FilePath $path -Encoding utf8

Write-Host "Done updating artist data."

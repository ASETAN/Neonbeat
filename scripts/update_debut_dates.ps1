
$debutDates = @{
    "&TEAM" = "2022"
    "A.C.E" = "2017"
    "AB6IX" = "2019"
    "aespa" = "2020"
    "Apink" = "2011"
    "ASTRO" = "2016"
    "ATEEZ" = "2018"
    "B1A4" = "2011"
    "BABYMONSTER" = "2023"
    "Billlie" = "2021"
    "BLACKPINK" = "2016"
    "BOYNEXTDOOR" = "2023"
    "BTOB" = "2012"
    "BTS" = "2013"
    "CRAVITY" = "2020"
    "DAY6" = "2015"
    "DRIPPIN" = "2020"
    "ENHYPEN" = "2020"
    "EXO" = "2012"
    "i-dle" = "2018"
    "少女時代" = "2007"
    "GOT7" = "2014"
    "H1-Key" = "2022"
    "iKON" = "2015"
    "ILLIT" = "2024"
    "ITZY" = "2019"
    "IVE" = "2021"
    "Kep1er" = "2022"
    "KISS OF LIFE" = "2023"
    "LE SSERAFIM" = "2022"
    "MONSTA X" = "2015"
    "n.SSign" = "2023"
    "NCT" = "2016"
    "NCT DREAM" = "2016"
    "NCT WISH" = "2024"
    "NCT 127" = "2016"
    "NewJeans" = "2022"
    "NEXZ" = "2024"
    "NiziU" = "2020"
    "NMIXX" = "2022"
    "OH MY GIRL" = "2015"
    "PLAVE" = "2023"
    "Red Velvet" = "2014"
    "RIIZE" = "2023"
    "SEVENTEEN" = "2015"
    "SHINee" = "2008"
    "STAYC" = "2020"
    "Stray Kids" = "2018"
    "SUPER JUNIOR" = "2005"
    "THE BOYZ" = "2017"
    "TOMORROW X TOGETHER" = "2019"
    "TREASURE" = "2020"
    "東方神起" = "2003"
    "TWICE" = "2015"
    "TWS" = "2024"
    "WayV" = "2019"
    "Weeekly" = "2020"
    "Xdinary Heroes" = "2021"
    "xikers" = "2023"
    "ZEROBASEONE" = "2023"
}

$path = "d:\Data\Antigravity\Neonlight\js\data.js"
# Read as single string
$content = Get-Content -Path $path -Raw -Encoding UTF8

# Regex to find the artists array
# patterns: const artists = [ ... ];
if ($content -match '(?s)(const artists = )(\[.*?\])(;)') {
    $prefix = $matches[1]
    $jsonStr = $matches[2]
    $suffix = $matches[3]
    
    # Parse JSON
    try {
        $artists = $jsonStr | ConvertFrom-Json
        
        # Update
        foreach ($artist in $artists) {
            # Handle case-insensitive match just in case
            $key = $debutDates.Keys | Where-Object { $_ -eq $artist.name } | Select-Object -First 1
            if ($key) {
                # Format: YYYY-01-01
                $artist.debutDate = $debutDates[$key] + "-01-01"
                Write-Host "Updated $($artist.name) to $($artist.debutDate)"
            } else {
                 Write-Host "No debut date found for $($artist.name)" -ForegroundColor Yellow
            }
        }
        
        # Serialize back to JSON
        # Depth 10 to ensure nested objects are preserved
        $newJson = $artists | ConvertTo-Json -Depth 10
        
        # Reconstruct file
        # Regex replacement might be risky if content changed, so we replace carefully based on exact match location?
        # Actually, since we have the parts, we can reconstruct efficiently.
        # But $matches gives us the parts, we need to replace the *matched* text in the file.
        
        # Construct the new declaration
        $newDeclaration = $prefix + $newJson + $suffix
        
        # Replace matches[0] (full match) with newDeclaration
        # Note: -replace uses regex, so we need to be careful.
        # Safer to just split the file by the match indices? PowerShell doesn't give clean indices easily in simple mode.
        
        # Alternate approach: Split by "const artists =" and first "];" after usage.
        # Let's trust the regex replace if we escape the match? 
        # No, replacing a large block with regex is cleaner.
        
        # We will use the simplest string replacement: 
        # Since we extracted exactly what matched, we can try to replace.
        # However, checking if multiple matches exist? No, only one 'const artists ='.
        
        # Let's use substring replacement if possible.
        # Actually, let's just use string replacement on the extracted raw string
        # But JSON formatting might change (indentation), so direct string replace might fail if $jsonStr was parsed.
        
        # We will construct the new file content using the parts before and after the regex match.
        # $content is the full string.
        # We can unfortunately not easily get the index from -match.
        
        # Java/C# style properties in PS:
        $regex = [regex]'(?s)(const artists = )(\[.*?\])(;)'
        $match = $regex.Match($content)
        
        if ($match.Success) {
            $before = $content.Substring(0, $match.Index)
            $after = $content.Substring($match.Index + $match.Length)
            $newFileContent = $before + $newDeclaration + $after
            
            $newFileContent | Out-File -FilePath $path -Encoding utf8
            Write-Host "Successfully updated js/data.js"
        } else {
            Write-Error "Regex match failed to find artists array again."
        }

    } catch {
        Write-Error "JSON Parsing Failed: $_"
    }

} else {
    Write-Error "Could not find 'const artists = [...]' block"
}

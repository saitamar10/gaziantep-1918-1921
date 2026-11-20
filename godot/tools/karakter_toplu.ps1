# Karakter paftasındaki çizimlerden CellCog ile 3B model üretir (sırayla). Anahtar Kullanıcı ortam değişkeninden okunur, yazdırılmaz.
#   powershell -NoProfile -File godot\tools\karakter_toplu.ps1 K02_sehirli_erkek K03_ev_kadini ...
#   powershell -NoProfile -File godot\tools\karakter_toplu.ps1 -Durum      (yalnız hesap durumunu gösterir)
param([switch]$Durum, [Parameter(ValueFromRemainingArguments = $true)][string[]]$Adlar)
$env:CELLCOG_API_KEY = [Environment]::GetEnvironmentVariable('CELLCOG_API_KEY', 'User')
$env:PYTHONIOENCODING = 'utf-8'
$kok = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
if ($Durum) {
    python -c "from cellcog import CellCogClient; s = CellCogClient(agent_provider='claude-code').get_account_status(); print({k: v for k, v in s.items() if k not in ('email', 'api_key', 'user_id')})"
    exit
}
$tanim = @{
    'K02_sehirli_erkek'   = 'Townsman of Aintab, about 30-40, dark jacket and waistcoat over a collarless shirt, sash at the waist, loose trousers (shalwar), red fez, leather shoes.'
    'K03_ev_kadini'       = 'Housewife of Aintab, about 35, long plain dress to the ankles, apron, white headscarf tied under the chin, modest and simple.'
    'K04_cocuk'           = 'Boy of about 10, barefoot or simple shoes, dark blue collarless shirt, wide woven sash, dark loose trousers, short hair.'
    'K05_su_tasiyan_kadin'= 'Woman water carrier, about 30, long dress, patterned headscarf, sleeves rolled, sturdy shoes. No jug in the hands.'
    'K06_hamal'           = 'Porter (hamal), about 40, light coarse shirt, worn waistcoat, baggy trousers, cloth wrapped on the head, padded back-saddle straps. No load.'
    'K07_muzisyen'        = 'Street musician, about 50, dark robe-like coat, sash, fez with a cloth wrapped round it, moustache. No instrument in the hands.'
    'K08_kuvayi_milliye_3gorunus' = 'Kuva-yi Milliye militiaman, about 30, black kalpak cap, embroidered short jacket (cepken), wide shawl sash, crossed cartridge belts, breeches and boots, moustache. No rifle in the hands.'
    'K09_fransiz_piyade'  = 'French infantryman of the Armee du Levant, 1920: horizon-blue or khaki tunic, puttees, ankle boots, Adrian helmet, leather belt with pouches. No rifle in the hands.'
    'K10_fransiz_subayi'  = 'French officer, 1920: kepi, tailored tunic with Sam Browne belt, breeches, tall leather boots, moustache. Hands empty.'
    'K11_genc_kadin'      = 'Young woman of Aintab, about 20, long dress, light headscarf, short embroidered vest, simple shoes.'
    'K12_yasli_kadin'     = 'Elderly woman, about 70, black outer wrap over a dark long dress, dark headscarf, slightly stooped.'
    'K14_yardimci_birlik' = 'Auxiliary soldier attached to the French forces, 1920: khaki tunic and breeches, puttees, soft cap, leather belt. No rifle in the hands.'
}
foreach ($ad in $Adlar) {
    Write-Output ("BASLADI " + $ad + " " + (Get-Date -Format 'HH:mm:ss'))
    python (Join-Path $kok 'godot\tools\karakter_uret.py') $ad $tanim[$ad]
    Write-Output ("BITTI " + $ad + " " + (Get-Date -Format 'HH:mm:ss'))
}

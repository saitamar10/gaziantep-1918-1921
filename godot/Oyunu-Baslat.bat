@echo off
rem Gaziantep 1918-1921 - dusuk ayar (tumlesik ekran karti icin). Oyun icinde F5 kaliteyi degistirir.
set "GODOT=%LOCALAPPDATA%\Microsoft\WinGet\Packages\GodotEngine.GodotEngine_Microsoft.Winget.Source_8wekyb3d8bbwe\Godot_v4.7.2-stable_win64.exe"
if not exist "%GODOT%" (
  echo Godot bulunamadi: %GODOT%
  echo Godot 4.7.2 kurulu olmali ^(winget install GodotEngine.GodotEngine^).
  pause
  exit /b 1
)
rem Klasor yolunun sonundaki ters egik cizgi tirnagi bozmasin diye sonuna nokta eklenir.
start "" "%GODOT%" --path "%~dp0." --fullscreen %*

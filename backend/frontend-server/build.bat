@echo off
echo ========================================
echo    BUILDING FRONTEND SERVER
echo ========================================
echo.

REM Limpar build anterior
if exist "bin\" rmdir /s /q "bin\"
if exist "obj\" rmdir /s /q "obj\"

echo Compilando servidor frontend...
dotnet build --configuration Release

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo    BUILD CONCLUIDO!
    echo ========================================
    echo.
    echo Executavel: bin\Release\net47\suat-frontend-server.exe
    echo.
    echo Para testar:
    echo suat-frontend-server.exe 8080 "caminho\para\build"
    echo.
) else (
    echo.
    echo ❌ ERRO NO BUILD!
    echo.
)

pause


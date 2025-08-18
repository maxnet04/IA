@echo off
echo ========================================
echo    TESTANDO FRONTEND SERVER
echo ========================================
echo.

set SERVER_EXE=bin\Release\net47\suat-frontend-server.exe

if not exist "%SERVER_EXE%" (
    echo ❌ ERRO: Executavel nao encontrado!
    echo Execute: dotnet build --configuration Release
    pause
    exit /b 1
)

echo Testando servidor frontend...
echo.
echo O servidor sera iniciado na porta 8080
echo Acesse: http://localhost:8080
echo.
echo Pressione 'q' no servidor para parar
echo.

"%SERVER_EXE%" 8080 "..\frontend\build"

echo.
echo Teste concluido!
pause


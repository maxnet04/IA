@echo off
echo ========================================
echo    INICIANDO SISTEMA SUAT-IA COMPLETO
echo ========================================
echo.

REM Verificar se executáveis existem
if not exist "integracao\bin\Debug\net47\SuatDatabaseManager.exe" (
    echo ❌ ERRO: Backend nao encontrado!
    echo Compile o projeto integracao primeiro
    pause
    exit /b 1
)

if not exist "frontend-server\bin\Release\net47\suat-frontend-server.exe" (
    echo ❌ ERRO: Servidor frontend nao encontrado!
    echo Compile o projeto frontend-server primeiro
    pause
    exit /b 1
)

if not exist "..\frontend\build\index.html" (
    echo ❌ ERRO: Build do frontend nao encontrado!
    echo Execute: cd ..\frontend && npm run build
    pause
    exit /b 1
)

echo Iniciando componentes do sistema...
echo.

REM Iniciar backend (banco + API)
echo 🚀 Iniciando Backend (Database Manager)...
start "SUAT-IA Backend" "integracao\bin\Debug\net47\SuatDatabaseManager.exe"

REM Aguardar um pouco
timeout /t 3 >nul

REM Iniciar frontend server
echo 🚀 Iniciando Frontend Server...
start "SUAT-IA Frontend" "frontend-server\bin\Release\net47\suat-frontend-server.exe" 8080 "..\frontend\build"

echo.
echo ========================================
echo    SISTEMA INICIADO!
echo ========================================
echo.
echo Backend:  Database Manager + API
echo Frontend: http://localhost:8080
echo.
echo Ambos os componentes estao rodando em janelas separadas
echo Feche as janelas para parar os serviços
echo.
pause



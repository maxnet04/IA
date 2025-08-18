@echo off
echo ========================================
echo    SUAT-IA - ORQUESTRADOR COMPLETO
echo ========================================
echo.

set EXE_PATH=bin\Debug\net47\SuatDatabaseManager.exe

if not exist "%EXE_PATH%" (
    echo ❌ ERRO: Executavel nao encontrado!
    echo Execute: dotnet build
    pause
    exit /b 1
)

echo 🚀 Sistema SUAT-IA Orquestrador Completo
echo.
echo 📦 Componentes gerenciados:
echo   ✅ Database Manager (SQLite + Sincronização)
echo   ✅ Backend API (Node.js - suat-backend.exe)
echo   ✅ Frontend Server (HTTP Server .NET)
echo   ✅ Sistema de Atualizações (UpdateManager)
echo.
echo 🌐 URLs que serão disponibilizadas:
echo   - Frontend:    http://localhost:8080
echo   - Backend API: http://localhost:3000
echo   - Swagger:     http://localhost:3000/api-docs
echo.
echo 🎯 DICA: Use o botão "🚀 INICIAR SISTEMA COMPLETO"
echo          para iniciar tudo automaticamente!
echo.
echo Pressione qualquer tecla para iniciar o orquestrador...
pause

"%EXE_PATH%"

echo.
echo 🛑 Sistema encerrado!
pause

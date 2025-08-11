@echo off
echo ========================================
echo    SUAT Database Manager - Build
echo    .NET Framework 4.7 - Console App
echo ========================================
echo.

:: Definir caminho do MSBuild para Visual Studio 2019 Build Tools
set "MSBUILD_PATH=C:\Program Files (x86)\Microsoft Visual Studio\2019\BuildTools\MSBuild\Current\Bin\MSBuild.exe"

:: Verificar se MSBuild está disponível no caminho específico
if not exist "%MSBUILD_PATH%" (
    echo ❌ MSBuild não encontrado em: %MSBUILD_PATH%
    echo Verificando caminhos alternativos...
    
    :: Tentar caminhos alternativos comuns
    set "MSBUILD_PATH=C:\Program Files (x86)\Microsoft Visual Studio\2019\BuildTools\MSBuild\15.0\Bin\MSBuild.exe"
    if not exist "%MSBUILD_PATH%" (
        set "MSBUILD_PATH=C:\Program Files (x86)\Microsoft Visual Studio\2019\Community\MSBuild\Current\Bin\MSBuild.exe"
    )
    if not exist "%MSBUILD_PATH%" (
        set "MSBUILD_PATH=C:\Program Files (x86)\Microsoft Visual Studio\2019\Professional\MSBuild\Current\Bin\MSBuild.exe"
    )
    if not exist "%MSBUILD_PATH%" (
        set "MSBUILD_PATH=C:\Program Files (x86)\Microsoft Visual Studio\2019\Enterprise\MSBuild\Current\Bin\MSBuild.exe"
    )
    if not exist "%MSBUILD_PATH%" (
        echo ❌ MSBuild não encontrado em nenhum caminho conhecido!
        echo Por favor, verifique a instalação do Visual Studio Build Tools.
        echo Download: https://visualstudio.microsoft.com/downloads/
        pause
        exit /b 1
    )
)

echo ✅ MSBuild encontrado em: %MSBUILD_PATH%
echo.

:: Restaurar dependências NuGet (opcional - pode não ser necessário para projetos simples)
echo 🔄 Verificando dependências NuGet...
nuget restore SuatDatabaseManager.vbproj >nul 2>&1
if errorlevel 1 (
    echo ⚠️  Aviso: Não foi possível restaurar dependências NuGet
    echo    Continuando com a compilação...
)

:: Compilar projeto
echo 🔄 Compilando projeto...
"%MSBUILD_PATH%" SuatDatabaseManager.vbproj /p:Configuration=Release /p:Platform="Any CPU"
if errorlevel 1 (
    echo ❌ Erro na compilação
    pause
    exit /b 1
)

:: Copiar executável para pasta dist
echo 🔄 Preparando distribuição...
if not exist "dist" mkdir dist
copy "bin\Release\SuatDatabaseManager.exe" "dist\" >nul
copy "bin\Release\*.dll" "dist\" >nul

echo.
echo ✅ Build concluído com sucesso!
echo 📁 Executável gerado em: dist\SuatDatabaseManager.exe
echo.
echo Para executar:
echo   cd dist
echo   SuatDatabaseManager.exe
echo.
echo Exemplos de uso:
echo   SuatDatabaseManager.exe connect
echo   SuatDatabaseManager.exe verify
echo   SuatDatabaseManager.exe sync
echo   SuatDatabaseManager.exe query "SELECT COUNT(*) FROM incidents"
echo.

pause

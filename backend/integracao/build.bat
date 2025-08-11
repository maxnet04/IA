@echo off
echo ========================================
echo    SUAT Database Manager - Build
echo    .NET Framework 4.7 - Console App
echo ========================================
echo.

:: Tentar usar dotnet build primeiro (mais moderno e confiável)
echo 🔄 Tentando compilação com dotnet build...
dotnet build --configuration Release
if errorlevel 1 (
    echo ❌ dotnet build falhou, tentando MSBuild...
    
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
    echo 🔄 Compilando projeto com MSBuild...
    "%MSBUILD_PATH%" SuatDatabaseManager.vbproj /p:Configuration=Release /p:Platform="Any CPU"
    if errorlevel 1 (
        echo ❌ Erro na compilação
        pause
        exit /b 1
    )
) else (
    echo ✅ Compilação com dotnet build concluída com sucesso!
)

:: Copiar executável para pasta dist
echo 🔄 Preparando distribuição...
if not exist "dist" mkdir dist

:: Verificar se o executável foi gerado pelo dotnet build
if exist "bin\Release\net47\SuatDatabaseManager.exe" (
    copy "bin\Release\net47\SuatDatabaseManager.exe" "dist\" >nul
    copy "bin\Release\net47\*.dll" "dist\" >nul
    copy "bin\Release\net47\*.config" "dist\" >nul
    
    :: Copiar DLLs nativas do SQLite
    if exist "bin\Release\net47\x64" (
        if not exist "dist\x64" mkdir dist\x64
        copy "bin\Release\net47\x64\*.dll" "dist\x64\" >nul
        echo ✅ DLLs x64 copiadas
    )
    if exist "bin\Release\net47\x86" (
        if not exist "dist\x86" mkdir dist\x86
        copy "bin\Release\net47\x86\*.dll" "dist\x86\" >nul
        echo ✅ DLLs x86 copiadas
    )
    
    echo ✅ Executável copiado de bin\Release\net47\
) else if exist "bin\Release\SuatDatabaseManager.exe" (
    copy "bin\Release\SuatDatabaseManager.exe" "dist\" >nul
    copy "bin\Release\*.dll" "dist\" >nul
    copy "bin\Release\*.config" "dist\" >nul
    
    :: Copiar DLLs nativas do SQLite
    if exist "bin\Release\x64" (
        if not exist "dist\x64" mkdir dist\x64
        copy "bin\Release\x64\*.dll" "dist\x64\" >nul
        echo ✅ DLLs x64 copiadas
    )
    if exist "bin\Release\x86" (
        if not exist "dist\x86" mkdir dist\x86
        copy "bin\Release\x86\*.dll" "dist\x86\" >nul
        echo ✅ DLLs x86 copiadas
    )
    
    echo ✅ Executável copiado de bin\Release\
) else (
    echo ❌ Executável não encontrado!
    echo Verificando pastas disponíveis...
    dir bin\Release\ /s /b | findstr "SuatDatabaseManager.exe"
    pause
    exit /b 1
)

echo.
echo ✅ Build concluído com sucesso!
echo 📁 Executável gerado em: dist\SuatDatabaseManager.exe
echo.

:: Executar testes automáticos
echo ========================================
echo    EXECUTANDO TESTES AUTOMÁTICOS
echo ========================================
echo.

:: Teste 1: Conexão com banco
echo 🔌 Teste 1: Verificando conexão com banco...
"dist\SuatDatabaseManager.exe" connect > test_connect.log 2>&1
if errorlevel 1 (
    echo ❌ Teste de conexão FALHOU
    echo    Verifique o arquivo test_connect.log para detalhes
) else (
    echo ✅ Teste de conexão PASSOU
)

:: Teste 2: Verificação de estrutura
echo 📊 Teste 2: Verificando estrutura do banco...
"dist\SuatDatabaseManager.exe" verify > test_verify.log 2>&1
if errorlevel 1 (
    echo ❌ Teste de verificação FALHOU
    echo    Verifique o arquivo test_verify.log para detalhes
) else (
    echo ✅ Teste de verificação PASSOU
)

:: Teste 3: Query simples
echo 🔍 Teste 3: Executando query de teste...
"dist\SuatDatabaseManager.exe" query "SELECT COUNT(*) as total FROM incidents" > test_query.log 2>&1
if errorlevel 1 (
    echo ❌ Teste de query FALHOU
    echo    Verifique o arquivo test_query.log para detalhes
) else (
    echo ✅ Teste de query PASSOU
)

:: Teste 4: Sincronização (opcional - pode demorar)
echo 🔄 Teste 4: Testando sincronização (opcional)...
echo    Este teste pode demorar alguns segundos...
"dist\SuatDatabaseManager.exe" sync > test_sync.log 2>&1
if errorlevel 1 (
    echo ❌ Teste de sincronização FALHOU
    echo    Verifique o arquivo test_sync.log para detalhes
) else (
    echo ✅ Teste de sincronização PASSOU
)

echo.
echo ========================================
echo    RESUMO DOS TESTES
echo ========================================
echo.
echo Logs de teste salvos em:
echo   - test_connect.log
echo   - test_verify.log
echo   - test_query.log
echo   - test_sync.log
echo.

:: Mostrar resultados dos logs
echo 📋 Últimas linhas dos logs de teste:
echo.
echo --- Conexão ---
if exist test_connect.log (
    powershell "Get-Content test_connect.log | Select-Object -Last 3"
) else (
    echo Log não encontrado
)
echo.

echo --- Verificação ---
if exist test_verify.log (
    powershell "Get-Content test_verify.log | Select-Object -Last 3"
) else (
    echo Log não encontrado
)
echo.

echo --- Query ---
if exist test_query.log (
    powershell "Get-Content test_query.log | Select-Object -Last 3"
) else (
    echo Log não encontrado
)
echo.

echo --- Sincronização ---
if exist test_sync.log (
    powershell "Get-Content test_sync.log | Select-Object -Last 3"
) else (
    echo Log não encontrado
)
echo.

echo ========================================
echo    USO DO SISTEMA
echo ========================================
echo.
echo Para executar manualmente:
echo   cd dist
echo   SuatDatabaseManager.exe
echo.
echo Comandos disponíveis:
echo   SuatDatabaseManager.exe connect
echo   SuatDatabaseManager.exe verify
echo   SuatDatabaseManager.exe sync
echo   SuatDatabaseManager.exe query "SELECT COUNT(*) FROM incidents"
echo   SuatDatabaseManager.exe help
echo.

pause

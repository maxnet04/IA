# Integração do Sistema SUAT-IA com VB.NET WinForms

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Opções de Integração](#opções-de-integração)
3. [Preparação do Sistema](#preparação-do-sistema)
4. [Sistema de Auto-Atualização](#sistema-de-auto-atualização)
5. [Códigos Completos VB.NET](#códigos-completos-vbnet)
6. [Scripts de Build](#scripts-de-build)
7. [Arquitetura de Rede](#arquitetura-de-rede)
8. [Troubleshooting](#troubleshooting)

---

## 🎯 Visão Geral

Este documento detalha como integrar o sistema SUAT-IA (Node.js + React) dentro de uma aplicação VB.NET WinForms usando componentes WebBrowser/WebView2, incluindo sistema de auto-atualização via rede.

### ✅ Características da Solução

- **Não requer Node.js** nas estações cliente
- **Backend compilado** em executável standalone
- **Auto-atualização** via rede
- **Interface moderna** (React) dentro do WinForms
- **Banco de dados local** (SQLite)
- **Distribuição centralizada**

---

## 🔧 Opções de Integração

### 1. WebView2 (Recomendado) 🌟

**Vantagens:**
- Motor Chromium moderno
- Melhor performance
- Suporte completo a JavaScript moderno
- APIs avançadas

**Instalação:**
```xml
<!-- No projeto VB.NET via NuGet -->
<PackageReference Include="Microsoft.Web.WebView2" Version="1.0.2151.40" />
```

**Código VB.NET:**
```vb
Imports Microsoft.Web.WebView2.WinForms

Public Class MainForm
    Private webView As WebView2
    
    Private Sub InitializeWebView()
        webView = New WebView2()
        webView.Dock = DockStyle.Fill
        Me.Controls.Add(webView)
        webView.Source = New Uri("http://localhost:3000")
    End Sub
End Class
```

### 2. WebBrowser Tradicional

**Vantagens:**
- Nativo do .NET Framework
- Não requer instalação adicional

**Desvantagens:**
- Motor IE antigo
- Limitações de JavaScript

**Código VB.NET:**
```vb
Private Sub InitializeWebBrowser()
    WebBrowser1.Navigate("http://localhost:3000")
    
    ' Configurar para IE11 mode (opcional)
    SetWebBrowserFeatures()
End Sub

Private Sub SetWebBrowserFeatures()
    ' Força IE11 mode para melhor compatibilidade
    Dim appName = Process.GetCurrentProcess().ProcessName + ".exe"
    Microsoft.Win32.Registry.SetValue(
        "HKEY_CURRENT_USER\Software\Microsoft\Internet Explorer\Main\FeatureControl\FEATURE_BROWSER_EMULATION",
        appName, 11001, Microsoft.Win32.RegistryValueKind.DWord)
End Sub
```

### 3. CefSharp (Chromium Embedded)

**Vantagens:**
- Motor Chromium completo
- Controle total sobre o browser
- Não depende do Edge WebView2

**Instalação:**
```xml
<PackageReference Include="CefSharp.WinForms" Version="108.4.130" />
```

**Código VB.NET:**
```vb
Imports CefSharp.WinForms

Public Class MainForm
    Private browser As ChromiumWebBrowser
    
    Private Sub InitializeCefSharp()
        Cef.Initialize(New CefSettings())
        browser = New ChromiumWebBrowser("http://localhost:3000")
        browser.Dock = DockStyle.Fill
        Me.Controls.Add(browser)
    End Sub
End Class
```

---

## 🏗️ Preparação do Sistema

### 1. Compilando o Backend (Node.js → EXE)

**Instalar PKG globalmente:**
```bash
npm install -g pkg
```

**Configurar package.json:**
```json
{
  "name": "suat-backend",
  "version": "1.0.0",
  "main": "src/server.js",
  "bin": "src/server.js",
  "pkg": {
    "targets": ["node16-win-x64"],
    "outputPath": "dist",
    "assets": [
      "src/**/*",
      "data/**/*",
      "node_modules/sqlite3/lib/binding/napi-v6-win32-x64/**/*"
    ]
  },
  "scripts": {
    "build": "pkg . --output suat-backend.exe"
  }
}
```

**Executar compilação:**
```bash
cd backend
npm run build
# Resultado: suat-backend.exe (não precisa Node.js para rodar)
```

### 2. Preparando o Frontend (React → Build Estático)

```bash
cd frontend
npm run build
# Resultado: pasta build/ com arquivos estáticos
```

### 3. Estrutura de Arquivos Final

```
Distribuição/
├── MeuAppVB.exe                 (aplicação VB.NET)
├── Microsoft.Web.WebView2.dll   (se usar WebView2)
├── backend/
│   ├── suat-backend.exe         (Node.js compilado)
│   └── data/
│       └── database.sqlite      (banco local)
├── frontend/
│   └── build/                   (React compilado)
│       ├── index.html
│       ├── static/
│       └── ...
└── config.json                 (configurações)
```

---

## 🔄 Sistema de Auto-Atualização

### 1. Estrutura de Versionamento

**Arquivo version.json no servidor:**
```json
{
  "version": "1.2.0",
  "releaseDate": "2024-01-15T10:30:00Z",
  "backend": {
    "version": "1.2.0",
    "file": "suat-backend-v1.2.exe",
    "hash": "abc123def456...",
    "size": 45678901
  },
  "frontend": {
    "version": "1.2.0", 
    "file": "frontend-build-v1.2.zip",
    "hash": "def456abc123...",
    "size": 12345678
  },
  "required": true,
  "changelog": [
    "Correção de bugs na análise preditiva",
    "Melhorias na interface de usuário",
    "Nova funcionalidade de relatórios"
  ],
  "minimumVersion": "1.0.0"
}
```

### 2. Classe UpdateManager (VB.NET)

```vb
Imports System.Net.Http
Imports System.Security.Cryptography
Imports System.IO.Compression
Imports Newtonsoft.Json

Public Class UpdateManager
    Private Const NETWORK_PATH As String = "\\servidor\suat\updates"
    Private Const LOCAL_VERSION_FILE As String = "version.local"
    Private ReadOnly httpClient As New HttpClient()
    
    Public Event ProgressChanged(percentage As Integer, status As String)
    
    Public Async Function VerificarAtualizacoes() As Task(Of UpdateResult)
        Try
            Dim versionFile = Path.Combine(NETWORK_PATH, "version.json")
            
            ' Verificar se servidor está acessível
            If Not Directory.Exists(NETWORK_PATH) Then
                Return New UpdateResult With {
                    .Success = False,
                    .Message = "Servidor de atualizações não acessível"
                }
            End If
            
            ' Ler versão do servidor
            Dim jsonContent = Await File.ReadAllTextAsync(versionFile)
            Dim serverVersion = JsonConvert.DeserializeObject(Of VersionInfo)(jsonContent)
            
            ' Ler versão local
            Dim localVersion = GetLocalVersion()
            
            ' Comparar versões
            If Version.Parse(serverVersion.Version) > Version.Parse(localVersion) Then
                Return New UpdateResult With {
                    .Success = True,
                    .HasUpdate = True,
                    .VersionInfo = serverVersion,
                    .Message = $"Nova versão disponível: {serverVersion.Version}"
                }
            Else
                Return New UpdateResult With {
                    .Success = True,
                    .HasUpdate = False,
                    .Message = "Sistema está atualizado"
                }
            End If
            
        Catch ex As Exception
            Return New UpdateResult With {
                .Success = False,
                .Message = $"Erro ao verificar atualizações: {ex.Message}"
            }
        End Try
    End Function
    
    Public Async Function AplicarAtualizacao(versionInfo As VersionInfo) As Task(Of UpdateResult)
        Try
            RaiseEvent ProgressChanged(0, "Iniciando atualização...")
            
            ' Criar pasta temporária
            Dim tempDir = Path.Combine(Path.GetTempPath(), "suat-update-" & Guid.NewGuid().ToString())
            Directory.CreateDirectory(tempDir)
            
            ' Baixar e verificar backend
            If ShouldUpdateBackend(versionInfo) Then
                RaiseEvent ProgressChanged(10, "Baixando backend...")
                Await BaixarArquivo(
                    Path.Combine(NETWORK_PATH, versionInfo.Backend.File),
                    Path.Combine(tempDir, "suat-backend.exe"),
                    versionInfo.Backend.Hash
                )
            End If
            
            ' Baixar e verificar frontend
            If ShouldUpdateFrontend(versionInfo) Then
                RaiseEvent ProgressChanged(50, "Baixando interface...")
                Dim frontendZip = Path.Combine(tempDir, "frontend.zip")
                Await BaixarArquivo(
                    Path.Combine(NETWORK_PATH, versionInfo.Frontend.File),
                    frontendZip,
                    versionInfo.Frontend.Hash
                )
                
                RaiseEvent ProgressChanged(70, "Extraindo interface...")
                ExtrairFrontend(frontendZip, tempDir)
            End If
            
            RaiseEvent ProgressChanged(80, "Aplicando atualizações...")
            
            ' Parar backend se estiver rodando
            PararBackend()
            
            ' Aplicar arquivos
            AplicarArquivos(tempDir)
            
            ' Atualizar versão local
            SalvarVersaoLocal(versionInfo.Version)
            
            RaiseEvent ProgressChanged(100, "Atualização concluída!")
            
            ' Limpar arquivos temporários
            Directory.Delete(tempDir, True)
            
            Return New UpdateResult With {
                .Success = True,
                .Message = "Atualização aplicada com sucesso"
            }
            
        Catch ex As Exception
            Return New UpdateResult With {
                .Success = False,
                .Message = $"Erro na atualização: {ex.Message}"
            }
        End Try
    End Function
    
    Private Async Function BaixarArquivo(origem As String, destino As String, hashEsperado As String) As Task
        ' Copiar arquivo da rede
        File.Copy(origem, destino, True)
        
        ' Verificar integridade
        If Not VerificarHash(destino, hashEsperado) Then
            Throw New Exception($"Hash do arquivo {Path.GetFileName(destino)} não confere")
        End If
    End Function
    
    Private Function VerificarHash(arquivo As String, hashEsperado As String) As Boolean
        Using sha256 As SHA256 = SHA256.Create()
            Using stream As FileStream = File.OpenRead(arquivo)
                Dim hashBytes = sha256.ComputeHash(stream)
                Dim hashString = BitConverter.ToString(hashBytes).Replace("-", "").ToLower()
                Return hashString = hashEsperado.ToLower()
            End Using
        End Using
    End Function
    
    Private Sub ExtrairFrontend(zipFile As String, tempDir As String)
        Dim frontendDir = Path.Combine(tempDir, "frontend-build")
        ZipFile.ExtractToDirectory(zipFile, frontendDir)
    End Sub
    
    Private Sub AplicarArquivos(tempDir As String)
        ' Backup dos arquivos atuais
        BackupArquivosAtuais()
        
        ' Atualizar backend
        Dim newBackend = Path.Combine(tempDir, "suat-backend.exe")
        If File.Exists(newBackend) Then
            File.Copy(newBackend, Path.Combine(Application.StartupPath, "backend", "suat-backend.exe"), True)
        End If
        
        ' Atualizar frontend
        Dim newFrontend = Path.Combine(tempDir, "frontend-build")
        If Directory.Exists(newFrontend) Then
            Dim targetFrontend = Path.Combine(Application.StartupPath, "frontend", "build")
            
            ' Remover frontend antigo
            If Directory.Exists(targetFrontend) Then
                Directory.Delete(targetFrontend, True)
            End If
            
            ' Copiar novo frontend
            CopiarDiretorio(newFrontend, targetFrontend)
        End If
    End Sub
    
    Private Sub BackupArquivosAtuais()
        Dim backupDir = Path.Combine(Application.StartupPath, "backup", DateTime.Now.ToString("yyyyMMdd-HHmmss"))
        Directory.CreateDirectory(backupDir)
        
        ' Backup backend
        Dim currentBackend = Path.Combine(Application.StartupPath, "backend", "suat-backend.exe")
        If File.Exists(currentBackend) Then
            File.Copy(currentBackend, Path.Combine(backupDir, "suat-backend.exe"))
        End If
        
        ' Backup frontend
        Dim currentFrontend = Path.Combine(Application.StartupPath, "frontend", "build")
        If Directory.Exists(currentFrontend) Then
            CopiarDiretorio(currentFrontend, Path.Combine(backupDir, "frontend-build"))
        End If
    End Sub
    
    Private Sub CopiarDiretorio(origem As String, destino As String)
        Directory.CreateDirectory(destino)
        
        For Each file In Directory.GetFiles(origem, "*", SearchOption.AllDirectories)
            Dim relativePath = Path.GetRelativePath(origem, file)
            Dim targetFile = Path.Combine(destino, relativePath)
            Directory.CreateDirectory(Path.GetDirectoryName(targetFile))
            File.Copy(file, targetFile, True)
        Next
    End Sub
    
    Private Function GetLocalVersion() As String
        Dim versionFile = Path.Combine(Application.StartupPath, LOCAL_VERSION_FILE)
        If File.Exists(versionFile) Then
            Return File.ReadAllText(versionFile).Trim()
        End If
        Return "1.0.0"
    End Function
    
    Private Sub SalvarVersaoLocal(version As String)
        Dim versionFile = Path.Combine(Application.StartupPath, LOCAL_VERSION_FILE)
        File.WriteAllText(versionFile, version)
    End Sub
    
    Private Function ShouldUpdateBackend(versionInfo As VersionInfo) As Boolean
        ' Implementar lógica para verificar se backend precisa ser atualizado
        Return True
    End Function
    
    Private Function ShouldUpdateFrontend(versionInfo As VersionInfo) As Boolean
        ' Implementar lógica para verificar se frontend precisa ser atualizado
        Return True
    End Function
    
    Private Sub PararBackend()
        ' Implementar lógica para parar o processo do backend
        For Each proc In Process.GetProcessesByName("suat-backend")
            proc.Kill()
            proc.WaitForExit(5000)
        Next
    End Sub
End Class

' Classes de apoio
Public Class UpdateResult
    Public Property Success As Boolean
    Public Property HasUpdate As Boolean
    Public Property Message As String
    Public Property VersionInfo As VersionInfo
End Class

Public Class VersionInfo
    Public Property Version As String
    Public Property ReleaseDate As DateTime
    Public Property Backend As FileInfo
    Public Property Frontend As FileInfo
    Public Property Required As Boolean
    Public Property Changelog As String()
    Public Property MinimumVersion As String
End Class

Public Class FileInfo
    Public Property Version As String
    Public Property File As String
    Public Property Hash As String
    Public Property Size As Long
End Class
```

---

## 💻 Códigos Completos VB.NET

### 1. Form Principal com WebView2

```vb
Imports Microsoft.Web.WebView2.WinForms
Imports Microsoft.Web.WebView2.Core

Public Class MainForm
    Private webView As WebView2
    Private backendProcess As Process
    Private httpListener As HttpListener
    Private updateManager As UpdateManager
    
    Private Sub MainForm_Load(sender As Object, e As EventArgs) Handles MyBase.Load
        InitializeComponents()
        CheckForUpdatesAndStart()
    End Sub
    
    Private Sub InitializeComponents()
        ' Configurar WebView2
        webView = New WebView2()
        webView.Dock = DockStyle.Fill
        Me.Controls.Add(webView)
        
        ' Configurar update manager
        updateManager = New UpdateManager()
        AddHandler updateManager.ProgressChanged, AddressOf OnUpdateProgress
    End Sub
    
    Private Async Sub CheckForUpdatesAndStart()
        Try
            lblStatus.Text = "Verificando atualizações..."
            
            Dim updateResult = Await updateManager.VerificarAtualizacoes()
            
            If updateResult.Success AndAlso updateResult.HasUpdate Then
                Dim result = MessageBox.Show(
                    $"Nova versão disponível: {updateResult.VersionInfo.Version}" & vbCrLf &
                    "Deseja atualizar agora?",
                    "Atualização Disponível",
                    MessageBoxButtons.YesNo,
                    MessageBoxIcon.Question
                )
                
                If result = DialogResult.Yes Then
                    Await AplicarAtualizacao(updateResult.VersionInfo)
                    Application.Restart()
                    Return
                End If
            End If
            
            ' Iniciar sistema normalmente
            Await IniciarSistema()
            
        Catch ex As Exception
            MessageBox.Show($"Erro na inicialização: {ex.Message}", "Erro", MessageBoxButtons.OK, MessageBoxIcon.Error)
        End Try
    End Sub
    
    Private Async Function AplicarAtualizacao(versionInfo As VersionInfo) As Task
        Dim progressForm As New ProgressForm()
        progressForm.Show()
        
        Try
            Dim result = Await updateManager.AplicarAtualizacao(versionInfo)
            
            If result.Success Then
                MessageBox.Show("Atualização aplicada com sucesso!", "Sucesso", MessageBoxButtons.OK, MessageBoxIcon.Information)
            Else
                MessageBox.Show($"Erro na atualização: {result.Message}", "Erro", MessageBoxButtons.OK, MessageBoxIcon.Error)
            End If
            
        Finally
            progressForm.Close()
        End Try
    End Function
    
    Private Sub OnUpdateProgress(percentage As Integer, status As String)
        lblStatus.Text = status
        progressBar.Value = percentage
    End Sub
    
    Private Async Function IniciarSistema() As Task
        Try
            lblStatus.Text = "Iniciando backend..."
            IniciarBackend()
            
            lblStatus.Text = "Iniciando servidor web..."
            IniciarServidorWeb()
            
            ' Aguardar inicialização
            Await Task.Delay(3000)
            
            lblStatus.Text = "Carregando interface..."
            webView.Source = New Uri("http://localhost:8080")
            
            lblStatus.Text = "Sistema iniciado com sucesso"
            
        Catch ex As Exception
            MessageBox.Show($"Erro ao iniciar sistema: {ex.Message}", "Erro", MessageBoxButtons.OK, MessageBoxIcon.Error)
        End Try
    End Function
    
    Private Sub IniciarBackend()
        Dim backendPath = Path.Combine(Application.StartupPath, "backend", "suat-backend.exe")
        
        If Not File.Exists(backendPath) Then
            Throw New FileNotFoundException("Backend não encontrado: " & backendPath)
        End If
        
        backendProcess = New Process()
        backendProcess.StartInfo.FileName = backendPath
        backendProcess.StartInfo.WorkingDirectory = Path.GetDirectoryName(backendPath)
        backendProcess.StartInfo.UseShellExecute = False
        backendProcess.StartInfo.CreateNoWindow = True
        backendProcess.StartInfo.WindowStyle = ProcessWindowStyle.Hidden
        backendProcess.Start()
    End Sub
    
    Private Sub IniciarServidorWeb()
        httpListener = New HttpListener()
        httpListener.Prefixes.Add("http://localhost:8080/")
        httpListener.Start()
        
        Task.Run(AddressOf ProcessarRequisicoes)
    End Sub
    
    Private Sub ProcessarRequisicoes()
        While httpListener.IsListening
            Try
                Dim context = httpListener.GetContext()
                Dim request = context.Request
                Dim response = context.Response
                
                Dim url = request.Url.AbsolutePath
                If url = "/" Then url = "/index.html"
                
                Dim filePath = Path.Combine(Application.StartupPath, "frontend", "build", url.TrimStart("/"c))
                
                If File.Exists(filePath) Then
                    Dim fileBytes = File.ReadAllBytes(filePath)
                    response.ContentType = GetContentType(Path.GetExtension(filePath))
                    response.ContentLength64 = fileBytes.Length
                    response.OutputStream.Write(fileBytes, 0, fileBytes.Length)
                Else
                    ' Tentar servir index.html para SPA routing
                    Dim indexPath = Path.Combine(Application.StartupPath, "frontend", "build", "index.html")
                    If File.Exists(indexPath) Then
                        Dim indexBytes = File.ReadAllBytes(indexPath)
                        response.ContentType = "text/html"
                        response.ContentLength64 = indexBytes.Length
                        response.OutputStream.Write(indexBytes, 0, indexBytes.Length)
                    Else
                        response.StatusCode = 404
                    End If
                End If
                
                response.Close()
                
            Catch
                ' Ignorar erros de conexão
            End Try
        End While
    End Sub
    
    Private Function GetContentType(extension As String) As String
        Select Case extension.ToLower()
            Case ".html"
                Return "text/html; charset=utf-8"
            Case ".css"
                Return "text/css"
            Case ".js"
                Return "application/javascript"
            Case ".json"
                Return "application/json"
            Case ".png"
                Return "image/png"
            Case ".jpg", ".jpeg"
                Return "image/jpeg"
            Case ".gif"
                Return "image/gif"
            Case ".svg"
                Return "image/svg+xml"
            Case ".ico"
                Return "image/x-icon"
            Case ".woff", ".woff2"
                Return "font/woff"
            Case ".ttf"
                Return "font/ttf"
            Case Else
                Return "application/octet-stream"
        End Select
    End Function
    
    Private Sub MainForm_FormClosing(sender As Object, e As FormClosingEventArgs) Handles MyBase.FormClosing
        ' Finalizar processos
        If backendProcess IsNot Nothing AndAlso Not backendProcess.HasExited Then
            backendProcess.Kill()
            backendProcess.WaitForExit(5000)
        End If
        
        If httpListener IsNot Nothing AndAlso httpListener.IsListening Then
            httpListener.Stop()
        End If
    End Sub
    
    ' Menu para verificação manual de atualizações
    Private Async Sub menuVerificarUpdate_Click(sender As Object, e As EventArgs) Handles menuVerificarUpdate.Click
        Dim result = Await updateManager.VerificarAtualizacoes()
        
        If result.HasUpdate Then
            CheckForUpdatesAndStart()
        Else
            MessageBox.Show("Sistema está atualizado", "Verificação", MessageBoxButtons.OK, MessageBoxIcon.Information)
        End If
    End Sub
End Class
```

### 2. Form de Progresso

```vb
Public Class ProgressForm
    Public Sub SetProgress(percentage As Integer, status As String)
        If Me.InvokeRequired Then
            Me.Invoke(Sub() SetProgress(percentage, status))
            Return
        End If
        
        progressBar.Value = Math.Min(100, Math.Max(0, percentage))
        lblStatus.Text = status
        Me.Refresh()
    End Sub
End Class
```

---

## 🚀 Scripts de Build

### 1. Script PowerShell para Build Completo

```powershell
# build-release.ps1

param(
    [string]$Version = (Get-Date -Format "yyyy.MM.dd.HHmm"),
    [string]$OutputDir = ".\dist",
    [switch]$SkipBackend,
    [switch]$SkipFrontend
)

Write-Host "🔄 Iniciando build para distribuição..." -ForegroundColor Green
Write-Host "📋 Versão: $Version" -ForegroundColor Yellow

# Criar diretório de saída
if (Test-Path $OutputDir) {
    Remove-Item $OutputDir -Recurse -Force
}
New-Item -ItemType Directory -Path $OutputDir | Out-Null

# Build Backend
if (-not $SkipBackend) {
    Write-Host "📦 Compilando backend..." -ForegroundColor Cyan
    Set-Location "backend"
    
    # Instalar dependências se necessário
    if (-not (Test-Path "node_modules")) {
        npm install
    }
    
    # Compilar com PKG
    npx pkg . --targets node16-win-x64 --output "../$OutputDir/suat-backend.exe"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Backend compilado com sucesso" -ForegroundColor Green
    } else {
        Write-Host "❌ Erro na compilação do backend" -ForegroundColor Red
        exit 1
    }
    
    Set-Location ".."
}

# Build Frontend
if (-not $SkipFrontend) {
    Write-Host "🎨 Compilando frontend..." -ForegroundColor Cyan
    Set-Location "frontend"
    
    # Instalar dependências se necessário
    if (-not (Test-Path "node_modules")) {
        npm install
    }
    
    # Build para produção
    npm run build
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Frontend compilado com sucesso" -ForegroundColor Green
        
        # Copiar build para diretório de saída
        Copy-Item "build" "../$OutputDir/frontend-build" -Recurse
        
        # Criar ZIP do frontend
        $frontendZip = "../$OutputDir/frontend-build-v$Version.zip"
        Compress-Archive -Path "build\*" -DestinationPath $frontendZip
        
    } else {
        Write-Host "❌ Erro na compilação do frontend" -ForegroundColor Red
        exit 1
    }
    
    Set-Location ".."
}

# Criar estrutura de atualização
Write-Host "📋 Criando pacote de atualização..." -ForegroundColor Cyan

# Calcular hashes
$backendFile = "$OutputDir\suat-backend.exe"
$frontendZip = "$OutputDir\frontend-build-v$Version.zip"

$backendHash = ""
$backendSize = 0
if (Test-Path $backendFile) {
    $backendHash = (Get-FileHash $backendFile -Algorithm SHA256).Hash.ToLower()
    $backendSize = (Get-Item $backendFile).Length
}

$frontendHash = ""
$frontendSize = 0
if (Test-Path $frontendZip) {
    $frontendHash = (Get-FileHash $frontendZip -Algorithm SHA256).Hash.ToLower()
    $frontendSize = (Get-Item $frontendZip).Length
}

# Criar version.json
$versionInfo = @{
    version = $Version
    releaseDate = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ssZ")
    backend = @{
        version = $Version
        file = "suat-backend.exe"
        hash = $backendHash
        size = $backendSize
    }
    frontend = @{
        version = $Version
        file = "frontend-build-v$Version.zip"
        hash = $frontendHash
        size = $frontendSize
    }
    required = $false
    changelog = @(
        "Atualização automática gerada em $(Get-Date -Format 'dd/MM/yyyy HH:mm')"
    )
    minimumVersion = "1.0.0"
}

$versionJson = $versionInfo | ConvertTo-Json -Depth 3
$versionJson | Out-File "$OutputDir\version.json" -Encoding UTF8

Write-Host "✅ Build concluído!" -ForegroundColor Green
Write-Host "📁 Arquivos gerados em: $OutputDir" -ForegroundColor Yellow

# Listar arquivos gerados
Get-ChildItem $OutputDir | ForEach-Object {
    $size = if ($_.PSIsContainer) { "DIR" } else { "{0:N0} bytes" -f $_.Length }
    Write-Host "   $($_.Name) - $size" -ForegroundColor Gray
}
```

### 2. Script Batch Simplificado

```batch
@echo off
echo 🔄 Build automatizado do SUAT-IA
echo.

:: Verificar se Node.js está instalado
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js não encontrado. Instale o Node.js primeiro.
    pause
    exit /b 1
)

:: Criar diretório de distribuição
if exist "dist" rmdir /s /q "dist"
mkdir "dist"

:: Build Backend
echo 📦 Compilando backend...
cd backend
call npm install
call npx pkg . --targets node16-win-x64 --output "../dist/suat-backend.exe"
if errorlevel 1 (
    echo ❌ Erro na compilação do backend
    pause
    exit /b 1
)
cd ..

:: Build Frontend
echo 🎨 Compilando frontend...
cd frontend
call npm install
call npm run build
if errorlevel 1 (
    echo ❌ Erro na compilação do frontend
    pause
    exit /b 1
)
xcopy /e /i "build" "..\dist\frontend-build"
cd ..

echo ✅ Build concluído em dist/
pause
```

---

## 🌐 Arquitetura de Rede

### 1. Estrutura de Servidor

```
\\servidor\suat\
├── updates/                    (pasta de atualizações)
│   ├── version.json           (versão atual)
│   ├── suat-backend.exe       (backend atual)
│   ├── frontend-build-v1.2.zip
│   └── archive/               (versões antigas)
├── config/                    (configurações globais)
│   ├── database-config.json
│   └── app-settings.json
├── logs/                      (logs centralizados)
└── backup/                    (backups)
```

### 2. Configuração de Permissões

```powershell
# Script para configurar permissões na pasta de rede
$sharePath = "\\servidor\suat"

# Dar permissão de leitura para todos os usuários
icacls $sharePath /grant "Domain Users:(R)"

# Dar permissão total para administradores
icacls $sharePath /grant "Administrators:(F)"

# Configurar pasta de updates como somente leitura para usuários
icacls "$sharePath\updates" /grant "Domain Users:(R)"
```

### 3. Configuração de Banco Centralizado (Opcional)

```json
// config/database-config.json
{
  "mode": "centralized",
  "path": "\\\\servidor\\suat\\database\\shared.sqlite",
  "backup": {
    "enabled": true,
    "interval": "daily",
    "retention": 30
  },
  "sync": {
    "enabled": false
  }
}
```

---

## 🔧 Troubleshooting

### 1. Problemas Comuns

**Erro: "Node.js não encontrado"**
```vb
' Verificar se o executável foi compilado corretamente
If Not File.Exists("backend\suat-backend.exe") Then
    MessageBox.Show("Backend não compilado. Execute o build primeiro.")
End If
```

**Erro: "Porta já em uso"**
```vb
' Verificar portas disponíveis
Private Function EncontrarPortaDisponivel() As Integer
    For port = 8080 To 8090
        Try
            Dim listener = New TcpListener(IPAddress.Loopback, port)
            listener.Start()
            listener.Stop()
            Return port
        Catch
            Continue For
        End Try
    Next
    Throw New Exception("Nenhuma porta disponível")
End Function
```

**Erro: "WebView2 não inicializa"**
```vb
' Verificar se WebView2 Runtime está instalado
Private Async Function VerificarWebView2() As Task(Of Boolean)
    Try
        Dim version = CoreWebView2Environment.GetAvailableBrowserVersionString()
        Return Not String.IsNullOrEmpty(version)
    Catch
        Return False
    End Try
End Function
```

### 2. Logs e Diagnósticos

```vb
Public Class DiagnosticManager
    Private Shared ReadOnly logPath As String = Path.Combine(Application.StartupPath, "logs")
    
    Public Shared Sub Log(message As String, Optional level As String = "INFO")
        Try
            If Not Directory.Exists(logPath) Then
                Directory.CreateDirectory(logPath)
            End If
            
            Dim logFile = Path.Combine(logPath, $"app-{DateTime.Now:yyyy-MM-dd}.log")
            Dim logEntry = $"[{DateTime.Now:yyyy-MM-dd HH:mm:ss}] [{level}] {message}"
            
            File.AppendAllText(logFile, logEntry & Environment.NewLine)
        Catch
            ' Ignorar erros de log
        End Try
    End Sub
    
    Public Shared Function GerarRelatorioSistema() As String
        Dim sb As New StringBuilder()
        
        sb.AppendLine("=== RELATÓRIO DE DIAGNÓSTICO ===")
        sb.AppendLine($"Data: {DateTime.Now}")
        sb.AppendLine($"Versão: {GetLocalVersion()}")
        sb.AppendLine($"OS: {Environment.OSVersion}")
        sb.AppendLine($"Framework: {Environment.Version}")
        sb.AppendLine()
        
        ' Verificar arquivos
        sb.AppendLine("=== ARQUIVOS ===")
        sb.AppendLine($"Backend: {File.Exists("backend\suat-backend.exe")}")
        sb.AppendLine($"Frontend: {Directory.Exists("frontend\build")}")
        sb.AppendLine($"Database: {File.Exists("backend\data\database.sqlite")}")
        sb.AppendLine()
        
        ' Verificar processos
        sb.AppendLine("=== PROCESSOS ===")
        For Each proc In Process.GetProcessesByName("suat-backend")
            sb.AppendLine($"Backend PID: {proc.Id}")
        Next
        
        Return sb.ToString()
    End Function
End Class
```

### 3. Recovery e Rollback

```vb
Public Class RecoveryManager
    Public Shared Function RestaurarVersaoAnterior() As Boolean
        Try
            Dim backupDir = Directory.GetDirectories(
                Path.Combine(Application.StartupPath, "backup")
            ).OrderByDescending(Function(d) d).FirstOrDefault()
            
            If String.IsNullOrEmpty(backupDir) Then
                Return False
            End If
            
            ' Restaurar backend
            Dim backupBackend = Path.Combine(backupDir, "suat-backend.exe")
            If File.Exists(backupBackend) Then
                File.Copy(backupBackend, "backend\suat-backend.exe", True)
            End If
            
            ' Restaurar frontend
            Dim backupFrontend = Path.Combine(backupDir, "frontend-build")
            If Directory.Exists(backupFrontend) Then
                If Directory.Exists("frontend\build") Then
                    Directory.Delete("frontend\build", True)
                End If
                CopiarDiretorio(backupFrontend, "frontend\build")
            End If
            
            Return True
            
        Catch ex As Exception
            DiagnosticManager.Log($"Erro no rollback: {ex.Message}", "ERROR")
            Return False
        End Try
    End Function
End Class
```

---

## 📚 Recursos Adicionais

### 1. Dependências NuGet Necessárias

```xml
<PackageReference Include="Microsoft.Web.WebView2" Version="1.0.2151.40" />
<PackageReference Include="Newtonsoft.Json" Version="13.0.3" />
<PackageReference Include="System.Net.Http" Version="4.3.4" />
```

### 2. Configurações de Projeto

```xml
<!-- No arquivo .vbproj -->
<PropertyGroup>
  <UseWindowsForms>true</UseWindowsForms>
  <TargetFramework>net6.0-windows</TargetFramework>
  <PublishSingleFile>true</PublishSingleFile>
  <SelfContained>true</SelfContained>
  <RuntimeIdentifier>win-x64</RuntimeIdentifier>
</PropertyGroup>
```

### 3. Scripts de Publicação

```powershell
# publish-vbnet.ps1
dotnet publish -c Release -r win-x64 --self-contained true -p:PublishSingleFile=true
```

---

Este documento fornece uma base completa para integrar o sistema SUAT-IA com VB.NET WinForms, incluindo sistema de auto-atualização robusto e distribuição via rede. A solução permite que as estações cliente não precisem ter Node.js instalado e se mantenham sempre atualizadas automaticamente. 
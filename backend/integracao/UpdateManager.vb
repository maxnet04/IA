Imports System.Net.Http
Imports System.Security.Cryptography
Imports System.IO.Compression
Imports Newtonsoft.Json
Imports System.IO
Imports System.Diagnostics
Imports System.Windows.Forms

''' <summary>
''' Gerenciador de atualizações automáticas para o sistema SUAT-IA
''' Compatível com .NET Framework 4.7
''' </summary>
Public Class UpdateManager
    Private Const NETWORK_PATH As String = "\\servidor\suat\updates"
    Private Const LOCAL_VERSION_FILE As String = "version.local"
    Private ReadOnly httpClient As New HttpClient()
    
    Public Event ProgressChanged(percentage As Integer, status As String)
    
    ''' <summary>
    ''' Verifica se há atualizações disponíveis no servidor
    ''' </summary>
    Public Function VerificarAtualizacoes() As Task(Of UpdateResult)
        Try
            ' Para testes, vamos simular um servidor local
            Dim versionFile = Path.Combine(Application.StartupPath, "updates", "version.json")
            
            ' Verificar se arquivo de versão existe
            If Not File.Exists(versionFile) Then
                Return Task.FromResult(New UpdateResult With {
                    .Success = False,
                    .Message = "Arquivo de versão não encontrado"
                })
            End If
            
            ' Ler versão do servidor
            Dim jsonContent = File.ReadAllText(versionFile)
            Dim serverVersion = JsonConvert.DeserializeObject(Of VersionInfo)(jsonContent)


            ' Ler versão local
            Dim localVersion = GetLocalVersion()
            
            ' Comparar versões
            If Version.Parse(serverVersion.Version) > Version.Parse(localVersion) Then
                Return Task.FromResult(New UpdateResult With {
                    .Success = True,
                    .HasUpdate = True,
                    .VersionInfo = serverVersion,
                    .Message = $"Nova versão disponível: {serverVersion.Version}"
                })
            Else
                Return Task.FromResult(New UpdateResult With {
                    .Success = True,
                    .HasUpdate = False,
                    .Message = "Sistema está atualizado"
                })
            End If
            
        Catch ex As Exception
            Return Task.FromResult(New UpdateResult With {
                .Success = False,
                .Message = $"Erro ao verificar atualizações: {ex.Message}"
            })
        End Try
    End Function
    
    ''' <summary>
    ''' Aplica uma atualização baixada
    ''' </summary>
    Public Async Function AplicarAtualizacao(versionInfo As VersionInfo) As Task(Of UpdateResult)
        Try
            RaiseEvent ProgressChanged(0, "Iniciando atualização...")
            
            ' Criar pasta temporária
            Dim tempDir = Path.Combine(Path.GetTempPath(), "suat-update-" & Guid.NewGuid().ToString())
            Directory.CreateDirectory(tempDir)
            
            ' Para testes, vamos simular o download de arquivos
            RaiseEvent ProgressChanged(10, "Baixando backend...")
            Await SimularDownloadBackend(versionInfo, tempDir)
            
            RaiseEvent ProgressChanged(30, "Baixando interface...")
            Await SimularDownloadFrontend(versionInfo, tempDir)
            
            ' Verificar se é primeira instalação para baixar banco de dados
            If IsPrimeiraInstalacao() Then
                RaiseEvent ProgressChanged(50, "Baixando banco de dados (primeira instalação)...")
                Await SimularDownloadDatabase(versionInfo, tempDir)
            Else
                RaiseEvent ProgressChanged(50, "Pulando download do banco (já existe)...")
            End If
            
            RaiseEvent ProgressChanged(70, "Extraindo arquivos...")
            ExtrairFrontend(Path.Combine(tempDir, "frontend.zip"), tempDir)
            
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
    
    ''' <summary>
    ''' Simula o download do backend (para testes)
    ''' </summary>
    Private Async Function SimularDownloadBackend(versionInfo As VersionInfo, tempDir As String) As Task
        ' Simular delay de download
        Await Task.Delay(2000)
        
        ' Criar arquivo de backend simulado
        Dim backendFile = Path.Combine(tempDir, "suat-backend.exe")
        File.WriteAllText(backendFile, "Backend simulado para testes - Versão " & versionInfo.Version)
    End Function
    
    ''' <summary>
    ''' Simula o download do frontend (para testes)
    ''' </summary>
    Private Async Function SimularDownloadFrontend(versionInfo As VersionInfo, tempDir As String) As Task
        ' Simular delay de download
        Await Task.Delay(3000)
        
        ' Criar arquivo ZIP simulado
        Dim frontendZip = Path.Combine(tempDir, "frontend.zip")
        Using archive As ZipArchive = ZipFile.Open(frontendZip, ZipArchiveMode.Create)
            ' Adicionar arquivos simulados
            Dim entry = archive.CreateEntry("index.html")
            Using writer As New StreamWriter(entry.Open())
                writer.Write("<html><body><h1>Frontend Simulado - Versão " & versionInfo.Version & "</h1></body></html>")
            End Using
        End Using
    End Function
    
    ''' <summary>
    ''' Verifica se é a primeira instalação baseado na existência do banco de dados
    ''' </summary>
    Private Function IsPrimeiraInstalacao() As Boolean
        Try
            ' Verificar se o banco de dados existe
            Dim databasePath = Path.Combine(Application.StartupPath, "data", "database.sqlite")
            Return Not File.Exists(databasePath)
        Catch ex As Exception
            ' Em caso de erro, assumir que é primeira instalação
            Return True
        End Try
    End Function
    
    ''' <summary>
    ''' Simula o download do banco de dados (para testes)
    ''' </summary>
    Private Async Function SimularDownloadDatabase(versionInfo As VersionInfo, tempDir As String) As Task
        ' Simular delay de download
        Await Task.Delay(2000)
        
        ' Criar banco de dados simulado
        Dim databaseFile = Path.Combine(tempDir, "database.sqlite")
        
        ' Simular criação de um banco SQLite básico
        Using connection As New System.Data.SQLite.SQLiteConnection($"Data Source={databaseFile};Version=3;")
            connection.Open()
            
            ' Criar tabelas básicas
            Using cmd As New System.Data.SQLite.SQLiteCommand(connection)
                ' Tabela de incidentes
                cmd.CommandText = "
                    CREATE TABLE IF NOT EXISTS incidents (
                        id TEXT PRIMARY KEY,
                        assunto TEXT,
                        departamento TEXT,
                        grupo_direcionado TEXT,
                        categoria TEXT,
                        prioridade TEXT,
                        data_criacao TEXT,
                        data_encerramento TEXT
                    )"
                cmd.ExecuteNonQuery()
                
                ' Tabela de dados históricos
                cmd.CommandText = "
                    CREATE TABLE IF NOT EXISTS historical_data (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        group_name TEXT,
                        date TEXT,
                        volume INTEGER,
                        category TEXT,
                        priority TEXT,
                        resolution_time REAL
                    )"
                cmd.ExecuteNonQuery()
                
                ' Inserir alguns dados de exemplo
                cmd.CommandText = "
                    INSERT INTO incidents (id, assunto, departamento, grupo_direcionado, categoria, prioridade, data_criacao) 
                    VALUES ('INC001', 'Banco inicial - Versão " & versionInfo.Version & "', 'TI', 'Suporte Técnico', 'Software', 'Média', datetime('now'))"
                cmd.ExecuteNonQuery()
            End Using
        End Using
        
        Console.WriteLine($"   ✅ Banco de dados simulado criado: {databaseFile}")
    End Function
    
    ''' <summary>
    ''' Extrai o frontend do arquivo ZIP
    ''' </summary>
    Private Sub ExtrairFrontend(zipFile As String, tempDir As String)
        Dim frontendDir = Path.Combine(tempDir, "frontend-build")
        System.IO.Compression.ZipFile.ExtractToDirectory(zipFile, frontendDir)
    End Sub
    
    ''' <summary>
    ''' Aplica os arquivos baixados
    ''' </summary>
    Private Sub AplicarArquivos(tempDir As String)
        ' Backup dos arquivos atuais
        BackupArquivosAtuais()
        
        ' Atualizar backend
        Dim newBackend = Path.Combine(tempDir, "suat-backend.exe")
        If File.Exists(newBackend) Then
            Dim targetBackend = Path.Combine(Application.StartupPath, "backend", "suat-backend.exe")
            Directory.CreateDirectory(Path.GetDirectoryName(targetBackend))
            System.IO.File.Copy(newBackend, targetBackend, True)
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
        
        ' Aplicar banco de dados apenas na primeira instalação
        If IsPrimeiraInstalacao() Then
            Dim newDatabase = Path.Combine(tempDir, "database.sqlite")
            If File.Exists(newDatabase) Then
                Dim targetDatabase = Path.Combine(Application.StartupPath, "data", "database.sqlite")
                Directory.CreateDirectory(Path.GetDirectoryName(targetDatabase))
                System.IO.File.Copy(newDatabase, targetDatabase, True)
                Console.WriteLine($"   ✅ Banco de dados aplicado: {targetDatabase}")
            End If
        Else
            Console.WriteLine($"   ℹ️ Banco de dados preservado (já existe)")
        End If
    End Sub
    
    ''' <summary>
    ''' Faz backup dos arquivos atuais
    ''' </summary>
    Private Sub BackupArquivosAtuais()
        Dim backupDir = Path.Combine(Application.StartupPath, "backup", DateTime.Now.ToString("yyyyMMdd-HHmmss"))
        Directory.CreateDirectory(backupDir)
        
        ' Backup backend
        Dim currentBackend = Path.Combine(Application.StartupPath, "backend", "suat-backend.exe")
        If File.Exists(currentBackend) Then
            Directory.CreateDirectory(Path.GetDirectoryName(Path.Combine(backupDir, "suat-backend.exe")))
            System.IO.File.Copy(currentBackend, Path.Combine(backupDir, "suat-backend.exe"))
        End If
        
        ' Backup frontend
        Dim currentFrontend = Path.Combine(Application.StartupPath, "frontend", "build")
        If Directory.Exists(currentFrontend) Then
            CopiarDiretorio(currentFrontend, Path.Combine(backupDir, "frontend-build"))
        End If
    End Sub
    
    ''' <summary>
    ''' Copia um diretório recursivamente
    ''' </summary>
    Private Sub CopiarDiretorio(origem As String, destino As String)
        Directory.CreateDirectory(destino)
        
        For Each file In Directory.GetFiles(origem, "*", SearchOption.AllDirectories)
            Dim relativePath = GetRelativePath(origem, file)
            Dim targetFile = Path.Combine(destino, relativePath)
            Directory.CreateDirectory(Path.GetDirectoryName(targetFile))
            System.IO.File.Copy(file, targetFile, True)
        Next
    End Sub
    
    ''' <summary>
    ''' Obtém o caminho relativo entre dois caminhos
    ''' </summary>
    Private Function GetRelativePath(basePath As String, fullPath As String) As String
        Dim baseUri As New Uri(basePath & "\")
        Dim fullUri As New Uri(fullPath)
        Dim relativeUri = baseUri.MakeRelativeUri(fullUri)
        Return Uri.UnescapeDataString(relativeUri.ToString()).Replace("/"c, "\"c)
    End Function
    
    ''' <summary>
    ''' Obtém a versão local
    ''' </summary>
    Private Function GetLocalVersion() As String
        Dim versionFile = Path.Combine(Application.StartupPath, LOCAL_VERSION_FILE)
        If File.Exists(versionFile) Then
            Return File.ReadAllText(versionFile).Trim()
        End If
        Return "1.0.0"
    End Function
    
    ''' <summary>
    ''' Salva a versão local
    ''' </summary>
    Private Sub SalvarVersaoLocal(version As String)
        Dim versionFile = Path.Combine(Application.StartupPath, LOCAL_VERSION_FILE)
        File.WriteAllText(versionFile, version)
    End Sub
    
    ''' <summary>
    ''' Para o processo do backend
    ''' </summary>
    Private Sub PararBackend()
        For Each proc In Process.GetProcessesByName("suat-backend")
            Try
                proc.Kill()
                proc.WaitForExit(5000)
            Catch
                ' Ignorar erros ao finalizar processo
            End Try
        Next
    End Sub
    
    ''' <summary>
    ''' Cria arquivo de versão simulado para testes
    ''' </summary>
    Public Sub CriarArquivoVersaoTeste()
        Dim updatesDir = Path.Combine(Application.StartupPath, "updates")
        Directory.CreateDirectory(updatesDir)
        
        Dim versionInfo As New VersionInfo With {
            .Version = "1.2.0",
            .ReleaseDate = DateTime.Now,
            .Backend = New FileInfo With {
                .Version = "1.2.0",
                .File = "suat-backend.exe",
                .Hash = "abc123def456",
                .Size = 45678901
            },
            .Frontend = New FileInfo With {
                .Version = "1.2.0",
                .File = "frontend-build-v1.2.zip",
                .Hash = "def456abc123",
                .Size = 12345678
            },
            .Database = New FileInfo With {
                .Version = "1.2.0",
                .File = "database.sqlite",
                .Hash = "db123hash456",
                .Size = 1024000
            },
            .Required = False,
            .Changelog = {"Correção de bugs na análise preditiva", "Melhorias na interface de usuário", "Nova funcionalidade de relatórios", "Banco de dados incluído na primeira instalação"},
            .MinimumVersion = "1.0.0"
        }
        
        Dim json = JsonConvert.SerializeObject(versionInfo, Formatting.Indented)
        File.WriteAllText(Path.Combine(updatesDir, "version.json"), json)
    End Sub
End Class

' --- Classes de Apoio ---

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
    Public Property Database As FileInfo
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

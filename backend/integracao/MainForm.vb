Imports System.IO
Imports System.Net
Imports System.Diagnostics
Imports System.Threading.Tasks
Imports System.Windows.Forms
Imports System.Drawing

''' <summary>
''' Formulário principal da aplicação SUAT-IA
''' Implementa o plano de execução para nova instalação
''' Compatível com .NET Framework 4.7
''' </summary>
Public Class MainForm
    Inherits Form
    
    ' --- Controles da UI ---
    Private lblStatus As Label
    Private progressBar As ProgressBar
    Private btnVerificarUpdate As Button
    Private btnCargaInicial As Button
    Private btnCargaIncremental As Button
    Private btnSincronizacaoInteligente As Button
    Private btnCriarVersaoTeste As Button
    Private btnIniciarFrontend As Button
    Private btnPararFrontend As Button
    Private btnAbrirBrowser As Button
    Private lblFrontendStatus As Label
    Private btnIniciarBackend As Button
    Private btnPararBackend As Button
    Private btnHealthCheck As Button
    Private btnAbrirSwagger As Button
    Private lblBackendStatus As Label
    Private txtLog As TextBox
    
    ' --- Gerenciadores de Lógica ---
    Private updateManager As UpdateManager
    Private sincronizador As SincronizadorDados
    Private frontendServer As FrontendHttpServer
    Private backendApiManager As BackendApiManager
    
    ' --- Constantes ---
    Private Const LOCAL_VERSION_FILE As String = "version.local"
    
    ''' <summary>
    ''' Construtor do formulário
    ''' </summary>
    Public Sub New()
        InitializeComponent()
        InitializeManagers()
    End Sub
    
    ''' <summary>
    ''' Inicializa os componentes da interface
    ''' </summary>
    Private Sub InitializeComponent()
        Me.Text = "SUAT-IA - Sistema de Integração"
        Me.Size = New Size(800, 600)
        Me.StartPosition = FormStartPosition.CenterScreen
        Me.FormBorderStyle = FormBorderStyle.FixedSingle
        Me.MaximizeBox = False
        
        ' Label de status
        lblStatus = New Label()
        lblStatus.Text = "Sistema pronto"
        lblStatus.Location = New Point(20, 20)
        lblStatus.Size = New Size(760, 25)
        lblStatus.Font = New Font("Segoe UI", 10, FontStyle.Bold)
        Me.Controls.Add(lblStatus)
        
        ' Progress bar
        progressBar = New ProgressBar()
        progressBar.Location = New Point(20, 50)
        progressBar.Size = New Size(760, 25)
        progressBar.Style = ProgressBarStyle.Continuous
        Me.Controls.Add(progressBar)
        
        ' Botões
        btnVerificarUpdate = New Button()
        btnVerificarUpdate.Text = "Verificar Atualizações"
        btnVerificarUpdate.Location = New Point(20, 90)
        btnVerificarUpdate.Size = New Size(150, 35)
        btnVerificarUpdate.Font = New Font("Segoe UI", 9)
        AddHandler btnVerificarUpdate.Click, AddressOf btnVerificarUpdate_Click
        Me.Controls.Add(btnVerificarUpdate)
        
        btnCargaInicial = New Button()
        btnCargaInicial.Text = "Carga Inicial (3 anos)"
        btnCargaInicial.Location = New Point(180, 90)
        btnCargaInicial.Size = New Size(150, 35)
        btnCargaInicial.Font = New Font("Segoe UI", 9)
        AddHandler btnCargaInicial.Click, AddressOf btnCargaInicial_Click
        Me.Controls.Add(btnCargaInicial)
        
        btnCargaIncremental = New Button()
        btnCargaIncremental.Text = "Carga Incremental"
        btnCargaIncremental.Location = New Point(340, 90)
        btnCargaIncremental.Size = New Size(150, 35)
        btnCargaIncremental.Font = New Font("Segoe UI", 9)
        AddHandler btnCargaIncremental.Click, AddressOf btnCargaIncremental_Click
        Me.Controls.Add(btnCargaIncremental)
        
        btnSincronizacaoInteligente = New Button()
        btnSincronizacaoInteligente.Text = "Sincronização Inteligente"
        btnSincronizacaoInteligente.Location = New Point(500, 90)
        btnSincronizacaoInteligente.Size = New Size(150, 35)
        btnSincronizacaoInteligente.Font = New Font("Segoe UI", 9)
        btnSincronizacaoInteligente.BackColor = Color.LightGreen
        AddHandler btnSincronizacaoInteligente.Click, AddressOf btnSincronizacaoInteligente_Click
        Me.Controls.Add(btnSincronizacaoInteligente)
        
        btnCriarVersaoTeste = New Button()
        btnCriarVersaoTeste.Text = "Criar Versão Teste"
        btnCriarVersaoTeste.Location = New Point(660, 90)
        btnCriarVersaoTeste.Size = New Size(120, 35)
        btnCriarVersaoTeste.Font = New Font("Segoe UI", 9)
        AddHandler btnCriarVersaoTeste.Click, AddressOf btnCriarVersaoTeste_Click
        Me.Controls.Add(btnCriarVersaoTeste)
        
        ' --- Controles do Frontend ---
        lblFrontendStatus = New Label()
        lblFrontendStatus.Text = "Frontend: Não iniciado"
        lblFrontendStatus.Location = New Point(20, 130)
        lblFrontendStatus.Size = New Size(200, 20)
        lblFrontendStatus.Font = New Font("Segoe UI", 9, FontStyle.Bold)
        lblFrontendStatus.ForeColor = Color.DarkRed
        Me.Controls.Add(lblFrontendStatus)
        
        btnIniciarFrontend = New Button()
        btnIniciarFrontend.Text = "Iniciar Frontend"
        btnIniciarFrontend.Location = New Point(230, 125)
        btnIniciarFrontend.Size = New Size(110, 30)
        btnIniciarFrontend.Font = New Font("Segoe UI", 9)
        btnIniciarFrontend.BackColor = Color.LightBlue
        AddHandler btnIniciarFrontend.Click, AddressOf btnIniciarFrontend_Click
        Me.Controls.Add(btnIniciarFrontend)
        
        btnPararFrontend = New Button()
        btnPararFrontend.Text = "Parar Frontend"
        btnPararFrontend.Location = New Point(350, 125)
        btnPararFrontend.Size = New Size(110, 30)
        btnPararFrontend.Font = New Font("Segoe UI", 9)
        btnPararFrontend.BackColor = Color.LightCoral
        btnPararFrontend.Enabled = False
        AddHandler btnPararFrontend.Click, AddressOf btnPararFrontend_Click
        Me.Controls.Add(btnPararFrontend)
        
        btnAbrirBrowser = New Button()
        btnAbrirBrowser.Text = "Abrir no Browser"
        btnAbrirBrowser.Location = New Point(470, 125)
        btnAbrirBrowser.Size = New Size(120, 30)
        btnAbrirBrowser.Font = New Font("Segoe UI", 9)
        btnAbrirBrowser.BackColor = Color.LightGreen
        btnAbrirBrowser.Enabled = False
        AddHandler btnAbrirBrowser.Click, AddressOf btnAbrirBrowser_Click
        Me.Controls.Add(btnAbrirBrowser)
        
        ' --- Controles do Backend API ---
        lblBackendStatus = New Label()
        lblBackendStatus.Text = "Backend API: Não iniciado"
        lblBackendStatus.Location = New Point(600, 130)
        lblBackendStatus.Size = New Size(180, 20)
        lblBackendStatus.Font = New Font("Segoe UI", 9, FontStyle.Bold)
        lblBackendStatus.ForeColor = Color.DarkRed
        Me.Controls.Add(lblBackendStatus)
        
        btnIniciarBackend = New Button()
        btnIniciarBackend.Text = "Iniciar API"
        btnIniciarBackend.Location = New Point(20, 155)
        btnIniciarBackend.Size = New Size(90, 30)
        btnIniciarBackend.Font = New Font("Segoe UI", 9)
        btnIniciarBackend.BackColor = Color.LightBlue
        AddHandler btnIniciarBackend.Click, AddressOf btnIniciarBackend_Click
        Me.Controls.Add(btnIniciarBackend)
        
        btnPararBackend = New Button()
        btnPararBackend.Text = "Parar API"
        btnPararBackend.Location = New Point(120, 155)
        btnPararBackend.Size = New Size(90, 30)
        btnPararBackend.Font = New Font("Segoe UI", 9)
        btnPararBackend.BackColor = Color.LightCoral
        btnPararBackend.Enabled = False
        AddHandler btnPararBackend.Click, AddressOf btnPararBackend_Click
        Me.Controls.Add(btnPararBackend)
        
        btnHealthCheck = New Button()
        btnHealthCheck.Text = "Health Check"
        btnHealthCheck.Location = New Point(220, 155)
        btnHealthCheck.Size = New Size(100, 30)
        btnHealthCheck.Font = New Font("Segoe UI", 9)
        btnHealthCheck.BackColor = Color.LightYellow
        btnHealthCheck.Enabled = False
        AddHandler btnHealthCheck.Click, AddressOf btnHealthCheck_Click
        Me.Controls.Add(btnHealthCheck)
        
        btnAbrirSwagger = New Button()
        btnAbrirSwagger.Text = "Abrir Swagger"
        btnAbrirSwagger.Location = New Point(330, 155)
        btnAbrirSwagger.Size = New Size(110, 30)
        btnAbrirSwagger.Font = New Font("Segoe UI", 9)
        btnAbrirSwagger.BackColor = Color.LightGreen
        btnAbrirSwagger.Enabled = False
        AddHandler btnAbrirSwagger.Click, AddressOf btnAbrirSwagger_Click
        Me.Controls.Add(btnAbrirSwagger)
        
        ' Botão para iniciar tudo
        Dim btnIniciarTudo As New Button()
        btnIniciarTudo.Text = "🚀 INICIAR SISTEMA COMPLETO"
        btnIniciarTudo.Location = New Point(480, 155)
        btnIniciarTudo.Size = New Size(200, 30)
        btnIniciarTudo.Font = New Font("Segoe UI", 10, FontStyle.Bold)
        btnIniciarTudo.BackColor = Color.Gold
        btnIniciarTudo.ForeColor = Color.DarkBlue
        AddHandler btnIniciarTudo.Click, AddressOf btnIniciarTudo_Click
        Me.Controls.Add(btnIniciarTudo)
        
        ' Botão para parar tudo
        Dim btnPararTudo As New Button()
        btnPararTudo.Text = "🛑 PARAR TUDO"
        btnPararTudo.Location = New Point(690, 155)
        btnPararTudo.Size = New Size(90, 30)
        btnPararTudo.Font = New Font("Segoe UI", 9, FontStyle.Bold)
        btnPararTudo.BackColor = Color.Crimson
        btnPararTudo.ForeColor = Color.White
        AddHandler btnPararTudo.Click, AddressOf btnPararTudo_Click
        Me.Controls.Add(btnPararTudo)
        
        ' Área de log
        txtLog = New TextBox()
        txtLog.Location = New Point(20, 195)
        txtLog.Size = New Size(760, 345)
        txtLog.Multiline = True
        txtLog.ScrollBars = ScrollBars.Vertical
        txtLog.Font = New Font("Consolas", 9)
        txtLog.ReadOnly = True
        txtLog.BackColor = Color.Black
        txtLog.ForeColor = Color.Lime
        Me.Controls.Add(txtLog)
        
        ' Configurar redirecionamento do Console
        RedirectConsoleToTextBox()
    End Sub
    
    ''' <summary>
    ''' Inicializa os gerenciadores de lógica
    ''' </summary>
    Private Sub InitializeManagers()
        updateManager = New UpdateManager()
        sincronizador = New SincronizadorDados()
        
        ' Inicializar servidor frontend
        Dim frontendBuildPath = Path.Combine(Application.StartupPath, "frontend", "build")
        frontendServer = New FrontendHttpServer(frontendBuildPath, 8080)

        ' Inicializar backend API manager
        Dim backendExePath = Path.Combine(Application.StartupPath, "backend", "suat-backend.exe")
        backendApiManager = New BackendApiManager(backendExePath)
        
        ' Conectar eventos
        AddHandler updateManager.ProgressChanged, AddressOf OnUpdateProgress
        AddHandler frontendServer.StatusChanged, AddressOf OnFrontendStatusChanged
        AddHandler frontendServer.ServerStarted, AddressOf OnFrontendServerStarted
        AddHandler frontendServer.ServerStopped, AddressOf OnFrontendServerStopped
        AddHandler frontendServer.RequestReceived, AddressOf OnFrontendRequestReceived
        AddHandler backendApiManager.StatusChanged, AddressOf OnBackendStatusChanged
        AddHandler backendApiManager.ServerStarted, AddressOf OnBackendServerStarted
        AddHandler backendApiManager.ServerStopped, AddressOf OnBackendServerStopped
        AddHandler backendApiManager.HealthCheckResult, AddressOf OnBackendHealthCheck
    End Sub
    
    ''' <summary>
    ''' Redireciona a saída do Console para o TextBox
    ''' </summary>
    Private Sub RedirectConsoleToTextBox()
        Dim consoleWriter As New ConsoleWriter(txtLog)
        Console.SetOut(consoleWriter)
    End Sub
    
    ''' <summary>
    ''' Evento de clique no botão Verificar Atualizações
    ''' </summary>
    Private Async Sub btnVerificarUpdate_Click(sender As Object, e As EventArgs)
        Try
            btnVerificarUpdate.Enabled = False
            UpdateStatus("Verificando atualizações...")
            
            Dim updateResult = Await updateManager.VerificarAtualizacoes()
            
            If updateResult.Success Then
                If updateResult.HasUpdate Then
                    Dim result = MessageBox.Show(
                        $"Nova versão disponível: {updateResult.VersionInfo.Version}" & vbCrLf &
                        "Deseja atualizar agora?",
                        "Atualização Disponível",
                        MessageBoxButtons.YesNo,
                        MessageBoxIcon.Question
                    )
                    
                    If result = DialogResult.Yes Then
                        Await AplicarAtualizacao(updateResult.VersionInfo)
                    End If
                Else
                    MessageBox.Show("Sistema está atualizado", "Verificação", MessageBoxButtons.OK, MessageBoxIcon.Information)
                End If
            Else
                MessageBox.Show($"Erro ao verificar atualizações: {updateResult.Message}", "Erro", MessageBoxButtons.OK, MessageBoxIcon.Error)
            End If
            
        Catch ex As Exception
            MessageBox.Show($"Erro: {ex.Message}", "Erro", MessageBoxButtons.OK, MessageBoxIcon.Error)
        Finally
            btnVerificarUpdate.Enabled = True
            UpdateStatus("Sistema pronto")
        End Try
    End Sub
    
    ''' <summary>
    ''' Evento de clique no botão Carga Inicial
    ''' </summary>
    Private Sub btnCargaInicial_Click(sender As Object, e As EventArgs)
        Try
            btnCargaInicial.Enabled = False
            UpdateStatus("Executando carga inicial...")
            
            ' Executar em thread separada para não bloquear a UI
            Task.Run(Sub()
                Try
                    sincronizador.RealizarCargaInicial()
                    Me.Invoke(Sub()
                        UpdateStatus("Carga inicial concluída!")
                        MessageBox.Show("Carga inicial concluída com sucesso!", "Sucesso", MessageBoxButtons.OK, MessageBoxIcon.Information)
                    End Sub)
                Catch ex As Exception
                    Me.Invoke(Sub()
                        UpdateStatus("Erro na carga inicial")
                        MessageBox.Show($"Erro na carga inicial: {ex.Message}", "Erro", MessageBoxButtons.OK, MessageBoxIcon.Error)
                    End Sub)
                Finally
                    Me.Invoke(Sub() btnCargaInicial.Enabled = True)
                End Try
            End Sub)
            
        Catch ex As Exception
            MessageBox.Show($"Erro: {ex.Message}", "Erro", MessageBoxButtons.OK, MessageBoxIcon.Error)
            btnCargaInicial.Enabled = True
            UpdateStatus("Sistema pronto")
        End Try
    End Sub
    
    ''' <summary>
    ''' Evento de clique no botão Carga Incremental
    ''' </summary>
    Private Sub btnCargaIncremental_Click(sender As Object, e As EventArgs)
        Try
            btnCargaIncremental.Enabled = False
            UpdateStatus("Executando carga incremental...")
            
            ' Executar em thread separada para não bloquear a UI
            Task.Run(Sub()
                Try
                    sincronizador.RealizarCargaIncremental()
                    Me.Invoke(Sub()
                        UpdateStatus("Carga incremental concluída!")
                        MessageBox.Show("Carga incremental concluída com sucesso!", "Sucesso", MessageBoxButtons.OK, MessageBoxIcon.Information)
                    End Sub)
                Catch ex As Exception
                    Me.Invoke(Sub()
                        UpdateStatus("Erro na carga incremental")
                        MessageBox.Show($"Erro na carga incremental: {ex.Message}", "Erro", MessageBoxButtons.OK, MessageBoxIcon.Error)
                    End Sub)
                Finally
                    Me.Invoke(Sub() btnCargaIncremental.Enabled = True)
                End Try
            End Sub)
            
        Catch ex As Exception
            MessageBox.Show($"Erro: {ex.Message}", "Erro", MessageBoxButtons.OK, MessageBoxIcon.Error)
            btnCargaIncremental.Enabled = True
            UpdateStatus("Sistema pronto")
        End Try
    End Sub
    
    ''' <summary>
    ''' Evento de clique no botão Sincronização Inteligente
    ''' </summary>
    Private Sub btnSincronizacaoInteligente_Click(sender As Object, e As EventArgs)
        Try
            btnSincronizacaoInteligente.Enabled = False
            UpdateStatus("Executando sincronização inteligente...")
            
            ' Executar em thread separada para não bloquear a UI
            Task.Run(Sub()
                Try
                    sincronizador.ExecutarSincronizacaoInteligente()
                    Me.Invoke(Sub()
                        UpdateStatus("Sincronização inteligente concluída!")
                        MessageBox.Show("Sincronização inteligente concluída com sucesso!", "Sucesso", MessageBoxButtons.OK, MessageBoxIcon.Information)
                    End Sub)
                Catch ex As Exception
                    Me.Invoke(Sub()
                        UpdateStatus("Erro na sincronização inteligente")
                        MessageBox.Show($"Erro na sincronização inteligente: {ex.Message}", "Erro", MessageBoxButtons.OK, MessageBoxIcon.Error)
                    End Sub)
                Finally
                    Me.Invoke(Sub() btnSincronizacaoInteligente.Enabled = True)
                End Try
            End Sub)
            
        Catch ex As Exception
            MessageBox.Show($"Erro: {ex.Message}", "Erro", MessageBoxButtons.OK, MessageBoxIcon.Error)
            btnSincronizacaoInteligente.Enabled = True
            UpdateStatus("Sistema pronto")
        End Try
    End Sub
    
    ''' <summary>
    ''' Evento de clique no botão Criar Versão Teste
    ''' </summary>
    Private Sub btnCriarVersaoTeste_Click(sender As Object, e As EventArgs)
        Try
            updateManager.CriarArquivoVersaoTeste()
            MessageBox.Show("Arquivo de versão de teste criado com sucesso!", "Sucesso", MessageBoxButtons.OK, MessageBoxIcon.Information)
        Catch ex As Exception
            MessageBox.Show($"Erro ao criar arquivo de versão: {ex.Message}", "Erro", MessageBoxButtons.OK, MessageBoxIcon.Error)
        End Try
    End Sub
    
    ''' <summary>
    ''' Aplica uma atualização
    ''' </summary>
    Private Async Function AplicarAtualizacao(versionInfo As VersionInfo) As Task
        Try
            Dim result = Await updateManager.AplicarAtualizacao(versionInfo)
            If result.Success Then
                MessageBox.Show("Atualização aplicada com sucesso!", "Sucesso", MessageBoxButtons.OK, MessageBoxIcon.Information)
            Else
                MessageBox.Show($"Erro na atualização: {result.Message}", "Erro", MessageBoxButtons.OK, MessageBoxIcon.Error)
            End If
        Catch ex As Exception
            MessageBox.Show($"Erro ao aplicar atualização: {ex.Message}", "Erro", MessageBoxButtons.OK, MessageBoxIcon.Error)
        End Try
    End Function
    
    ''' <summary>
    ''' Atualiza o status na interface
    ''' </summary>
    Private Sub UpdateStatus(message As String)
        If Me.InvokeRequired Then
            Me.Invoke(Sub() lblStatus.Text = message)
        Else
            lblStatus.Text = message
        End If
    End Sub
    
    ''' <summary>
    ''' Evento de progresso da atualização
    ''' </summary>
    Private Sub OnUpdateProgress(percentage As Integer, status As String)
        UpdateStatus(status)
        If Me.InvokeRequired Then
            Me.Invoke(Sub() progressBar.Value = Math.Min(100, percentage))
        Else
            progressBar.Value = Math.Min(100, percentage)
        End If
    End Sub
    
    ''' <summary>
    ''' Evento de carregamento do formulário
    ''' </summary>
    Private Sub MainForm_Load(sender As Object, e As EventArgs) Handles MyBase.Load
        Console.WriteLine("========================================")
        Console.WriteLine("    SUAT-IA - Sistema de Integração")
        Console.WriteLine("    .NET Framework 4.7 - WinForms")
        Console.WriteLine("========================================")
        Console.WriteLine()
        Console.WriteLine("Sistema iniciado com sucesso!")
        Console.WriteLine("Use os botões para testar as funcionalidades:")
        Console.WriteLine("- Verificar Atualizações: Testa o sistema de auto-atualização")
        Console.WriteLine("- Carga Inicial: Simula carga de 3 anos de dados")
        Console.WriteLine("- Carga Incremental: Simula carga de dados recentes")
        Console.WriteLine("- Sincronização Inteligente: Detecta automaticamente se é nova instalação ou atualização")
        Console.WriteLine("- Criar Versão Teste: Cria arquivo de versão para testes")
        Console.WriteLine()
    End Sub
    
    ' --- Eventos dos Botões Frontend ---
    
    ''' <summary>
    ''' Inicia o servidor frontend
    ''' </summary>
    Private Async Sub btnIniciarFrontend_Click(sender As Object, e As EventArgs)
        Try
            btnIniciarFrontend.Enabled = False
            
            If Await frontendServer.StartAsync() Then
                btnIniciarFrontend.Enabled = False
                btnPararFrontend.Enabled = True
                btnAbrirBrowser.Enabled = True
            Else
                btnIniciarFrontend.Enabled = True
            End If
            
        Catch ex As Exception
            MessageBox.Show($"Erro ao iniciar frontend: {ex.Message}", "Erro", MessageBoxButtons.OK, MessageBoxIcon.Error)
            btnIniciarFrontend.Enabled = True
        End Try
    End Sub
    
    ''' <summary>
    ''' Para o servidor frontend
    ''' </summary>
    Private Sub btnPararFrontend_Click(sender As Object, e As EventArgs)
        Try
            frontendServer.Stop()
            btnIniciarFrontend.Enabled = True
            btnPararFrontend.Enabled = False
            btnAbrirBrowser.Enabled = False
            
        Catch ex As Exception
            MessageBox.Show($"Erro ao parar frontend: {ex.Message}", "Erro", MessageBoxButtons.OK, MessageBoxIcon.Error)
        End Try
    End Sub
    
    ''' <summary>
    ''' Abre o frontend no browser
    ''' </summary>
    Private Sub btnAbrirBrowser_Click(sender As Object, e As EventArgs)
        Try
            If frontendServer.IsServerRunning Then
                Process.Start(frontendServer.ServerUrl)
            Else
                MessageBox.Show("Frontend não está rodando!", "Aviso", MessageBoxButtons.OK, MessageBoxIcon.Warning)
            End If
            
        Catch ex As Exception
            MessageBox.Show($"Erro ao abrir browser: {ex.Message}", "Erro", MessageBoxButtons.OK, MessageBoxIcon.Error)
        End Try
    End Sub
    
    ' --- Eventos do Servidor Frontend ---
    
    ''' <summary>
    ''' Evento quando status do frontend muda
    ''' </summary>
    Private Sub OnFrontendStatusChanged(message As String)
        If Me.InvokeRequired Then
            Me.Invoke(Sub() OnFrontendStatusChanged(message))
        Else
            Console.WriteLine($"[Frontend] {message}")
        End If
    End Sub
    
    ''' <summary>
    ''' Evento quando servidor frontend inicia
    ''' </summary>
    Private Sub OnFrontendServerStarted(url As String)
        If Me.InvokeRequired Then
            Me.Invoke(Sub() OnFrontendServerStarted(url))
        Else
            lblFrontendStatus.Text = $"Frontend: Rodando em {url}"
            lblFrontendStatus.ForeColor = Color.DarkGreen
            Console.WriteLine($"🌐 Frontend disponível em: {url}")
        End If
    End Sub
    
    ''' <summary>
    ''' Evento quando servidor frontend para
    ''' </summary>
    Private Sub OnFrontendServerStopped()
        If Me.InvokeRequired Then
            Me.Invoke(Sub() OnFrontendServerStopped())
        Else
            lblFrontendStatus.Text = "Frontend: Parado"
            lblFrontendStatus.ForeColor = Color.DarkRed
        End If
    End Sub
    
    ''' <summary>
    ''' Evento quando servidor frontend recebe request
    ''' </summary>
    Private Sub OnFrontendRequestReceived(method As String, path As String)
        ' Log silencioso - não logar todas as requests para não poluir
        ' Console.WriteLine($"[Frontend] {method} {path}")
    End Sub
    
    ' --- Eventos dos Botões Backend API ---
    
    ''' <summary>
    ''' Inicia o backend API
    ''' </summary>
    Private Async Sub btnIniciarBackend_Click(sender As Object, e As EventArgs)
        Try
            btnIniciarBackend.Enabled = False
            
            If Await backendApiManager.StartAsync() Then
                btnIniciarBackend.Enabled = False
                btnPararBackend.Enabled = True
                btnHealthCheck.Enabled = True
                btnAbrirSwagger.Enabled = True
            Else
                btnIniciarBackend.Enabled = True
            End If
            
        Catch ex As Exception
            MessageBox.Show($"Erro ao iniciar backend API: {ex.Message}", "Erro", MessageBoxButtons.OK, MessageBoxIcon.Error)
            btnIniciarBackend.Enabled = True
        End Try
    End Sub
    
    ''' <summary>
    ''' Para o backend API
    ''' </summary>
    Private Sub btnPararBackend_Click(sender As Object, e As EventArgs)
        Try
            backendApiManager.Stop()
            btnIniciarBackend.Enabled = True
            btnPararBackend.Enabled = False
            btnHealthCheck.Enabled = False
            btnAbrirSwagger.Enabled = False
            
        Catch ex As Exception
            MessageBox.Show($"Erro ao parar backend API: {ex.Message}", "Erro", MessageBoxButtons.OK, MessageBoxIcon.Error)
        End Try
    End Sub
    
    ''' <summary>
    ''' Executa health check do backend
    ''' </summary>
    Private Sub btnHealthCheck_Click(sender As Object, e As EventArgs)
        Try
            backendApiManager.CheckHealthAsync()
            
        Catch ex As Exception
            MessageBox.Show($"Erro no health check: {ex.Message}", "Erro", MessageBoxButtons.OK, MessageBoxIcon.Error)
        End Try
    End Sub
    
    ''' <summary>
    ''' Abre o Swagger do backend
    ''' </summary>
    Private Sub btnAbrirSwagger_Click(sender As Object, e As EventArgs)
        Try
            If backendApiManager.IsRunning Then
                Process.Start(backendApiManager.SwaggerUrl)
            Else
                MessageBox.Show("Backend API não está rodando!", "Aviso", MessageBoxButtons.OK, MessageBoxIcon.Warning)
            End If
            
        Catch ex As Exception
            MessageBox.Show($"Erro ao abrir Swagger: {ex.Message}", "Erro", MessageBoxButtons.OK, MessageBoxIcon.Error)
        End Try
    End Sub
    
    ' --- Eventos do Backend API Manager ---
    
    ''' <summary>
    ''' Evento quando status do backend muda
    ''' </summary>
    Private Sub OnBackendStatusChanged(message As String)
        If Me.InvokeRequired Then
            Me.Invoke(Sub() OnBackendStatusChanged(message))
        Else
            Console.WriteLine($"[Backend API] {message}")
        End If
    End Sub
    
    ''' <summary>
    ''' Evento quando backend API inicia
    ''' </summary>
    Private Sub OnBackendServerStarted(url As String)
        If Me.InvokeRequired Then
            Me.Invoke(Sub() OnBackendServerStarted(url))
        Else
            lblBackendStatus.Text = $"Backend API: Rodando em :3000"
            lblBackendStatus.ForeColor = Color.DarkGreen
            Console.WriteLine($"🚀 Backend API disponível em: {url}")
        End If
    End Sub
    
    ''' <summary>
    ''' Evento quando backend API para
    ''' </summary>
    Private Sub OnBackendServerStopped()
        If Me.InvokeRequired Then
            Me.Invoke(Sub() OnBackendServerStopped())
        Else
            lblBackendStatus.Text = "Backend API: Parado"
            lblBackendStatus.ForeColor = Color.DarkRed
        End If
    End Sub
    
    ''' <summary>
    ''' Evento do resultado do health check
    ''' </summary>
    Private Sub OnBackendHealthCheck(isHealthy As Boolean, message As String)
        If Me.InvokeRequired Then
            Me.Invoke(Sub() OnBackendHealthCheck(isHealthy, message))
        Else
            If isHealthy Then
                Console.WriteLine($"💚 Health Check OK: {message}")
                MessageBox.Show($"Backend API está funcionando!\n\n{message}", "Health Check", MessageBoxButtons.OK, MessageBoxIcon.Information)
            Else
                Console.WriteLine($"💔 Health Check FAIL: {message}")
                MessageBox.Show($"Backend API com problemas!\n\n{message}", "Health Check", MessageBoxButtons.OK, MessageBoxIcon.Warning)
            End If
        End If
    End Sub
    
    ' --- Controles do Sistema Completo ---
    
    ''' <summary>
    ''' Inicia todo o sistema SUAT-IA
    ''' </summary>
    Private Async Sub btnIniciarTudo_Click(sender As Object, e As EventArgs)
        Try
            Console.WriteLine("🚀 ======================================")
            Console.WriteLine("🚀    INICIANDO SISTEMA SUAT-IA")
            Console.WriteLine("🚀 ======================================")
            Console.WriteLine()
            
            ' 1. Iniciar Backend API
            Console.WriteLine("🔥 Passo 1/2: Iniciando Backend API...")
            If Await backendApiManager.StartAsync() Then
                btnIniciarBackend.Enabled = False
                btnPararBackend.Enabled = True
                btnHealthCheck.Enabled = True
                btnAbrirSwagger.Enabled = True
                Console.WriteLine("✅ Backend API iniciado com sucesso!")
            Else
                Console.WriteLine("❌ Falha ao iniciar Backend API")
                Return
            End If
            
            ' Aguardar um pouco
            Await Task.Delay(2000)
            
            ' 2. Iniciar Frontend Server
            Console.WriteLine("🔥 Passo 2/2: Iniciando Frontend Server...")
            If Await frontendServer.StartAsync() Then
                btnIniciarFrontend.Enabled = False
                btnPararFrontend.Enabled = True
                btnAbrirBrowser.Enabled = True
                Console.WriteLine("✅ Frontend Server iniciado com sucesso!")
            Else
                Console.WriteLine("❌ Falha ao iniciar Frontend Server")
                Return
            End If
            
            Console.WriteLine()
            Console.WriteLine("🎉 ======================================")
            Console.WriteLine("🎉    SISTEMA SUAT-IA INICIADO!")
            Console.WriteLine("🎉 ======================================")
            Console.WriteLine("🌐 Backend API: http://localhost:3000")
            Console.WriteLine("🌐 Frontend:    http://localhost:8080")
            Console.WriteLine("📖 Swagger:     http://localhost:3000/api-docs")
            Console.WriteLine()
            
            ' Mostrar dialog de sucesso
            Dim result = MessageBox.Show(
                "Sistema SUAT-IA iniciado com sucesso!" & vbNewLine & vbNewLine &
                "✅ Backend API: http://localhost:3000" & vbNewLine &
                "✅ Frontend: http://localhost:8080" & vbNewLine &
                "✅ Swagger: http://localhost:3000/api-docs" & vbNewLine & vbNewLine &
                "Deseja abrir o frontend no browser?",
                "Sistema Iniciado",
                MessageBoxButtons.YesNo,
                MessageBoxIcon.Information
            )
            
            If result = DialogResult.Yes Then
                Process.Start(frontendServer.ServerUrl)
            End If
            
        Catch ex As Exception
            Console.WriteLine($"❌ Erro ao iniciar sistema: {ex.Message}")
            MessageBox.Show($"Erro ao iniciar sistema:\n\n{ex.Message}", "Erro", MessageBoxButtons.OK, MessageBoxIcon.Error)
        End Try
    End Sub
    
    ''' <summary>
    ''' Para todo o sistema SUAT-IA
    ''' </summary>
    Private Sub btnPararTudo_Click(sender As Object, e As EventArgs)
        Try
            Console.WriteLine("🛑 ======================================")
            Console.WriteLine("🛑    PARANDO SISTEMA SUAT-IA")
            Console.WriteLine("🛑 ======================================")
            Console.WriteLine()
            
            ' Parar Frontend
            Console.WriteLine("🔥 Parando Frontend Server...")
            frontendServer.Stop()
            btnIniciarFrontend.Enabled = True
            btnPararFrontend.Enabled = False
            btnAbrirBrowser.Enabled = False
            Console.WriteLine("✅ Frontend Server parado")
            
            ' Parar Backend API
            Console.WriteLine("🔥 Parando Backend API...")
            backendApiManager.Stop()
            btnIniciarBackend.Enabled = True
            btnPararBackend.Enabled = False
            btnHealthCheck.Enabled = False
            btnAbrirSwagger.Enabled = False
            Console.WriteLine("✅ Backend API parado")
            
            Console.WriteLine()
            Console.WriteLine("✅ ======================================")
            Console.WriteLine("✅    SISTEMA SUAT-IA PARADO")
            Console.WriteLine("✅ ======================================")
            Console.WriteLine()
            
            MessageBox.Show("Sistema SUAT-IA parado com sucesso!", "Sistema Parado", MessageBoxButtons.OK, MessageBoxIcon.Information)
            
        Catch ex As Exception
            Console.WriteLine($"❌ Erro ao parar sistema: {ex.Message}")
            MessageBox.Show($"Erro ao parar sistema:\n\n{ex.Message}", "Erro", MessageBoxButtons.OK, MessageBoxIcon.Error)
        End Try
    End Sub
End Class

''' <summary>
''' Classe para redirecionar a saída do Console para um TextBox
''' </summary>
Public Class ConsoleWriter
    Inherits TextWriter
    
    Private ReadOnly textBox As TextBox
    
    Public Sub New(textBox As TextBox)
        Me.textBox = textBox
    End Sub
    
    Public Overrides ReadOnly Property Encoding As System.Text.Encoding
        Get
            Return System.Text.Encoding.UTF8
        End Get
    End Property
    
    Public Overrides Sub Write(value As String)
        If textBox.InvokeRequired Then
            textBox.Invoke(Sub() WriteToTextBox(value))
        Else
            WriteToTextBox(value)
        End If
    End Sub
    
    Public Overrides Sub WriteLine(value As String)
        Write(value & Environment.NewLine)
    End Sub
    
    Private Sub WriteToTextBox(value As String)
        textBox.AppendText(value)
        textBox.SelectionStart = textBox.TextLength
        textBox.ScrollToCaret()
        Application.DoEvents()
    End Sub
End Class

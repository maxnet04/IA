Imports System
Imports System.IO
Imports System.Diagnostics
Imports System.Collections.Generic
Imports System.Windows.Forms

''' <summary>
''' Gerenciador de portas do sistema SUAT-IA
''' Responsável por verificar, liberar e gerenciar portas utilizadas pelos serviços
''' Compatível com .NET Framework 4.7
''' </summary>
Public Class PortManager
    ' --- Constantes de Configuração ---
    Private Const BACKEND_PORT As Integer = 3000
    Private Const FRONTEND_PORT As Integer = 8080
    
    ' --- Eventos ---
    Public Event PortStatusChanged(port As Integer, status As String)
    Public Event ProcessKilled(processName As String, pid As Integer, port As Integer)
    Public Event PortFreed(port As Integer)
    Public Event PortCheckCompleted(success As Boolean, message As String)
    
    ''' <summary>
    ''' Verifica se uma porta está disponível
    ''' </summary>
    Public Function IsPortAvailable(port As Integer) As Boolean
        Try
            Dim listener = New Net.Sockets.TcpListener(Net.IPAddress.Any, port)
            listener.Start()
            listener.Stop()
            Return True
        Catch
            Return False
        End Try
    End Function
    
    ''' <summary>
    ''' Verifica e libera uma porta específica
    ''' </summary>
    Public Sub FreePort(port As Integer)
        Try
            RaiseEvent PortStatusChanged(port, $"🔍 Verificando porta {port}...")
            
            ' Verificar se porta está em uso
            If Not IsPortAvailable(port) Then
                RaiseEvent PortStatusChanged(port, $"⚠️ Porta {port} está em uso. Matando processos...")
                
                ' Encontrar e matar processos que usam a porta
                KillProcessesUsingPort(port)
                
                ' Aguardar um pouco para os processos terminarem
                Threading.Thread.Sleep(2000)
                
                ' Verificar novamente
                If Not IsPortAvailable(port) Then
                    RaiseEvent PortStatusChanged(port, $"❌ Não foi possível liberar a porta {port}")
                    RaiseEvent PortCheckCompleted(False, $"Porta {port} não pôde ser liberada")
                Else
                    RaiseEvent PortStatusChanged(port, $"✅ Porta {port} liberada com sucesso")
                    RaiseEvent PortFreed(port)
                    RaiseEvent PortCheckCompleted(True, $"Porta {port} liberada com sucesso")
                End If
            Else
                RaiseEvent PortStatusChanged(port, $"✅ Porta {port} já está disponível")
                RaiseEvent PortCheckCompleted(True, $"Porta {port} já estava disponível")
            End If
            
        Catch ex As Exception
            RaiseEvent PortStatusChanged(port, $"⚠️ Erro ao verificar porta {port}: {ex.Message}")
            RaiseEvent PortCheckCompleted(False, $"Erro ao verificar porta {port}: {ex.Message}")
        End Try
    End Sub
    
    ''' <summary>
    ''' Mata todos os processos que usam uma porta específica
    ''' </summary>
    Private Sub KillProcessesUsingPort(port As Integer)
        Try
            ' Usar netstat para encontrar processos que usam a porta
            Dim startInfo As New ProcessStartInfo()
            startInfo.FileName = "netstat"
            startInfo.Arguments = $"-ano"
            startInfo.UseShellExecute = False
            startInfo.RedirectStandardOutput = True
            startInfo.CreateNoWindow = True
            
            Dim process As Process = Process.Start(startInfo)
            Dim output As String = process.StandardOutput.ReadToEnd()
            process.WaitForExit()
            
            ' Procurar por linhas que contêm a porta
            Dim lines = output.Split(Environment.NewLine)
            Dim pidsToKill As New List(Of Integer)
            
            For Each line In lines
                If line.Contains($":{port} ") AndAlso line.Contains("LISTENING") Then
                    ' Extrair PID da linha
                    Dim parts = line.Split(New Char() {" "c}, StringSplitOptions.RemoveEmptyEntries)
                    If parts.Length >= 5 Then
                        Dim pidStr = parts(parts.Length - 1)
                        Dim pid As Integer
                        If Integer.TryParse(pidStr, pid) Then
                            pidsToKill.Add(pid)
                        End If
                    End If
                End If
            Next
            
            ' Matar os processos encontrados
            For Each pid As Integer In pidsToKill
                Try
                    Dim proc = Process.GetProcessById(pid)
                    RaiseEvent PortStatusChanged(port, $"🔄 Matando processo {proc.ProcessName} (PID: {pid}) que usa porta {port}")
                    proc.Kill()
                    proc.WaitForExit(3000)
                    RaiseEvent ProcessKilled(proc.ProcessName, pid, port)
                Catch ex As Exception
                    RaiseEvent PortStatusChanged(port, $"⚠️ Erro ao matar processo PID {pid}: {ex.Message}")
                End Try
            Next
            
        Catch ex As Exception
            RaiseEvent PortStatusChanged(port, $"❌ Erro ao verificar processos da porta {port}: {ex.Message}")
        End Try
    End Sub
    
    ''' <summary>
    ''' Verifica e libera todas as portas do sistema SUAT-IA
    ''' </summary>
    Public Sub FreeAllSystemPorts()
        Try
            RaiseEvent PortStatusChanged(0, "🔍 Iniciando verificação de portas do sistema...")
            
            ' Verificar porta do backend
            FreePort(BACKEND_PORT)
            
            ' Verificar porta do frontend
            FreePort(FRONTEND_PORT)
            
            RaiseEvent PortStatusChanged(0, "✅ Verificação de portas concluída")
            
        Catch ex As Exception
            RaiseEvent PortStatusChanged(0, $"❌ Erro na verificação de portas: {ex.Message}")
        End Try
    End Sub
    
    ''' <summary>
    ''' Verifica se todas as portas do sistema estão disponíveis
    ''' </summary>
    Public Function AreAllPortsAvailable() As Boolean
        Return IsPortAvailable(BACKEND_PORT) AndAlso IsPortAvailable(FRONTEND_PORT)
    End Function
    
    ''' <summary>
    ''' Obtém informações sobre as portas do sistema
    ''' </summary>
    Public Function GetSystemPortsInfo() As Dictionary(Of String, Object)
        Dim info As New Dictionary(Of String, Object)
        
        info.Add("BackendPort", BACKEND_PORT)
        info.Add("FrontendPort", FRONTEND_PORT)
        info.Add("BackendAvailable", IsPortAvailable(BACKEND_PORT))
        info.Add("FrontendAvailable", IsPortAvailable(FRONTEND_PORT))
        info.Add("AllPortsAvailable", AreAllPortsAvailable())
        
        Return info
    End Function
    
    ''' <summary>
    ''' Obtém a porta do backend
    ''' </summary>
    Public ReadOnly Property BackendPort As Integer
        Get
            Return BACKEND_PORT
        End Get
    End Property
    
    ''' <summary>
    ''' Obtém a porta do frontend
    ''' </summary>
    Public ReadOnly Property FrontendPort As Integer
        Get
            Return FRONTEND_PORT
        End Get
    End Property
End Class

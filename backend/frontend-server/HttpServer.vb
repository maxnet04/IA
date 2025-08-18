Imports System
Imports System.IO
Imports System.Net
Imports System.Text
Imports System.Threading
Imports System.Threading.Tasks
Imports System.Collections.Generic

Public Class HttpServer
    Private ReadOnly buildPath As String
    Private ReadOnly port As Integer
    Private listener As HttpListener
    Private cancellationTokenSource As CancellationTokenSource

    ' MIME Types
    Private ReadOnly mimeTypes As New Dictionary(Of String, String) From {
        {".html", "text/html; charset=utf-8"},
        {".css", "text/css; charset=utf-8"},
        {".js", "application/javascript; charset=utf-8"},
        {".json", "application/json; charset=utf-8"},
        {".png", "image/png"},
        {".jpg", "image/jpeg"},
        {".jpeg", "image/jpeg"},
        {".gif", "image/gif"},
        {".ico", "image/x-icon"},
        {".svg", "image/svg+xml"},
        {".woff", "font/woff"},
        {".woff2", "font/woff2"},
        {".ttf", "font/ttf"},
        {".eot", "application/vnd.ms-fontobject"},
        {".map", "application/json"}
    }

    Public Sub New(buildPath As String, port As Integer)
        Me.buildPath = buildPath
        Me.port = port
    End Sub

    Public Sub Start()
        Try
            ' Inicializar HttpListener
            listener = New HttpListener()
            listener.Prefixes.Add($"http://localhost:{port}/")
            listener.Start()

            cancellationTokenSource = New CancellationTokenSource()

            Console.WriteLine($"🚀 Servidor iniciado em: http://localhost:{port}")
            Console.WriteLine($"📁 Servindo arquivos de: {buildPath}")
            Console.WriteLine($"📊 Total de arquivos: {Directory.GetFiles(buildPath, "*", SearchOption.AllDirectories).Length}")
            Console.WriteLine()
            Console.WriteLine("Pressione 'q' para parar o servidor...")
            Console.WriteLine()

            ' Iniciar task para processar requests
            Task.Run(Sub() ProcessRequests(cancellationTokenSource.Token))

            ' Loop principal - aguardar comando para parar
            While True
                Dim key = Console.ReadKey(True)
                If key.KeyChar = "q"c OrElse key.KeyChar = "Q"c Then
                    Exit While
                End If
            End While

            ' Parar servidor
            [Stop]()

        Catch ex As HttpListenerException
            Console.WriteLine($"❌ Erro do servidor HTTP: {ex.Message}")
            If ex.ErrorCode = 5 Then
                Console.WriteLine()
                Console.WriteLine("💡 Solução: Execute como Administrador ou use uma porta diferente")
            End If
        Catch ex As Exception
            Console.WriteLine($"❌ Erro inesperado: {ex.Message}")
        End Try
    End Sub

    Private Async Sub ProcessRequests(cancellationToken As CancellationToken)
        While Not cancellationToken.IsCancellationRequested AndAlso listener.IsListening
            Try
                Dim context = Await listener.GetContextAsync()
                ' Processar request em background
                Task.Run(Sub() HandleRequest(context))

            Catch ex As ObjectDisposedException
                ' Listener foi fechado
                Exit While
            Catch ex As Exception
                Console.WriteLine($"⚠️ Erro ao processar request: {ex.Message}")
            End Try
        End While
    End Sub

    Private Sub HandleRequest(context As HttpListenerContext)
        Dim request = context.Request
        Dim response = context.Response
        Dim requestPath = request.Url.LocalPath

        Try
            Console.WriteLine($"📥 {request.HttpMethod} {requestPath}")

            ' Normalizar caminho
            If requestPath = "/" Then
                requestPath = "/index.html"
            End If

            ' Remover query string se houver
            If requestPath.Contains("?") Then
                requestPath = requestPath.Substring(0, requestPath.IndexOf("?"))
            End If

            ' Caminho físico do arquivo
            Dim filePath = Path.Combine(buildPath, requestPath.TrimStart("/"c))

            ' Verificar se arquivo existe
            If File.Exists(filePath) Then
                ServeFile(response, filePath)
            Else
                ' SPA Fallback - servir index.html para rotas do React Router
                If Not requestPath.StartsWith("/static/") And Not requestPath.Contains(".") Then
                    Dim indexPath = Path.Combine(buildPath, "index.html")
                    If File.Exists(indexPath) Then
                        ServeFile(response, indexPath)
                    Else
                        SendNotFound(response, "index.html not found")
                    End If
                Else
                    SendNotFound(response, $"File not found: {requestPath}")
                End If
            End If

        Catch ex As Exception
            Console.WriteLine($"❌ Erro ao processar {requestPath}: {ex.Message}")
            SendError(response, 500, "Internal Server Error")
        End Try
    End Sub

    Private Sub ServeFile(response As HttpListenerResponse, filePath As String)
        Try
            ' Ler arquivo
            Dim fileBytes = File.ReadAllBytes(filePath)
            Dim extension = Path.GetExtension(filePath).ToLower()

            ' Definir Content-Type
            Dim contentType = "application/octet-stream"
            If mimeTypes.ContainsKey(extension) Then
                contentType = mimeTypes(extension)
            End If

            ' Headers de resposta
            response.ContentType = contentType
            response.ContentLength64 = fileBytes.Length
            response.StatusCode = 200

            ' Headers de cache para arquivos estáticos
            If extension <> ".html" Then
                response.Headers.Add("Cache-Control", "public, max-age=31536000")
            Else
                response.Headers.Add("Cache-Control", "no-cache, no-store, must-revalidate")
            End If

            ' Enviar arquivo
            response.OutputStream.Write(fileBytes, 0, fileBytes.Length)
            response.Close()

        Catch ex As Exception
            Console.WriteLine($"❌ Erro ao servir arquivo {filePath}: {ex.Message}")
            SendError(response, 500, "Error serving file")
        End Try
    End Sub

    Private Sub SendNotFound(response As HttpListenerResponse, message As String)
        SendError(response, 404, message)
    End Sub

    Private Sub SendError(response As HttpListenerResponse, statusCode As Integer, message As String)
        Try
            response.StatusCode = statusCode
            response.ContentType = "text/plain; charset=utf-8"

            Dim responseBytes = Encoding.UTF8.GetBytes(message)
            response.ContentLength64 = responseBytes.Length
            response.OutputStream.Write(responseBytes, 0, responseBytes.Length)
            response.Close()

        Catch ex As Exception
            Console.WriteLine($"❌ Erro ao enviar erro: {ex.Message}")
            Try
                response.Close()
            Catch
                ' Ignorar erro ao fechar
            End Try
        End Try
    End Sub

    Public Sub [Stop]()
        Try
            Console.WriteLine()
            Console.WriteLine("🛑 Parando servidor...")

            cancellationTokenSource?.Cancel()
            listener?.Stop()
            listener?.Close()

            Console.WriteLine("✅ Servidor parado com sucesso!")

        Catch ex As Exception
            Console.WriteLine($"⚠️ Erro ao parar servidor: {ex.Message}")
        End Try
    End Sub
End Class


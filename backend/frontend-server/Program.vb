Imports System
Imports System.IO
Imports System.Reflection

Module Program
    Sub Main(args As String())
        Console.WriteLine("========================================")
        Console.WriteLine("    SUAT-IA Frontend Server v1.0")
        Console.WriteLine("    .NET Framework 4.7 - HTTP Server")
        Console.WriteLine("========================================")
        Console.WriteLine()

        Try
            ' Parâmetros
            Dim port As Integer = 8080
            Dim buildPath As String = "frontend\build"

            ' Processar argumentos da linha de comando
            If args.Length > 0 Then
                Integer.TryParse(args(0), port)
            End If

            If args.Length > 1 Then
                buildPath = args(1)
            End If

            ' Verificar se é caminho relativo
            If Not Path.IsPathRooted(buildPath) Then
                Dim exeDir = Path.GetDirectoryName(Assembly.GetExecutingAssembly().Location)
                buildPath = Path.Combine(exeDir, "..", "..", buildPath)
                buildPath = Path.GetFullPath(buildPath)
            End If

            ' Verificar se pasta build existe
            If Not Directory.Exists(buildPath) Then
                Console.WriteLine($"❌ ERRO: Pasta build não encontrada: {buildPath}")
                Console.WriteLine()
                Console.WriteLine("Uso: suat-frontend-server.exe [porta] [caminho-build]")
                Console.WriteLine("Exemplo: suat-frontend-server.exe 8080 ""C:\App\frontend\build""")
                Console.WriteLine()
                Console.WriteLine("Pressione qualquer tecla para sair...")
                Console.ReadKey()
                Return
            End If

            ' Iniciar servidor
            Dim server As New HttpServer(buildPath, port)
            server.Start()

        Catch ex As Exception
            Console.WriteLine($"❌ Erro fatal: {ex.Message}")
            Console.WriteLine()
            Console.WriteLine("Pressione qualquer tecla para sair...")
            Console.ReadKey()
        End Try
    End Sub
End Module



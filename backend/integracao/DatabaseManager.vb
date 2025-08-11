Imports System.Data.SQLite
Imports System.IO
Imports System.Collections.Generic
Imports System.Linq

''' <summary>
''' Classe responsável por gerenciar conexões e operações no banco SQLite
''' </summary>
Public Class DatabaseManager
    Private connection As SQLiteConnection
    Private databasePath As String
    
    Public Sub New(Optional dbPath As String = Nothing)
        If String.IsNullOrEmpty(dbPath) Then
            ' Caminho específico do banco de dados
            databasePath = "C:\Users\MAX\Documents\workspace\IA\backend\data\database.sqlite"
            
            ' Verificar se o arquivo existe
            If Not File.Exists(databasePath) Then
                Throw New FileNotFoundException(String.Format("Banco de dados SQLite não encontrado em: {0}", databasePath))
            End If
        Else
            databasePath = dbPath
        End If
    End Sub
    
    ''' <summary>
    ''' Conecta ao banco de dados SQLite
    ''' </summary>
    Public Function Conectar() As ConexaoResult
        Try
            If Not File.Exists(databasePath) Then
                Return New ConexaoResult With {
                    .Success = False,
                    .Mensagem = $"Arquivo de banco não encontrado: {databasePath}"
                }
            End If
            
            Dim connectionString As String = $"Data Source={databasePath};Version=3;"
            connection = New SQLiteConnection(connectionString)
            connection.Open()
            
            ' Verificar informações do banco
            Dim totalTabelas As Integer = 0
            Using cmd As New SQLiteCommand("SELECT COUNT(*) FROM sqlite_master WHERE type='table'", connection)
                totalTabelas = Convert.ToInt32(cmd.ExecuteScalar())
            End Using
            
            Dim fileInfo As New FileInfo(databasePath)
            
            Return New ConexaoResult With {
                .Success = True,
                .Mensagem = "Conexão estabelecida com sucesso",
                .TotalTabelas = totalTabelas,
                .TamanhoArquivo = fileInfo.Length
            }
            
        Catch ex As Exception
            Return New ConexaoResult With {
                .Success = False,
                .Mensagem = $"Erro ao conectar: {ex.Message}"
            }
        End Try
    End Function
    
    ''' <summary>
    ''' Verifica a estrutura do banco de dados
    ''' </summary>
    Public Function VerificarEstrutura() As VerificacaoResult
        Try
            If connection Is Nothing OrElse connection.State <> ConnectionState.Open Then
                Dim conexaoResult = Conectar()
                If Not conexaoResult.Success Then
                    Return New VerificacaoResult With {
                        .Success = False,
                        .Mensagem = conexaoResult.Mensagem
                    }
                End If
            End If
            
            Dim tabelas As New List(Of TabelaInfo)()
            
            ' Buscar todas as tabelas
            Using cmd As New SQLiteCommand("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name", connection)
                Using reader As SQLiteDataReader = cmd.ExecuteReader()
                    While reader.Read()
                        Dim nomeTabela As String = reader.GetString(0)
                        
                        ' Contar registros
                        Dim totalRegistros As Long = 0
                        Try
                            Using countCmd As New SQLiteCommand($"SELECT COUNT(*) FROM [{nomeTabela}]", connection)
                                totalRegistros = Convert.ToInt64(countCmd.ExecuteScalar())
                            End Using
                        Catch
                            ' Ignorar erros ao contar registros
                        End Try
                        
                        tabelas.Add(New TabelaInfo With {
                            .Nome = nomeTabela,
                            .Registros = totalRegistros
                        })
                    End While
                End Using
            End Using
            
            Return New VerificacaoResult With {
                .Success = True,
                .Mensagem = "Verificação concluída",
                .Tabelas = tabelas
            }
            
        Catch ex As Exception
            Return New VerificacaoResult With {
                .Success = False,
                .Mensagem = $"Erro na verificação: {ex.Message}"
            }
        End Try
    End Function
    
    ''' <summary>
    ''' Executa uma query SQL
    ''' </summary>
    Public Function ExecutarQuery(query As String) As QueryResult
        Try
            If connection Is Nothing OrElse connection.State <> ConnectionState.Open Then
                Dim conexaoResult = Conectar()
                If Not conexaoResult.Success Then
                    Return New QueryResult With {
                        .Success = False,
                        .Mensagem = conexaoResult.Mensagem
                    }
                End If
            End If
            
            Dim registros As New List(Of Dictionary(Of String, Object))()
            
            Using cmd As New SQLiteCommand(query, connection)
                Using reader As SQLiteDataReader = cmd.ExecuteReader()
                    While reader.Read()
                        Dim registro As New Dictionary(Of String, Object)()
                        
                        For i As Integer = 0 To reader.FieldCount - 1
                            Dim nomeColuna As String = reader.GetName(i)
                            Dim valor As Object = If(reader.IsDBNull(i), Nothing, reader.GetValue(i))
                            registro.Add(nomeColuna, valor)
                        Next
                        
                        registros.Add(registro)
                    End While
                End Using
            End Using
            
            Return New QueryResult With {
                .Success = True,
                .Mensagem = "Query executada com sucesso",
                .Registros = registros
            }
            
        Catch ex As Exception
            Return New QueryResult With {
                .Success = False,
                .Mensagem = $"Erro na query: {ex.Message}"
            }
        End Try
    End Function
    
    ''' <summary>
    ''' Fecha a conexão com o banco
    ''' </summary>
    Public Sub Desconectar()
        Try
            If connection IsNot Nothing AndAlso connection.State = ConnectionState.Open Then
                connection.Close()
                connection.Dispose()
                connection = Nothing
            End If
        Catch ex As Exception
            ' Ignorar erros ao desconectar
        End Try
    End Sub
    
    ''' <summary>
    ''' Destrutor da classe
    ''' </summary>
    Protected Overrides Sub Finalize()
        Desconectar()
        MyBase.Finalize()
    End Sub
End Class

' --- Classes de Resultado ---

Public Class ConexaoResult
    Public Property Success As Boolean
    Public Property Mensagem As String
    Public Property TotalTabelas As Integer
    Public Property TamanhoArquivo As Long
End Class

Public Class VerificacaoResult
    Public Property Success As Boolean
    Public Property Mensagem As String
    Public Property Tabelas As List(Of TabelaInfo)
End Class

Public Class QueryResult
    Public Property Success As Boolean
    Public Property Mensagem As String
    Public Property Registros As List(Of Dictionary(Of String, Object))
End Class

Public Class TabelaInfo
    Public Property Nome As String
    Public Property Registros As Long
End Class


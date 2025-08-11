Imports System.Data.SQLite
Imports System.IO
Imports System.Collections.Generic
Imports System.Linq

''' <summary>
''' Classe responsável pela sincronização de dados usando dados fixos para teste
''' Compatível com .NET Framework 4.7
''' </summary>
Public Class SincronizadorDados
    Private ReadOnly databasePath As String
    Private ReadOnly connectionString As String
    
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
        
        connectionString = String.Format("Data Source={0};Version=3;", databasePath)
    End Sub
    
    ''' <summary>
    ''' Executa sincronização de teste com dados fixos
    ''' </summary>
    Public Sub ExecutarSincronizacaoTeste()
        Console.WriteLine("🔄 Iniciando sincronização de teste...")
        
        Try
            Using connection As New SQLiteConnection(connectionString)
                connection.Open()
                
                ' Limpar dados existentes (opcional)
                Console.WriteLine("🧹 Limpando dados existentes...")
                LimparDadosExistentes(connection)
                
                ' Inserir dados de teste
                Console.WriteLine("📝 Inserindo dados de teste...")
                InserirDadosTeste(connection)
                
                ' Atualizar dados históricos
                Console.WriteLine("📊 Atualizando dados históricos...")
                AtualizarDadosHistoricos(connection)
                
                Console.WriteLine("✅ Sincronização de teste concluída!")
            End Using
            
        Catch ex As Exception
            Console.WriteLine(String.Format("❌ Erro na sincronização: {0}", ex.Message))
            Throw
        End Try
    End Sub
    
    ''' <summary>
    ''' Limpa dados existentes das tabelas
    ''' </summary>
    Private Sub LimparDadosExistentes(connection As SQLiteConnection)
        Try
            Using cmd As New SQLiteCommand("DELETE FROM incidents", connection)
                Dim registrosAfetados = cmd.ExecuteNonQuery()
                Console.WriteLine(String.Format("   🗑️ Removidos {0} registros da tabela incidents", registrosAfetados))
            End Using
            
            Using cmd As New SQLiteCommand("DELETE FROM historical_data", connection)
                Dim registrosAfetados = cmd.ExecuteNonQuery()
                Console.WriteLine(String.Format("   🗑️ Removidos {0} registros da tabela historical_data", registrosAfetados))
            End Using
            
        Catch ex As Exception
            Console.WriteLine(String.Format("   ⚠️ Erro ao limpar dados: {0}", ex.Message))
        End Try
    End Sub
    
    ''' <summary>
    ''' Insere dados de teste fixos
    ''' </summary>
    Private Sub InserirDadosTeste(connection As SQLiteConnection)
        ' Dados de teste - simulando incidentes reais
        Dim dadosTeste As New List(Of IncidenteTeste) From {
            New IncidenteTeste With {
                .Id = "INC001",
                .Assunto = "Problema de acesso ao sistema",
                .Departamento = "TI",
                .GrupoDirecionado = "Suporte Técnico",
                .Categoria = "Acesso",
                .Prioridade = "Alta",
                .DataCriacao = DateTime.Now.AddDays(-30),
                .DataEncerramento = DateTime.Now.AddDays(-25)
            },
            New IncidenteTeste With {
                .Id = "INC002",
                .Assunto = "Impressora não funciona",
                .Departamento = "Administrativo",
                .GrupoDirecionado = "Suporte Técnico",
                .Categoria = "Hardware",
                .Prioridade = "Média",
                .DataCriacao = DateTime.Now.AddDays(-25),
                .DataEncerramento = DateTime.Now.AddDays(-20)
            },
            New IncidenteTeste With {
                .Id = "INC003",
                .Assunto = "Erro no relatório mensal",
                .Departamento = "Financeiro",
                .GrupoDirecionado = "Desenvolvimento",
                .Categoria = "Software",
                .Prioridade = "Alta",
                .DataCriacao = DateTime.Now.AddDays(-20),
                .DataEncerramento = DateTime.Now.AddDays(-15)
            },
            New IncidenteTeste With {
                .Id = "INC004",
                .Assunto = "Internet lenta",
                .Departamento = "Vendas",
                .GrupoDirecionado = "Infraestrutura",
                .Categoria = "Rede",
                .Prioridade = "Média",
                .DataCriacao = DateTime.Now.AddDays(-15),
                .DataEncerramento = DateTime.Now.AddDays(-10)
            },
            New IncidenteTeste With {
                .Id = "INC005",
                .Assunto = "Backup não realizado",
                .Departamento = "TI",
                .GrupoDirecionado = "Infraestrutura",
                .Categoria = "Backup",
                .Prioridade = "Crítica",
                .DataCriacao = DateTime.Now.AddDays(-10),
                .DataEncerramento = DateTime.Now.AddDays(-5)
            },
            New IncidenteTeste With {
                .Id = "INC006",
                .Assunto = "Usuário não consegue fazer login",
                .Departamento = "RH",
                .GrupoDirecionado = "Suporte Técnico",
                .Categoria = "Acesso",
                .Prioridade = "Alta",
                .DataCriacao = DateTime.Now.AddDays(-5),
                .DataEncerramento = DateTime.Now.AddDays(-2)
            },
            New IncidenteTeste With {
                .Id = "INC007",
                .Assunto = "Sistema de email fora do ar",
                .Departamento = "Marketing",
                .GrupoDirecionado = "Infraestrutura",
                .Categoria = "Email",
                .Prioridade = "Crítica",
                .DataCriacao = DateTime.Now.AddDays(-2),
                .DataEncerramento = DateTime.Now.AddDays(-1)
            },
            New IncidenteTeste With {
                .Id = "INC008",
                .Assunto = "Atualização de software necessária",
                .Departamento = "Operações",
                .GrupoDirecionado = "Desenvolvimento",
                .Categoria = "Software",
                .Prioridade = "Baixa",
                .DataCriacao = DateTime.Now.AddDays(-1),
                .DataEncerramento = Nothing
            }
        }
        
        Dim registrosInseridos As Integer = 0
        
        For Each incidente In dadosTeste
            Try
                InserirIncidente(connection, incidente)
                registrosInseridos += 1
            Catch ex As Exception
                Console.WriteLine(String.Format("   ⚠️ Erro ao inserir incidente {0}: {1}", incidente.Id, ex.Message))
            End Try
        Next
        
        Console.WriteLine(String.Format("   ✅ Inseridos {0} incidentes de teste", registrosInseridos))
    End Sub
    
    ''' <summary>
    ''' Insere um incidente individual
    ''' </summary>
    Private Sub InserirIncidente(connection As SQLiteConnection, incidente As IncidenteTeste)
        Const insertSql As String = "
            INSERT INTO incidents (
                product_id, incident_date, DATA_CRIACAO, DATA_ENCERRAMENTO, 
                CATEGORIA, GRUPO_DIRECIONADO, PRIORIDADE, volume
            ) VALUES (
                @ProductId, @IncidentDate, @DataCriacao, @DataEncerramento, 
                @Categoria, @GrupoDirecionado, @Prioridade, 1
            )"
        
        Using cmd As New SQLiteCommand(insertSql, connection)
            cmd.Parameters.AddWithValue("@ProductId", incidente.GrupoDirecionado)
            cmd.Parameters.AddWithValue("@IncidentDate", incidente.DataCriacao.ToString("yyyy-MM-dd"))
            cmd.Parameters.AddWithValue("@DataCriacao", incidente.DataCriacao.ToString("o"))
            
            If incidente.DataEncerramento.HasValue Then
                cmd.Parameters.AddWithValue("@DataEncerramento", incidente.DataEncerramento.Value.ToString("o"))
            Else
                cmd.Parameters.AddWithValue("@DataEncerramento", DBNull.Value)
            End If
            
            cmd.Parameters.AddWithValue("@Categoria", incidente.Categoria)
            cmd.Parameters.AddWithValue("@GrupoDirecionado", incidente.GrupoDirecionado)
            cmd.Parameters.AddWithValue("@Prioridade", incidente.Prioridade)
            
            cmd.ExecuteNonQuery()
        End Using
    End Sub
    
    ''' <summary>
    ''' Atualiza a tabela de dados históricos
    ''' </summary>
    Private Sub AtualizarDadosHistoricos(connection As SQLiteConnection)
        Try
            ' Buscar dados agregados por grupo e data
            Const selectQuery As String = "
                SELECT 
                    GRUPO_DIRECIONADO as group_name,
                    incident_date as date,
                    CAST(COUNT(*) AS INTEGER) as volume,
                    CATEGORIA as category,
                    PRIORIDADE as priority
                FROM incidents 
                WHERE GRUPO_DIRECIONADO IS NOT NULL AND incident_date IS NOT NULL
                GROUP BY GRUPO_DIRECIONADO, incident_date
                ORDER BY incident_date DESC"
            
            Using cmd As New SQLiteCommand(selectQuery, connection)
                Using reader As SQLiteDataReader = cmd.ExecuteReader()
                    Dim registrosInseridos As Integer = 0
                    
                    While reader.Read()
                        Try
                            InserirDadoHistorico(connection, reader)
                            registrosInseridos += 1
                        Catch ex As Exception
                            Console.WriteLine(String.Format("   ⚠️ Erro ao inserir dado histórico: {0}", ex.Message))
                        End Try
                    End While
                    
                    Console.WriteLine(String.Format("   ✅ Inseridos {0} registros históricos", registrosInseridos))
                End Using
            End Using
            
        Catch ex As Exception
            Console.WriteLine(String.Format("   ⚠️ Erro ao atualizar dados históricos: {0}", ex.Message))
        End Try
    End Sub
    
    ''' <summary>
    ''' Insere um registro na tabela historical_data
    ''' </summary>
    Private Sub InserirDadoHistorico(connection As SQLiteConnection, reader As SQLiteDataReader)
        Const insertSql As String = "
            INSERT OR REPLACE INTO historical_data (
                product_id, date, volume, category, priority, group_name,
                resolution_time, created_at, updated_at
            ) VALUES (
                @ProductId, @Date, @Volume, @Category, @Priority, @GroupName,
                @ResolutionTime, datetime('now', 'localtime'), datetime('now', 'localtime')
            )"
        
        Using cmd As New SQLiteCommand(insertSql, connection)
            Dim groupName As String = reader.GetString(0) ' group_name
            Dim dateStr As String = reader.GetString(1) ' date
            Dim volume As Integer = Convert.ToInt32(reader.GetValue(2)) ' volume
            Dim category As String = reader.GetString(3) ' category
            Dim priority As String = reader.GetString(4) ' priority
            
            cmd.Parameters.AddWithValue("@ProductId", groupName)
            cmd.Parameters.AddWithValue("@Date", dateStr)
            cmd.Parameters.AddWithValue("@Volume", volume)
            cmd.Parameters.AddWithValue("@Category", category)
            cmd.Parameters.AddWithValue("@Priority", priority)
            cmd.Parameters.AddWithValue("@GroupName", groupName)
            cmd.Parameters.AddWithValue("@ResolutionTime", DBNull.Value) ' Não calculado para teste
            
            cmd.ExecuteNonQuery()
        End Using
    End Sub
End Class

' --- Classes de Apoio ---

Public Class IncidenteTeste
    Public Property Id As String
    Public Property Assunto As String
    Public Property Departamento As String
    Public Property GrupoDirecionado As String
    Public Property Categoria As String
    Public Property Prioridade As String
    Public Property DataCriacao As DateTime
    Public Property DataEncerramento As DateTime?
End Class

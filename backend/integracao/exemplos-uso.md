# Exemplos de Uso - DatabaseManager

## Métodos Especializados para INSERT, UPDATE e DELETE

### 1. ExecutarInsert

```vb
' Exemplo de inserção de um novo usuário
Dim dbManager As New DatabaseManager()
Dim dados As New Dictionary(Of String, Object)()
dados.Add("nome", "João Silva")
dados.Add("email", "joao@exemplo.com")
dados.Add("idade", 30)
dados.Add("ativo", True)

Dim resultado = dbManager.ExecutarInsert("usuarios", dados)

If resultado.Success Then
    Console.WriteLine($"Usuário inserido com sucesso. {resultado.LinhasAfetadas} linha(s) afetada(s)")
Else
    Console.WriteLine($"Erro: {resultado.Mensagem}")
End If
```

### 2. ExecutarUpdate

```vb
' Exemplo de atualização de um usuário
Dim dbManager As New DatabaseManager()
Dim dados As New Dictionary(Of String, Object)()
dados.Add("idade", 31)
dados.Add("ativo", False)

Dim condicao As String = "id = @id"
Dim parametrosCondicao As New Dictionary(Of String, Object)()
parametrosCondicao.Add("id", 1)

Dim resultado = dbManager.ExecutarUpdate("usuarios", dados, condicao, parametrosCondicao)

If resultado.Success Then
    Console.WriteLine($"Usuário atualizado com sucesso. {resultado.LinhasAfetadas} linha(s) afetada(s)")
Else
    Console.WriteLine($"Erro: {resultado.Mensagem}")
End If
```

### 3. ExecutarDelete

```vb
' Exemplo de exclusão de um usuário
Dim dbManager As New DatabaseManager()
Dim condicao As String = "id = @id"
Dim parametrosCondicao As New Dictionary(Of String, Object)()
parametrosCondicao.Add("id", 1)

Dim resultado = dbManager.ExecutarDelete("usuarios", condicao, parametrosCondicao)

If resultado.Success Then
    Console.WriteLine($"Usuário excluído com sucesso. {resultado.LinhasAfetadas} linha(s) afetada(s)")
Else
    Console.WriteLine($"Erro: {resultado.Mensagem}")
End If
```

### 4. ExecutarComando (Genérico)

```vb
' Exemplo de comando genérico
Dim dbManager As New DatabaseManager()
Dim query As String = "INSERT INTO logs (mensagem, data_criacao) VALUES (@mensagem, @data)"
Dim parametros As New Dictionary(Of String, Object)()
parametros.Add("mensagem", "Log de teste")
parametros.Add("data", DateTime.Now)

Dim resultado = dbManager.ExecutarComando(query, parametros)

If resultado.Success Then
    Console.WriteLine($"Comando executado com sucesso. {resultado.LinhasAfetadas} linha(s) afetada(s)")
Else
    Console.WriteLine($"Erro: {resultado.Mensagem}")
End If
```

## Características dos Métodos

### ExecutarInsert
- **Parâmetros:**
  - `tabela`: Nome da tabela onde inserir
  - `dados`: Dictionary com coluna/valor dos dados a inserir
- **Retorna:** `ComandoResult` com informações sobre o sucesso da operação
- **Segurança:** Usa parâmetros para evitar SQL injection

### ExecutarUpdate
- **Parâmetros:**
  - `tabela`: Nome da tabela a atualizar
  - `dados`: Dictionary com coluna/valor dos dados a atualizar
  - `condicao`: Cláusula WHERE (ex: "id = @id")
  - `parametrosCondicao`: Dictionary com parâmetros da condição
- **Retorna:** `ComandoResult` com informações sobre o sucesso da operação
- **Segurança:** Usa parâmetros para evitar SQL injection

### ExecutarDelete
- **Parâmetros:**
  - `tabela`: Nome da tabela de onde excluir
  - `condicao`: Cláusula WHERE (ex: "id = @id")
  - `parametrosCondicao`: Dictionary com parâmetros da condição
- **Retorna:** `ComandoResult` com informações sobre o sucesso da operação
- **Segurança:** Usa parâmetros para evitar SQL injection

### ExecutarComando
- **Parâmetros:**
  - `query`: Query SQL completa
  - `parametros`: Dictionary com parâmetros da query
- **Retorna:** `ComandoResult` com informações sobre o sucesso da operação
- **Uso:** Para comandos SQL customizados que não retornam dados

## Classe ComandoResult

```vb
Public Class ComandoResult
    Public Property Success As Boolean        ' Indica se a operação foi bem-sucedida
    Public Property Mensagem As String        ' Mensagem descritiva do resultado
    Public Property LinhasAfetadas As Integer ' Número de linhas afetadas pela operação
End Class
```

## Vantagens dos Métodos Especializados

1. **Segurança:** Proteção contra SQL injection através de parâmetros
2. **Simplicidade:** Interface mais limpa e fácil de usar
3. **Consistência:** Padrão uniforme para todas as operações
4. **Feedback:** Retorna informações detalhadas sobre o resultado
5. **Validação:** Verifica automaticamente a conexão e dados de entrada

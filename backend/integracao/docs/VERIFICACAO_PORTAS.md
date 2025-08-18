# Verificação e Liberação de Portas - SUAT-IA

## Visão Geral

O sistema SUAT-IA agora inclui uma funcionalidade automática para verificar e liberar portas antes de iniciar os serviços. Esta melhoria garante que as portas necessárias (3000 para backend e 8080 para frontend) estejam disponíveis antes de iniciar o sistema.

## Portas Utilizadas

- **Porta 3000**: Backend API (Node.js)
- **Porta 8080**: Frontend Server (HTTP Server .NET)

## Configuração

As portas são definidas como constantes no código para facilitar a manutenção:

```vb
Private Const BACKEND_PORT As Integer = 3000
Private Const FRONTEND_PORT As Integer = 8080
```

Para alterar as portas, modifique essas constantes no arquivo `UpdateManager.vb`.

## Funcionalidades Implementadas

### 1. Verificação Automática de Portas

O sistema agora verifica automaticamente se as portas estão em uso antes de iniciar qualquer serviço durante o processo de atualização.

### 2. Matança Automática de Processos

Se uma porta estiver em uso, o sistema:
1. Identifica quais processos estão usando a porta
2. Mata automaticamente esses processos
3. Verifica se a porta foi liberada
4. Continua com a inicialização

### 3. Método Público para Verificação Manual

```vb
' Verificar todas as portas do sistema
updateManager.VerificarPortasSistema()

' Verificar uma porta específica
updateManager.VerificarPortaEspecifica(3000)
updateManager.VerificarPortaEspecifica(8080)
```

## Como Funciona

### Detecção de Portas em Uso

O sistema usa o comando `netstat -ano` para identificar processos que estão usando as portas específicas:

```vb
Private Function IsPortaDisponivel(porta As Integer) As Boolean
    Try
        Dim listener = New Net.Sockets.TcpListener(Net.IPAddress.Any, porta)
        listener.Start()
        listener.Stop()
        Return True
    Catch
        Return False
    End Try
End Function
```

### Identificação de Processos

```vb
Private Sub MatarProcessosPorPorta(porta As Integer)
    ' Usar netstat para encontrar processos que usam a porta
    Dim startInfo As New ProcessStartInfo()
    startInfo.FileName = "netstat"
    startInfo.Arguments = $"-ano"
    ' ... processamento do output
End Sub
```

### Matança Segura de Processos

```vb
For Each pid In pidsParaMatar
    Try
        Dim proc = Process.GetProcessById(pid)
        RaiseEvent ProgressChanged(0, $"🔄 Matando processo {proc.ProcessName} (PID: {pid}) que usa porta {porta}")
        proc.Kill()
        proc.WaitForExit(3000)
    Catch ex As Exception
        RaiseEvent ProgressChanged(0, $"⚠️ Erro ao matar processo PID {pid}: {ex.Message}")
    End Try
Next
```

## Integração com o Sistema

### Durante Atualizações

A verificação de portas é executada automaticamente no início do processo de atualização:

```vb
Public Async Function AplicarAtualizacao(versionInfo As VersionInfo) As Task(Of UpdateResult)
    Try
        RaiseEvent ProgressChanged(0, "Iniciando atualização...")
        
        ' Verificar e liberar portas antes de iniciar
        VerificarELiberarPortas()
        
        ' ... resto do processo de atualização
    End Try
End Function
```

### Verificação Manual

Você pode verificar as portas manualmente a qualquer momento:

```vb
' Criar instância do UpdateManager
Dim updateManager As New UpdateManager()

' Adicionar handler para eventos de progresso
AddHandler updateManager.ProgressChanged, AddressOf OnProgressChanged

' Verificar portas
updateManager.VerificarPortasSistema()
```

## Eventos de Progresso

O sistema fornece feedback detalhado através de eventos:

- `🔍 Verificando portas em uso...`
- `⚠️ Porta 3000 está em uso. Matando processos...`
- `🔄 Matando processo node.exe (PID: 1234) que usa porta 3000`
- `✅ Porta 3000 liberada com sucesso`
- `❌ Não foi possível liberar a porta 3000`

## Benefícios

1. **Inicialização Confiável**: Garante que os serviços sempre iniciem sem conflitos de porta
2. **Automação**: Não requer intervenção manual para resolver conflitos
3. **Feedback Detalhado**: Informa exatamente o que está acontecendo
4. **Segurança**: Mata apenas processos que realmente estão usando as portas necessárias
5. **Compatibilidade**: Funciona com qualquer processo que use as portas 3000 ou 8080

## Considerações de Segurança

- O sistema só mata processos que estão efetivamente usando as portas 3000 ou 8080
- Usa `netstat -ano` para identificação precisa dos processos
- Aguarda até 3 segundos para cada processo terminar
- Fornece feedback detalhado sobre quais processos foram mortos

## Troubleshooting

### Se a porta não for liberada:

1. Verifique se o processo tem permissões especiais
2. Execute o sistema como Administrador
3. Verifique se há processos do sistema usando a porta
4. Consulte os logs de eventos para mais detalhes

### Logs de Erro Comuns:

- `❌ Não foi possível liberar a porta XXXX`: Processo não pôde ser morto
- `⚠️ Erro ao verificar porta XXXX`: Erro na execução do netstat
- `⚠️ Erro ao matar processo PID XXXX`: Erro ao finalizar processo específico

## Exemplo de Uso Completo

```vb
Public Class MainForm
    Private updateManager As New UpdateManager()
    
    Private Sub InitializeUpdateManager()
        ' Adicionar handler para eventos
        AddHandler updateManager.ProgressChanged, AddressOf OnUpdateProgress
    End Sub
    
    Private Sub OnUpdateProgress(percentage As Integer, status As String)
        ' Atualizar interface com o progresso
        UpdateProgressBar(percentage)
        UpdateStatusLabel(status)
    End Sub
    
    Private Sub VerificarPortasButton_Click()
        ' Verificar todas as portas do sistema
        updateManager.VerificarPortasSistema()
    End Sub
    
    Private Sub VerificarPortaBackendButton_Click()
        ' Verificar apenas a porta do backend
        updateManager.VerificarPortaEspecifica(3000)
    End Sub
    
    Private Sub VerificarPortaFrontendButton_Click()
        ' Verificar apenas a porta do frontend
        updateManager.VerificarPortaEspecifica(8080)
    End Sub
    
    Private Sub AtualizarSistemaButton_Click()
        ' Aplicar atualização (inclui verificação automática de portas)
        Dim result = Await updateManager.AplicarAtualizacao(versionInfo)
        If result.Success Then
            MessageBox.Show("Atualização concluída com sucesso!")
        End If
    End Sub
End Class
```

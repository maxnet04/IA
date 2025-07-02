import React, { useState, useEffect, useCallback } from 'react';
import {
    Grid,
    Typography,
    Box,
    Card,
    CardContent,
    CardHeader,
    Alert,
    Chip,
    CircularProgress,
    Button,
    Paper,
    Divider,
    ListItem,
    ListItemIcon,
    ListItemText,
    List,
    TextField,
    Stack,
    useTheme,
    LinearProgress
} from '@mui/material';
import {
    TrendingUp as TrendingUpIcon,
    Assessment as AssessmentIcon,
    Group,
    FilterList as FilterListIcon,
    Search as SearchIcon,
    Speed as SpeedIcon,
    CompareArrows as CompareArrowsIcon
} from '@mui/icons-material';
import MainLayout from '../../layouts/MainLayout';
import { useGroups, useGroupMetrics } from '../../../application/hooks/useGroups';
import GroupSelector from '../../components/GroupSelector';

const GroupAnalysisPage = () => {
    const theme = useTheme();
    const [selectedGroup, setSelectedGroup] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const { groups, loading: groupsLoading, error: groupsError } = useGroups();
    const { metrics, loadMetrics, loading: metricsLoading, clearMetrics } = useGroupMetrics();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [hasSearched, setHasSearched] = useState(false); // Estado para controlar se foi realizada uma busca
    const [loadedGroup, setLoadedGroup] = useState(''); // Estado para o grupo que foi efetivamente carregado/buscado

    const loadGroupData = useCallback(async (groupId) => {
        if (!groupId || groupId === 'ALL') return;
        
        // Validação das datas
        if (!startDate || !endDate) {
            setError('Por favor, selecione as datas de início e fim para realizar a pesquisa.');
            return;
        }
        
        if (new Date(startDate) > new Date(endDate)) {
            setError('A data de início deve ser anterior à data de fim.');
            return;
        }
        
        setLoading(true);
        setError(null);
        
        try {
            // Carregar métricas usando as datas selecionadas
            await loadMetrics(groupId, {
                startDate: startDate,
                endDate: endDate
            });
            
            // Marca o grupo como efetivamente carregado apenas após sucesso
            setLoadedGroup(groupId);
            
        } catch (error) {
            console.error('Erro ao carregar dados do grupo:', error);
            setError('Erro ao carregar dados do grupo');
        } finally {
            setLoading(false);
        }
    }, [startDate, endDate, loadMetrics]);

    const handleGroupSelection = (selection) => {
        setSelectedGroup(selection.value);
        // Não executa NENHUMA ação - aguarda o usuário clicar em "BUSCAR"
    };

    const handleSearch = () => {
        if (!selectedGroup) {
            setError('Por favor, selecione um grupo para realizar a pesquisa.');
            return;
        }
        
        // Marca que uma busca foi iniciada
        setHasSearched(true);
        
        // Limpar completamente todos os dados anteriores antes de carregar novos
        setError(null);
        clearMetrics();
        setLoadedGroup(''); // Limpa o grupo carregado para evitar mostrar dados antigos
        
        if (selectedGroup !== 'ALL') {
            loadGroupData(selectedGroup);
        }
    };

    const getSelectedGroupData = () => {
        if (!loadedGroup || loadedGroup === 'ALL') return null;
        return groups.find(g => g.group_id === loadedGroup);
    };

    const renderGroupSummary = () => {
        const groupData = getSelectedGroupData();
        if (!groupData || !metrics) {
            return null;
        }
        
        return (
            <Grid item xs={12}>
                <Paper
                    elevation={3}
                    sx={{ 
                        mb: 2, 
                        p: 3, 
                        borderRadius: 1,
                        background: theme.palette.background.paper,
                        boxShadow: theme.shadows[3],
                        position: 'relative',
                        '&::before': {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '4px',
                            height: '100%',
                            backgroundColor: theme.palette.warning.main,
                            borderRadius: '4px 0 0 4px'
                        }
                    }}
                >
                    <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
                        <Group color="warning" />
                        <Typography variant="h6">Resumo do Grupo: {groupData.group_name || groupData.group_id}</Typography>
                    </Stack>
                    
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={3}>
                            <Box sx={{ 
                                textAlign: 'center', 
                                p: 2, 
                                bgcolor: 'rgba(76, 175, 80, 0.1)', 
                                borderRadius: 1,
                                border: '1px solid rgba(76, 175, 80, 0.3)'
                            }}>
                                <Typography variant="h4" color="success.main" fontWeight={600}>
                                    {metrics?.groupDetails?.total_incidents || 0}
                                </Typography>
                                <Typography variant="body2" color="textSecondary">
                                    Total de Incidentes (Histórico)
                                </Typography>
                            </Box>
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <Box sx={{ 
                                textAlign: 'center', 
                                p: 2, 
                                bgcolor: 'rgba(33, 150, 243, 0.1)', 
                                borderRadius: 1,
                                border: '1px solid rgba(33, 150, 243, 0.3)'
                            }}>
                                <Typography variant="h4" color="primary.main" fontWeight={600}>
                                    {metrics?.metrics?.dataPoints || metrics?.metrics?.total_records || 0}
                                </Typography>
                                <Typography variant="body2" color="textSecondary">
                                    Dias analisados
                                </Typography>
                            </Box>
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <Box sx={{ 
                                textAlign: 'center', 
                                p: 2, 
                                bgcolor: 'rgba(255, 152, 0, 0.1)', 
                                borderRadius: 1,
                                border: '1px solid rgba(255, 152, 0, 0.3)'
                            }}>
                                <Typography variant="h4" color="warning.main" fontWeight={600}>
                                    {metrics?.metrics?.daysWithoutIncidents ?? 0}
                                </Typography>
                                <Typography variant="body2" color="textSecondary">
                                    Dias sem incidentes
                                </Typography>
                            </Box>
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <Box sx={{ 
                                textAlign: 'center', 
                                p: 2, 
                                bgcolor: 'rgba(156, 39, 176, 0.1)', 
                                borderRadius: 1,
                                border: '1px solid rgba(156, 39, 176, 0.3)'
                            }}>
                                <Chip
                                    label={groupData.status || 'Ativo'}
                                    color={groupData.status === 'Ativo' ? 'success' : 'default'}
                                    sx={{ fontSize: '1rem', fontWeight: 600, px: 2, py: 1 }}
                                />
                                <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                                    Status Atual
                                </Typography>
                            </Box>
                        </Grid>
                    </Grid>
                </Paper>
            </Grid>
        );
    };

    const renderPerformanceAnalysis = () => {
        if (!metrics || !metrics.metrics?.totalVolume) {
            return null; // Não renderiza nada se não tiver dados
        }

        return (
            <Grid container spacing={3}>
                {/* Métricas de Performance */}
                <Grid item xs={12} md={6}>
                    <Card sx={{ height: '100%' }}>
                        <CardHeader
                            avatar={<SpeedIcon color="primary" />}
                            title="Indicadores de Performance"
                            subheader="Métricas operacionais do grupo"
                        />
                        <CardContent>
                            <Stack spacing={3}>
                                <Box>
                                    <Typography variant="body2" color="textSecondary" gutterBottom>
                                        Volume Total
                                    </Typography>
                                    <Typography variant="h5" color="primary.main" fontWeight={600}>
                                        {metrics.metrics?.totalVolume || 'N/A'}
                                    </Typography>
                                    <Typography variant="caption" color="textSecondary">
                                        incidentes no período
                                    </Typography>
                                </Box>
                                
                                <Divider />
                                
                                <Box>
                                    <Typography variant="body2" color="textSecondary" gutterBottom>
                                        Volume Médio Diário
                                    </Typography>
                                    <Typography variant="h5" color="success.main" fontWeight={600}>
                                        {metrics.metrics?.averageVolume || 'N/A'}
                                    </Typography>
                                    <Typography variant="caption" color="textSecondary">
                                        incidentes por dia
                                    </Typography>
                                </Box>
                                
                                <Divider />
                                
                                <Box>
                                    <Typography variant="body2" color="textSecondary" gutterBottom>
                                        Anomalias Detectadas
                                    </Typography>
                                    <Typography variant="h5" color="warning.main" fontWeight={600}>
                                        {metrics.metrics?.anomalies || 0}
                                    </Typography>
                                    <Typography variant="caption" color="textSecondary">
                                        dias com comportamento anômalo
                                    </Typography>
                                </Box>
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Tendências e Capacidade */}
                <Grid item xs={12} md={6}>
                    <Card sx={{ height: '100%' }}>
                        <CardHeader
                            avatar={<TrendingUpIcon color="success" />}
                            title="Análise de Tendências"
                            subheader="Evolução e projeções"
                        />
                        <CardContent>
                            <Stack spacing={3}>
                                <Box>
                                    <Typography variant="body2" color="textSecondary" gutterBottom>
                                        Tendência de Volume
                                    </Typography>
                                    <Box display="flex" alignItems="center" gap={1}>
                                        {typeof metrics.metrics?.trend === 'number' ? (
                                            <>
                                                {metrics.metrics.trend > 0 ? (
                                                    <TrendingUpIcon color="success" />
                                                ) : metrics.metrics.trend < 0 ? (
                                                    <TrendingUpIcon color="error" sx={{ transform: 'rotate(180deg)' }} />
                                                ) : (
                                                    <TrendingUpIcon color="default" />
                                                )}
                                                <Typography 
                                                    variant="h5" 
                                                    color={metrics.metrics.trend > 0 ? "success.main" : metrics.metrics.trend < 0 ? "error.main" : "textSecondary"} 
                                                    fontWeight={600}
                                                >
                                                    {metrics.metrics.trend > 0 ? '+' : ''}{(metrics.metrics.trend * 100).toFixed(1)}%
                                                </Typography>
                                            </>
                                        ) : (
                                            <Typography variant="h5" color="textSecondary" fontWeight={600}>
                                                N/A
                                            </Typography>
                                        )}
                                    </Box>
                                    {metrics.metrics?.trend && (
                                        <Typography variant="caption" color="textSecondary">
                                            tendência do período
                                        </Typography>
                                    )}
                                </Box>
                                
                                <Divider />
                                
                                <Box>
                                    <Typography variant="body2" color="textSecondary" gutterBottom>
                                        Volume Máximo
                                    </Typography>
                                    <Typography variant="h5" color="warning.main" fontWeight={600}>
                                        {metrics.metrics?.maxVolume || 'N/A'}
                                    </Typography>
                                    <Typography variant="caption" color="textSecondary">
                                        pico de incidentes em um dia
                                    </Typography>
                                </Box>
                                
                                <Divider />
                                
                                <Box>
                                    <Typography variant="body2" color="textSecondary" gutterBottom>
                                        Volume Mínimo
                                    </Typography>
                                    <Typography variant="h5" color="info.main" fontWeight={600}>
                                        {metrics.metrics?.minVolume || 'N/A'}
                                    </Typography>
                                    <Typography variant="caption" color="textSecondary">
                                        menor volume em um dia
                                    </Typography>
                                </Box>
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Análise Comparativa */}
                <Grid item xs={12}>
                    <Card>
                        <CardHeader
                            avatar={<CompareArrowsIcon color="secondary" />}
                            title="Comparação com Outros Grupos"
                            subheader="Posicionamento relativo do grupo"
                        />
                        <CardContent>
                                        {groups.length > 0 ? (
                <Grid container spacing={2}>
                    {groups.slice(0, 4).map((group, index) => (
                                        <Grid item xs={12} md={3} key={group.group_id || index}>
                                            <Paper 
                                                elevation={group.group_id === loadedGroup ? 3 : 1}
                                                sx={{ 
                                                    p: 2, 
                                                    textAlign: 'center',
                                                    border: group.group_id === loadedGroup ? `2px solid ${theme.palette.primary.main}` : 'none',
                                                    bgcolor: group.group_id === loadedGroup ? 'rgba(25, 118, 210, 0.05)' : 'transparent'
                                                }}
                                            >
                                                <Typography variant="h6" fontWeight={600} gutterBottom>
                                                    {group.group_name || group.group_id}
                                                </Typography>
                                                <Typography variant="h4" color="primary.main" fontWeight={600}>
                                                    {group.total_incidents || 0}
                                                </Typography>
                                                <Typography variant="caption" color="textSecondary">
                                                    Total de Incidentes
                                                </Typography>
                                                <Box mt={1}>
                                                    <Chip
                                                        label={group.group_id === loadedGroup ? 'Carregado' : 'Comparar'}
                                                        size="small"
                                                        color={group.group_id === loadedGroup ? 'primary' : 'default'}
                                                    />
                                                </Box>
                                            </Paper>
                                        </Grid>
                                    ))}
                                </Grid>
                            ) : (
                                <Alert severity="info">
                                    Dados comparativos não disponíveis no momento.
                                </Alert>
                            )}
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        );
    };

    useEffect(() => {
        // Definir datas padrão que existem nos dados históricos
        const endDateDefault = '2025-05-06'; // Última data com dados disponíveis
        const startDateDefault = '2025-04-06'; // Um mês antes (baseado nos dados do banco)
        
        setEndDate(endDateDefault);
        setStartDate(startDateDefault);
    }, []);

    // Efeito para carregar automaticamente quando grupos estão disponíveis
    useEffect(() => {
        if (groups.length > 0 && !selectedGroup && !hasSearched && startDate && endDate) {
            // Seleciona o primeiro grupo da lista
            const firstGroup = groups[0];
            setSelectedGroup(firstGroup.group_id);
            setHasSearched(true);
            
            // Carrega dados automaticamente
            setTimeout(() => {
                loadGroupData(firstGroup.group_id);
            }, 100); // Pequeno delay para garantir que os estados sejam atualizados
        }
    }, [groups, selectedGroup, hasSearched, startDate, endDate, loadGroupData]);

    return (
        <MainLayout>
            <Box 
                sx={{ 
                    py: 1, 
                    px: 0, 
                    width: '100%', 
                    maxWidth: '98%',
                    margin: '0 auto',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center'
                }}
            >
                {/* Header */}
                <Typography variant="h4" sx={{ 
                    mb: 2, 
                    display: 'flex', 
                    alignItems: 'center',
                    width: '100%',
                    maxWidth: '98%',
                    px: 1
                }}>
                    <Group color="primary" sx={{ mr: 1 }} /> 
                    Análise por Grupos
                </Typography>
                
                <Grid container spacing={2} sx={{ 
                    width: '100%', 
                    maxWidth: '98%',
                    margin: '0 auto',
                    justifyContent: 'center'
                }}>
                    {/* Filtros de Pesquisa */}
                    <Grid item xs={12}>
                        <Paper
                            elevation={3}
                            sx={{ 
                                mb: 2, 
                                p: 2, 
                                borderRadius: 1,
                                background: theme.palette.background.paper,
                                boxShadow: theme.shadows[3],
                                position: 'relative',
                                '&::before': {
                                    content: '""',
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '4px',
                                    height: '100%',
                                    backgroundColor: theme.palette.primary.main,
                                    borderRadius: '4px 0 0 4px'
                                }
                            }}
                        >
                            <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                                <FilterListIcon color="primary" />
                                <Typography variant="h6">Filtros de Pesquisa</Typography>
                            </Stack>
                            <Divider sx={{ mb: 2 }} />
                                <Grid container spacing={2} alignItems="center">
                                    <Grid item xs={12} md={3}>
                                        <TextField
                                            fullWidth
                                            label="Data Inicial"
                                            type="date"
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                            InputLabelProps={{
                                                shrink: true,
                                            }}
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={3}>
                                        <TextField
                                            fullWidth
                                            label="Data Final"
                                            type="date"
                                            value={endDate}
                                            onChange={(e) => setEndDate(e.target.value)}
                                            InputLabelProps={{
                                                shrink: true,
                                            }}
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={4}>
                <GroupSelector
                    value={selectedGroup}
                    onChange={handleGroupSelection}
                                            label="Grupo"
                                            groups={groups}
                                            loading={groupsLoading}
                                            error={groupsError}
                                            hideAllOption={true}
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={2}>
                                        <Button
                                            fullWidth
                                            variant="contained"
                                            onClick={handleSearch}
                                            disabled={loading || groupsLoading}
                                            sx={{ 
                                                height: '56px',
                                                bgcolor: 'rgb(17, 82, 147)',
                                                '&:hover': {
                                                    bgcolor: 'rgb(14, 67, 120)'
                                                }
                                            }}
                                            startIcon={(loading || groupsLoading) ? <CircularProgress size={20} color="inherit" /> : <SearchIcon />}
                                        >
                                            {(loading || groupsLoading) ? 'CARREGANDO...' : 'BUSCAR'}
                                        </Button>
                                    </Grid>
                                </Grid>
            {groupsError && (
                                    <Alert severity="error" sx={{ mt: 2 }}>
                    {groupsError}
                </Alert>
            )}
                        </Paper>
                    </Grid>

                    {/* Estado de Loading Durante Busca */}
                    {(loading || groupsLoading) && (
                        <Grid item xs={12}>
                            <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" py={8}>
                                <CircularProgress size={60} sx={{ mb: 2 }} />
                                <Typography variant="h6" color="textSecondary" sx={{ mb: 1 }}>
                                    {groupsLoading ? 'Carregando grupos...' : 'Carregando dados do grupo...'}
                                </Typography>
                                <Typography variant="body2" color="textSecondary">
                                    Aguarde enquanto processamos as informações
                                </Typography>
                            </Box>
                        </Grid>
                    )}

                    {/* Resumo do Grupo Selecionado */}
                    {!loading && !groupsLoading && hasSearched && loadedGroup !== 'ALL' && (
                        renderGroupSummary()
                    )}

                    {/* Análise de Performance */}
                    {!loading && !groupsLoading && hasSearched && loadedGroup && loadedGroup !== 'ALL' && metrics && metrics.metrics?.totalVolume && (
                        <Grid item xs={12}>
                            <Card sx={{ 
                                borderLeft: `4px solid rgb(17, 82, 147)`,
                                borderRadius: 1,
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                    boxShadow: theme.shadows[8]
                                }
                            }}>
                                <CardHeader
                                    avatar={<AssessmentIcon color="primary" />}
                                    title="Análise de Performance do Grupo"
                                    subheader="Métricas detalhadas e comparações"
                                />
                                <CardContent>
                                    {error ? (
                                        <Alert severity="error">{error}</Alert>
                                    ) : (
                                        renderPerformanceAnalysis()
                                    )}
                                </CardContent>
                            </Card>
                        </Grid>
                    )}
                </Grid>
            </Box>
        </MainLayout>
    );
};

export default GroupAnalysisPage; 
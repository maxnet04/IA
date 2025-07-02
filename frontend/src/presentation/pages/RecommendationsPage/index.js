import React, { useState, useEffect } from 'react';
import { 
    Box, 
    Grid, 
    Card, 
    CardContent, 
    CardHeader, 
    TextField, 
    Button, 
    Alert, 
    CircularProgress, 
    List, 
    ListItem, 
    ListItemText, 
    ListItemIcon, 
    Chip, 
    Stack, 
    Typography,
    Divider,
    Paper,
    IconButton,
    Tooltip,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    useTheme
} from '@mui/material';
import { 
    Lightbulb as RecommendationIcon, 
    FilterList as FilterIcon, 
    TrendingUp as TrendingUpIcon,
    Info as InfoIcon,
    Timeline as TimelineIcon,
    ArrowUpward as ArrowUpIcon,
    CalendarMonth as CalendarIcon,
    Refresh as RefreshIcon,
    Category as CategoryIcon
} from '@mui/icons-material';
import MainLayout from '../../layouts/MainLayout';
import useRecommendations from '../../../application/hooks/useRecommendations';
import { useGroups } from '../../../application/hooks/useGroups';
import GroupSelector from '../../components/GroupSelector';

const RecommendationsPage = () => {
    const theme = useTheme();
    
    // Hook para grupos
    const { groups, loading: groupsLoading, error: groupsError } = useGroups();
    
    // Hook para recomendações
        const { 
        recommendations, 
        loading, 
        error, 
        category,
        limit,
        filterByCategory,
        changeLimit,
        changeGroup,
        changeDate,
        refreshRecommendations
    } = useRecommendations();

    const [groupId, setGroupId] = useState('ALL');
    const [selectedDate, setSelectedDate] = useState('');
    const [priorityFilter, setPriorityFilter] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');

    useEffect(() => {
        // Obter a data atual para valor padrão
        const hoje = new Date();
        
        const formatarData = (data) => {
            const ano = data.getFullYear();
            const mes = String(data.getMonth() + 1).padStart(2, '0');
            const dia = String(data.getDate()).padStart(2, '0');
            return `${ano}-${mes}-${dia}`;
        };
        
        const dataAtualFormatada = formatarData(hoje);
        
        // Atualizar os estados com a data padrão
        setSelectedDate(dataAtualFormatada);
        
        // Carregar recomendações na inicialização com parâmetros corretos
        changeGroup('ALL');
        changeDate(dataAtualFormatada);
        changeLimit(10);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSearch = () => {
        // Atualizar parâmetros e buscar recomendações
        changeGroup(groupId || 'ALL');
        changeDate(selectedDate);
        if (categoryFilter) {
            filterByCategory(categoryFilter);
        } else {
            filterByCategory('');
        }
    };

    const handleRefresh = () => {
        refreshRecommendations();
    };

    const handleGroupIdChange = (selection) => {
        setGroupId(selection.value);
    };

    // Função que retorna a cor baseada na prioridade
    const getPriorityColor = (priority) => {
        if (!priority) return 'primary';
        
        switch (priority.toLowerCase()) {
            case 'alta':
                return 'error';
            case 'média':
                return 'warning';
            case 'baixa':
                return 'success';
            default:
                return 'primary';
        }
    };

    // Função que retorna a cor baseada na categoria
    const getCategoryColor = (category) => {
        if (!category) return 'primary';
        
        switch (category) {
            case 'Capacidade':
                return 'primary';
            case 'Recursos':
                return 'success';
            case 'Planejamento':
                return 'secondary';
            case 'Anomalias':
                return 'error';
            case 'Fatores de Influência':
                return 'warning';
            case 'Análise':
                return 'info';
            case 'Estratégia':
                return 'secondary';
            default:
                return 'primary'; // Garantir um valor padrão válido
        }
    };

    // Função que retorna o ícone baseado na categoria
    const getCategoryIcon = (category) => {
        switch (category) {
            case 'Capacidade':
                return <TrendingUpIcon />;
            case 'Recursos':
                return <ArrowUpIcon />;
            case 'Estratégia':
                return <TimelineIcon />;
            default:
                return <CategoryIcon />;
        }
    };

    // Filtrar recomendações com base nos filtros selecionados
    const filteredRecommendations = recommendations.filter(recommendation => {
        if (priorityFilter && recommendation.priority !== priorityFilter) return false;
        if (categoryFilter && recommendation.category !== categoryFilter) return false;
        return true;
    });

    // Agrupar recomendações por categoria para estatísticas
    const categoryStats = recommendations.reduce((stats, recommendation) => {
        if (recommendation.category) {
            stats[recommendation.category] = (stats[recommendation.category] || 0) + 1;
        }
        return stats;
    }, {});

    // Agrupar recomendações por prioridade para estatísticas
    const priorityStats = recommendations.reduce((stats, recommendation) => {
        if (recommendation.priority) {
            stats[recommendation.priority] = (stats[recommendation.priority] || 0) + 1;
        }
        return stats;
    }, {});

    return (
        <MainLayout>
            <Box sx={{ 
                py: 1, 
                px: 0, 
                width: '100%', 
                maxWidth: '98%',
                margin: '0 auto',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
            }}>
                <Typography variant="h4" sx={{ 
                    mb: 2, 
                    display: 'flex', 
                    alignItems: 'center',
                    width: '100%',
                    maxWidth: '98%',
                    px: 1
                }}>
                    <RecommendationIcon color="primary" sx={{ mr: 1 }} /> 
                    Recomendações Baseadas em Dados
                </Typography>

                {/* Filtros */}
                <Grid container spacing={2} sx={{ mb: 2, width: '100%', maxWidth: '98%', margin: '0 auto' }}>
                    <Grid item xs={12}>
                        <Card sx={{ 
                            borderLeft: '4px solid #607d8b',
                            borderRadius: 1,
                            transition: 'all 0.3s ease',
                            '&:hover': {
                                boxShadow: '0 6px 12px rgba(96, 125, 139, 0.15)'
                            }
                        }}>
                            <CardHeader 
                                title="Filtros" 
                                avatar={<FilterIcon color="primary" />}
                            />
                            <CardContent>
                                <Grid container spacing={2} alignItems="center" sx={{ justifyContent: 'center' }}>
                                    <Grid item xs={12} md={3}>
                                        <GroupSelector
                                            value={groupId}
                                            onChange={handleGroupIdChange}
                                            label="Selecionar Grupo"
                                            variant="outlined"
                                            groups={groups}
                                            loading={groupsLoading}
                                            error={groupsError}
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={3}>
                                        <TextField
                                            fullWidth
                                            type="date"
                                            label="Data de Referência"
                                            value={selectedDate}
                                            onChange={(e) => setSelectedDate(e.target.value)}
                                            InputLabelProps={{ shrink: true }}
                                            variant="outlined"
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={2}>
                                        <FormControl fullWidth variant="outlined">
                                            <InputLabel id="priority-select-label">Prioridade</InputLabel>
                                                <Select
                                                labelId="priority-select-label"
                                                value={priorityFilter}
                                                onChange={(e) => setPriorityFilter(e.target.value)}
                                                label="Prioridade"
                                            >
                                                <MenuItem value="">Todas</MenuItem>
                                                <MenuItem value="Alta">Alta</MenuItem>
                                                <MenuItem value="Média">Média</MenuItem>
                                                <MenuItem value="Baixa">Baixa</MenuItem>
                                                </Select>
                                            </FormControl>
                                        </Grid>
                                    <Grid item xs={12} md={2}>
                                        <FormControl fullWidth variant="outlined">
                                            <InputLabel id="category-select-label">Categoria</InputLabel>
                                            <Select
                                                labelId="category-select-label"
                                                value={categoryFilter}
                                                onChange={(e) => setCategoryFilter(e.target.value)}
                                                label="Categoria"
                                            >
                                                <MenuItem value="">Todas</MenuItem>
                                                <MenuItem value="Capacidade">Capacidade</MenuItem>
                                                <MenuItem value="Recursos">Recursos</MenuItem>
                                                <MenuItem value="Planejamento">Planejamento</MenuItem>
                                                <MenuItem value="Anomalias">Anomalias</MenuItem>
                                                <MenuItem value="Fatores de Influência">Fatores de Influência</MenuItem>
                                                <MenuItem value="Análise">Análise</MenuItem>
                                                <MenuItem value="Estratégia">Estratégia</MenuItem>
                                            </Select>
                                        </FormControl>
                                        </Grid>
                                    <Grid item xs={12} md={2}>
                                            <Button
                                                fullWidth
                                                variant="contained"
                                                onClick={handleSearch}
                                            disabled={loading}
                                                sx={{ height: '56px' }}
                                            >
                                            {loading ? <CircularProgress size={24} /> : 'Buscar'}
                                            </Button>
                                        </Grid>
                                    </Grid>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                {error && (
                    <Alert severity="error" sx={{ mb: 3 }}>
                        {error}
                    </Alert>
                )}

                {/* Dashboard de resumo */}
                {recommendations && recommendations.length > 0 && (
                    <Grid container spacing={2} sx={{ mb: 5, width: '100%', maxWidth: '98%', margin: '0 auto' }}>
                        <Grid item xs={12} md={4}>
                            <Paper 
                                elevation={2} 
                                sx={{ 
                                    p: 2, 
                                    height: '100%', 
                                    borderRadius: 2,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    borderLeft: `4px solid ${theme.palette.primary.main}`,
                                    transition: 'all 0.3s ease',
                                    '&:hover': {
                                        transform: 'translateY(-5px)',
                                        boxShadow: theme.shadows[8],
                                        borderLeft: `6px solid ${theme.palette.primary.main}`
                                    }
                                }}
                            >
                                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                                    <CategoryIcon sx={{ mr: 1 }} color="primary" />
                                    Recomendações por Categoria
                                </Typography>
                                <Divider sx={{ mb: 2 }} />
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                    {Object.entries(categoryStats).map(([cat, count]) => {
                                        const colorName = getCategoryColor(cat);
                                        // Verificar se a cor existe no tema antes de usá-la
                                        const color = theme.palette[colorName]?.main || theme.palette.primary.main;
                                        const lightColor = theme.palette[colorName]?.light || theme.palette.primary.light;
                                        
                                        return (
                                            <Paper 
                                                key={cat} 
                                                sx={{ 
                                                    p: 1.5, 
                                                    display: 'flex', 
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    borderRadius: 1,
                                                    bgcolor: theme.palette.background.paper,
                                                    color: color,
                                                    border: `1px solid ${lightColor}`,
                                                    transition: 'all 0.2s ease',
                                                    '&:hover': {
                                                        transform: 'translateX(5px)',
                                                        boxShadow: `0 4px 8px rgba(0,0,0,0.1)`,
                                                        cursor: 'pointer'
                                                    }
                                                }}
                                                onClick={() => setCategoryFilter(categoryFilter === cat ? '' : cat)}
                                            >
                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                    {getCategoryIcon(cat)}
                                                    <Typography variant="body1" sx={{ ml: 1, fontWeight: 'medium' }}>
                                                        {cat || 'Sem categoria'}
                                                    </Typography>
                                                </Box>
                                                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                                    {count}
                                                </Typography>
                                            </Paper>
                                        );
                                    })}
                                </Box>
                            </Paper>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Paper 
                                elevation={2} 
                                sx={{ 
                                    p: 2, 
                                    height: '100%', 
                                    borderRadius: 2,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    borderLeft: `4px solid ${theme.palette.warning.main}`,
                                    transition: 'all 0.3s ease',
                                    '&:hover': {
                                        transform: 'translateY(-5px)',
                                        boxShadow: theme.shadows[8],
                                        borderLeft: `6px solid ${theme.palette.warning.main}`
                                    }
                                }}
                            >
                                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                                    <TimelineIcon sx={{ mr: 1 }} color="warning" />
                                    Recomendações por Prioridade
                                </Typography>
                                <Divider sx={{ mb: 2 }} />
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                    {Object.entries(priorityStats).map(([priority, count]) => {
                                        const colorName = getPriorityColor(priority);
                                        // Verificar se a cor existe no tema antes de usá-la
                                        const color = theme.palette[colorName]?.main || theme.palette.primary.main;
                                        const lightColor = theme.palette[colorName]?.light || theme.palette.primary.light;
                                        
                                        return (
                                            <Paper 
                                                key={priority} 
                                                sx={{ 
                                                    p: 1.5, 
                                                    display: 'flex', 
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    borderRadius: 1,
                                                    bgcolor: theme.palette.background.paper,
                                                    color: color,
                                                    border: `1px solid ${lightColor}`,
                                                    transition: 'all 0.2s ease',
                                                    '&:hover': {
                                                        transform: 'translateX(5px)',
                                                        boxShadow: `0 4px 8px rgba(0,0,0,0.1)`,
                                                        cursor: 'pointer'
                                                    }
                                                }}
                                                onClick={() => setPriorityFilter(priorityFilter === priority ? '' : priority)}
                                            >
                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                    <RecommendationIcon />
                                                    <Typography variant="body1" sx={{ ml: 1, fontWeight: 'medium' }}>
                                                        {priority || 'Não definida'}
                                                    </Typography>
                                                </Box>
                                                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                                    {count}
                                                </Typography>
                                            </Paper>
                                        );
                                    })}
                                </Box>
                            </Paper>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Paper 
                                elevation={2} 
                                sx={{ 
                                    p: 2, 
                                    height: '100%', 
                                    borderRadius: 2, 
                                    display: 'flex',
                                    flexDirection: 'column',
                                    borderLeft: `4px solid ${theme.palette.info.main}`,
                                    transition: 'all 0.3s ease',
                                    '&:hover': {
                                        transform: 'translateY(-5px)',
                                        boxShadow: theme.shadows[8],
                                        borderLeft: `6px solid ${theme.palette.info.main}`
                                    }
                                }}
                            >
                                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                                    <CalendarIcon sx={{ mr: 1 }} color="info" />
                                    Resumo da Análise
                                </Typography>
                                <Divider sx={{ mb: 2 }} />
                                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                    <Typography variant="body1" sx={{ textAlign: 'center', mb: 1 }}>
                                        Data de referência:
                                    </Typography>
                                    <Typography variant="h6" sx={{ textAlign: 'center', fontWeight: 'bold', mb: 2 }}>
                                        {selectedDate ? new Date(selectedDate).toLocaleDateString('pt-BR') : '(Não definida)'}
                                    </Typography>
                                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 1 }}>
                                        <Paper sx={{ 
                                            p: 1.5, 
                                            borderRadius: 1, 
                                            bgcolor: 'background.paper', 
                                            border: '1px solid rgba(0,0,0,0.1)', 
                                            textAlign: 'center', 
                                            width: '33%',
                                            transition: 'all 0.2s ease',
                                            '&:hover': {
                                                transform: 'translateY(-3px)',
                                                boxShadow: `0 4px 8px rgba(0,0,0,0.1)`,
                                            }
                                        }}>
                                            <Typography variant="body2" color="text.secondary">Total</Typography>
                                            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>{recommendations.length}</Typography>
                                        </Paper>
                                        <Paper sx={{ 
                                            p: 1.5, 
                                            borderRadius: 1, 
                                            bgcolor: 'background.paper', 
                                            border: '1px solid rgba(0,0,0,0.1)', 
                                            textAlign: 'center', 
                                            width: '33%',
                                            transition: 'all 0.2s ease',
                                            '&:hover': {
                                                transform: 'translateY(-3px)',
                                                boxShadow: `0 4px 8px rgba(0,0,0,0.1)`,
                                            }
                                        }}>
                                            <Typography variant="body2" color="text.secondary">Críticas</Typography>
                                            <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'error.main' }}>{priorityStats['Alta'] || 0}</Typography>
                                        </Paper>
                                        <Paper sx={{ 
                                            p: 1.5, 
                                            borderRadius: 1, 
                                            bgcolor: 'background.paper', 
                                            border: '1px solid rgba(0,0,0,0.1)', 
                                            textAlign: 'center', 
                                            width: '33%',
                                            transition: 'all 0.2s ease',
                                            '&:hover': {
                                                transform: 'translateY(-3px)',
                                                boxShadow: `0 4px 8px rgba(0,0,0,0.1)`,
                                            }
                                        }}>
                                            <Typography variant="body2" color="text.secondary">Média</Typography>
                                            <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'warning.main' }}>{priorityStats['Média'] || 0}</Typography>
                                        </Paper>
                                    </Box>
                                </Box>
                            </Paper>
                        </Grid>
                    </Grid>
                )}
                
                {/* Lista de Recomendações */}
                <Grid container spacing={2} sx={{ width: '100%', maxWidth: '98%', margin: '0 auto' }}>
                    <Grid item xs={12}>
                        <Paper 
                            elevation={3} 
                            sx={{ 
                                borderRadius: 2,
                                background: theme.palette.background.paper,
                                boxShadow: theme.shadows[3],
                                overflow: 'hidden',
                                mt: recommendations && recommendations.length > 0 ? 0 : 4,
                                position: 'relative',
                                '&::before': {
                                    ...(recommendations && recommendations.length > 0 ? {
                                        content: '""',
                                        position: 'absolute',
                                        top: -15,
                                        left: '50%',
                                        transform: 'translateX(-50%)',
                                        width: '50px',
                                        height: '4px',
                                        backgroundColor: theme.palette.primary.main,
                                        borderRadius: '4px'
                                    } : {})
                                }
                            }}
                        >
                    <Box sx={{ 
                        p: 2, 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        bgcolor: theme.palette.primary.dark,
                        color: 'white'
                    }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <RecommendationIcon sx={{ mr: 1 }} />
                            <Typography variant="h6">Recomendações</Typography>
                        </Box>
                        {recommendations && recommendations.length > 0 && (
                            <Chip 
                                label={`${filteredRecommendations.length} recomendações encontradas`} 
                                color="secondary"
                                sx={{ 
                                    fontWeight: 'bold',
                                    bgcolor: 'rgba(255,255,255,0.15)',
                                    color: 'white',
                                    '& .MuiChip-label': {
                                        paddingLeft: 1,
                                        paddingRight: 1
                                    }
                                }}
                            />
                        )}
                    </Box>
                    
                    <CardContent sx={{ p: 0 }}>
                        {loading ? (
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 4 }}>
                                <CircularProgress size={40} sx={{ mb: 2 }} />
                        <Typography variant="body1" color="text.secondary">
                                    Buscando recomendações...
                                </Typography>
                            </Box>
                        ) : filteredRecommendations && filteredRecommendations.length > 0 ? (
                            <>
                                <Box sx={{ px: 2, pt: 2, pb: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                    {Object.entries(categoryStats).map(([cat, count]) => (
                                        <Chip 
                                            key={cat}
                                            icon={getCategoryIcon(cat)} 
                                            label={`${cat}: ${count}`}
                                            color={getCategoryColor(cat)}
                                            size="small"
                                            sx={{ fontWeight: 'medium' }}
                                            onClick={() => setCategoryFilter(categoryFilter === cat ? '' : cat)}
                                            variant={categoryFilter === cat ? 'filled' : 'outlined'}
                                        />
                                    ))}
                                </Box>
                                <List sx={{ p: 0 }}>
                                    {filteredRecommendations.map((recommendation, index) => {
                                        const categoryColorName = getCategoryColor(recommendation.category);
                                        const categoryColor = theme.palette[categoryColorName]?.main || theme.palette.primary.main;
                                        
                                        return (
                                            <React.Fragment key={index}>
                                                {index > 0 && <Divider />}
                                                <ListItem 
                                                    sx={{ 
                                                        py: 2,
                                                        transition: 'all 0.2s',
                                                        '&:hover': {
                                                            bgcolor: 'action.hover'
                                                        },
                                                        borderLeft: `4px solid ${categoryColor}`
                                                    }}
                                                >
                                                    <ListItemIcon>
                                                        {getCategoryIcon(recommendation.category)}
                                                    </ListItemIcon>
                                                    <ListItemText
                                                        primary={
                                                            <>
                                                                <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                                                    <Typography variant="subtitle1" sx={{ fontWeight: 'medium', flex: 1, minWidth: '300px' }}>
                                                                        {recommendation.title}
                                                                    </Typography>
                                                                    <Box sx={{ display: 'flex', gap: 1, minWidth: '220px', justifyContent: 'flex-end' }}>
                                                                        <Chip 
                                                                            label={recommendation.priority}
                                                                            color={getPriorityColor(recommendation.priority)}
                                                                            size="small"
                                                                            variant="outlined"
                                                                            sx={{ fontWeight: 'bold', width: '80px' }}
                                                                        />
                                                                        <Chip
                                                                            label={recommendation.category}
                                                                            color={getCategoryColor(recommendation.category)}
                                                                            size="small"
                                                                            variant="outlined"
                                                                            icon={getCategoryIcon(recommendation.category)}
                                                                            sx={{ fontWeight: 'bold', minWidth: '140px' }}
                                                                        />
                                                                    </Box>
                                                                </Box>
                                                                {/* Texto da descrição */}
                                                                <Typography variant="body2" color="text.primary" sx={{ mt: 1, mb: 1 }}>
                                                                    {recommendation.description}
                                                                </Typography>
                                                                {/* Data e informações alinhadas abaixo do texto */}
                                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 6, mt: 1.5 }}>
                                                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                                        <CalendarIcon fontSize="small" color="action" sx={{ mr: 0.5 }} />
                                                                        <Typography variant="body2" color="text.secondary">
                                                                            <b>Data:</b> {new Date(selectedDate).toLocaleDateString('pt-BR')}
                                                                        </Typography>
                                                                    </Box>
                                                                    {recommendation.impactPercentage && (
                                                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                                            <InfoIcon fontSize="small" color="action" sx={{ mr: 0.5 }} />
                                                                            <Typography variant="body2" color="text.secondary">
                                                                                <b>Impacto:</b> {recommendation.impactPercentage.toFixed(1)}%
                                                                            </Typography>
                                                                        </Box>
                                                                    )}
                                                                    {recommendation.timeframe && (
                                                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                                            <TimelineIcon fontSize="small" color="action" sx={{ mr: 0.5 }} />
                                                                            <Typography variant="body2" color="text.secondary">
                                                                                <b>Prazo:</b> {recommendation.timeframe}
                                                                            </Typography>
                                                                        </Box>
                                                                    )}
                                                                </Box>
                                                            </>
                                                        }
                                                    />
                                                </ListItem>
                                            </React.Fragment>
                                        );
                                    })}
                                </List>
                            </>
                        ) : (
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 4 }}>
                                <Typography variant="h6" color="text.secondary" align="center" sx={{ mb: 1 }}>
                                    Nenhuma recomendação encontrada para os critérios selecionados
                                </Typography>
                                <Typography variant="body2" color="text.secondary" align="center">
                                    Experimente ajustar os filtros ou selecionar um produto diferente
                        </Typography>
                            </Box>
                )}
                    </CardContent>
                </Paper>
                    </Grid>
                </Grid>
            </Box>
        </MainLayout>
    );
};

export default RecommendationsPage; 
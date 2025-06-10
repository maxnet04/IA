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
    Warning as WarningIcon, 
    FilterList as FilterIcon, 
    TrendingUp as TrendingUpIcon,
    TrendingDown as TrendingDownIcon,
    RepeatOne as CyclicIcon,
    Event as EventIcon,
    Info as InfoIcon,
    Timeline as TimelineIcon,
    ArrowUpward as ArrowUpIcon,
    ArrowDownward as ArrowDownIcon,
    ReportProblem as ProblemIcon,
    CalendarMonth as CalendarIcon,
    Refresh as RefreshIcon
} from '@mui/icons-material';
import MainLayout from '../../layouts/MainLayout';
import useAnomalies from '../../../application/hooks/useAnomalies';

const AnomaliesPage = () => {
    const theme = useTheme();
    const {
        loading,
        error,
        anomalies,
        loadAnomalies
    } = useAnomalies();

    const [productId, setProductId] = useState('ALL');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [severityFilter, setSeverityFilter] = useState('');
    const [typeFilter, setTypeFilter] = useState('');

    useEffect(() => {
        // Obter a data atual e a data de 30 dias atrás para valores padrão
        const hoje = new Date();
        const dataInicial = new Date();
        dataInicial.setDate(hoje.getDate() - 30);
        
        const formatarData = (data) => {
            const ano = data.getFullYear();
            const mes = String(data.getMonth() + 1).padStart(2, '0');
            const dia = String(data.getDate()).padStart(2, '0');
            return `${ano}-${mes}-${dia}`;
        };
        
        const dataInicialFormatada = formatarData(dataInicial);
        const dataFinalFormatada = formatarData(hoje);
        
        // Atualizar os estados com as datas padrão
        setStartDate(dataInicialFormatada);
        setEndDate(dataFinalFormatada);
        
        // Carregar anomalias na inicialização com parâmetros corretos
        loadAnomalies({
            productId: 'ALL',
            startDate: dataInicialFormatada,
            endDate: dataFinalFormatada
        });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSearch = () => {
        // Usar o hook de anomalias para buscar os dados
        loadAnomalies({
            productId: productId || 'ALL',
            startDate: startDate || null,
            endDate: endDate || null,
            severity: severityFilter || null
        });
    };

    const handleRefresh = () => {
        loadAnomalies({
            productId: productId || 'ALL',
            startDate: startDate || null,
            endDate: endDate || null,
            severity: severityFilter || null
        });
    };

    const handleProductIdChange = (value) => {
        setProductId(value);
    };

    const getSeverityColor = (severity) => {
        switch (severity?.toLowerCase()) {
            case 'alta':
                return 'error';
            case 'média':
                return 'warning';
            case 'baixa':
                return 'info';
            default:
                return 'default';
        }
    };

    const getTypeColor = (type) => {
        switch (type) {
            case 'VOLUME_SPIKE':
                return 'primary';
            case 'VOLUME_DROP':
                return 'secondary';
            case 'SUSTAINED_INCREASE':
                return 'success';
            case 'SUSTAINED_DECREASE':
                return 'info';
            case 'CYCLIC_PATTERN':
                return 'warning';
            default:
                return 'default';
        }
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'VOLUME_SPIKE':
                return <ArrowUpIcon />;
            case 'VOLUME_DROP':
                return <ArrowDownIcon />;
            case 'SUSTAINED_INCREASE':
                return <TrendingUpIcon />;
            case 'SUSTAINED_DECREASE':
                return <TrendingDownIcon />;
            case 'CYCLIC_PATTERN':
                return <CyclicIcon />;
            default:
                return <WarningIcon />;
        }
    };

    // Filtrar anomalias com base nos filtros selecionados
    const filteredAnomalies = anomalies.filter(anomaly => {
        if (typeFilter && anomaly.type !== typeFilter) return false;
        return true;
    });

    // Agrupar anomalias por tipo para estatísticas
    const anomalyStats = anomalies.reduce((stats, anomaly) => {
        stats[anomaly.type] = (stats[anomaly.type] || 0) + 1;
        return stats;
    }, {});

    // Agrupar anomalias por severidade para estatísticas
    const severityStats = anomalies.reduce((stats, anomaly) => {
        stats[anomaly.severity] = (stats[anomaly.severity] || 0) + 1;
        return stats;
    }, {});

    return (
        <MainLayout>
            <Box sx={{ py: 2 }}>
                <Typography variant="h4" sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
                    <WarningIcon color="warning" sx={{ mr: 1 }} /> 
                    Análise de Anomalias
                </Typography>

                {/* Filtros */}
                <Paper 
                    elevation={3} 
                    sx={{ 
                        mb: 3, 
                        p: 2, 
                        borderRadius: 2,
                        background: theme.palette.background.paper,
                        boxShadow: theme.shadows[3]
                    }}
                >
                    <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                        <FilterIcon color="primary" />
                        <Typography variant="h6">Filtros de Pesquisa</Typography>
                    </Stack>
                    <Divider sx={{ mb: 2 }} />
                        <Grid container spacing={2}>
                        <Grid item xs={12} md={2}>
                                <TextField
                                    fullWidth
                                    label="ID do Produto"
                                    value={productId}
                                    onChange={(e) => handleProductIdChange(e.target.value)}
                                variant="outlined"
                                />
                            </Grid>
                        <Grid item xs={12} md={2}>
                                <TextField
                                    fullWidth
                                    type="date"
                                    label="Data Inicial"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    InputLabelProps={{ shrink: true }}
                                variant="outlined"
                                />
                            </Grid>
                        <Grid item xs={12} md={2}>
                                <TextField
                                    fullWidth
                                    type="date"
                                    label="Data Final"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    InputLabelProps={{ shrink: true }}
                                variant="outlined"
                                />
                            </Grid>
                        <Grid item xs={12} md={2}>
                            <FormControl fullWidth variant="outlined">
                                <InputLabel>Severidade</InputLabel>
                                <Select
                                    value={severityFilter}
                                    onChange={(e) => setSeverityFilter(e.target.value)}
                                    label="Severidade"
                                >
                                    <MenuItem value="">Todas</MenuItem>
                                    <MenuItem value="ALTA">Alta</MenuItem>
                                    <MenuItem value="MÉDIA">Média</MenuItem>
                                    <MenuItem value="BAIXA">Baixa</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} md={2}>
                            <FormControl fullWidth variant="outlined">
                                <InputLabel>Tipo</InputLabel>
                                <Select
                                    value={typeFilter}
                                    onChange={(e) => setTypeFilter(e.target.value)}
                                    label="Tipo"
                                >
                                    <MenuItem value="">Todos</MenuItem>
                                    <MenuItem value="VOLUME_SPIKE">Volume Spike</MenuItem>
                                    <MenuItem value="VOLUME_DROP">Volume Drop</MenuItem>
                                    <MenuItem value="SUSTAINED_INCREASE">Sustained Increase</MenuItem>
                                    <MenuItem value="SUSTAINED_DECREASE">Sustained Decrease</MenuItem>
                                    <MenuItem value="CYCLIC_PATTERN">Cyclic Pattern</MenuItem>
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
                </Paper>

                {error && (
                    <Alert severity="error" sx={{ mb: 3 }}>
                        {error}
                    </Alert>
                )}

                {/* Dashboard de resumo */}
                {anomalies && anomalies.length > 0 && (
                    <Grid container spacing={2} sx={{ mb: 5 }}>
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
                                    <ProblemIcon sx={{ mr: 1 }} color="primary" />
                                    Anomalias por Tipo
                                </Typography>
                                <Divider sx={{ mb: 2 }} />
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                    {Object.entries(anomalyStats).map(([type, count]) => (
                                        <Paper 
                                            key={type} 
                                            sx={{ 
                                                p: 1.5, 
                                                display: 'flex', 
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                borderRadius: 1,
                                                bgcolor: theme.palette.background.paper,
                                                color: theme.palette[getTypeColor(type)].main,
                                                border: `1px solid ${theme.palette[getTypeColor(type)].light}`,
                                                transition: 'all 0.2s ease',
                                                '&:hover': {
                                                    transform: 'translateX(5px)',
                                                    boxShadow: `0 4px 8px rgba(0,0,0,0.1)`,
                                                    cursor: 'pointer'
                                                }
                                            }}
                                            onClick={() => setTypeFilter(typeFilter === type ? '' : type)}
                                        >
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                {getTypeIcon(type)}
                                                <Typography variant="body1" sx={{ ml: 1, fontWeight: 'medium' }}>
                                                    {type}
                                                </Typography>
                                            </Box>
                                            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                                {count}
                                            </Typography>
                                        </Paper>
                                    ))}
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
                                    Anomalias por Severidade
                                </Typography>
                                <Divider sx={{ mb: 2 }} />
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                    {Object.entries(severityStats).map(([severity, count]) => (
                                        <Paper 
                                            key={severity} 
                                            sx={{ 
                                                p: 1.5, 
                                                display: 'flex', 
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                borderRadius: 1,
                                                bgcolor: theme.palette.background.paper,
                                                color: theme.palette[getSeverityColor(severity)].main,
                                                border: `1px solid ${theme.palette[getSeverityColor(severity)].light}`,
                                                transition: 'all 0.2s ease',
                                                '&:hover': {
                                                    transform: 'translateX(5px)',
                                                    boxShadow: `0 4px 8px rgba(0,0,0,0.1)`,
                                                    cursor: 'pointer'
                                                }
                                            }}
                                            onClick={() => setSeverityFilter(severityFilter === severity ? '' : severity)}
                                        >
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                <WarningIcon />
                                                <Typography variant="body1" sx={{ ml: 1, fontWeight: 'medium' }}>
                                                    {severity}
                                                </Typography>
                                            </Box>
                                            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                                {count}
                                            </Typography>
                                        </Paper>
                                    ))}
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
                                    Distribuição Temporal
                                </Typography>
                                <Divider sx={{ mb: 2 }} />
                                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                    <Typography variant="body1" sx={{ textAlign: 'center', mb: 1 }}>
                                        Período de análise:
                                    </Typography>
                                    <Typography variant="h6" sx={{ textAlign: 'center', fontWeight: 'bold', mb: 2 }}>
                                        {startDate ? new Date(startDate).toLocaleDateString('pt-BR') : '(Início)'} - {endDate ? new Date(endDate).toLocaleDateString('pt-BR') : '(Atual)'}
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
                                            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>{anomalies.length}</Typography>
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
                                            <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'error.main' }}>{severityStats['ALTA'] || 0}</Typography>
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
                                            <Typography variant="body2" color="text.secondary">Médias</Typography>
                                            <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'warning.main' }}>{severityStats['MÉDIA'] || 0}</Typography>
                                        </Paper>
                                    </Box>
                                </Box>
                            </Paper>
                        </Grid>
                    </Grid>
                )}

                {/* Lista de Anomalias */}
                <Paper 
                    elevation={3} 
                    sx={{ 
                        borderRadius: 2,
                        background: theme.palette.background.paper,
                        boxShadow: theme.shadows[3],
                        overflow: 'hidden',
                        mt: anomalies && anomalies.length > 0 ? 0 : 4,
                        position: 'relative',
                        '&::before': {
                            ...(anomalies && anomalies.length > 0 ? {
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
                            <WarningIcon sx={{ mr: 1 }} />
                            <Typography variant="h6">Anomalias Detectadas</Typography>
                        </Box>
                        {anomalies && anomalies.length > 0 && (
                            <Chip 
                                label={`${filteredAnomalies.length} anomalias encontradas`} 
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
                                    Buscando anomalias...
                                </Typography>
                            </Box>
                        ) : filteredAnomalies && filteredAnomalies.length > 0 ? (
                            <>
                                <Box sx={{ px: 2, pt: 2, pb: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                    {Object.entries(anomalyStats).map(([type, count]) => (
                                        <Chip 
                                            key={type}
                                            icon={getTypeIcon(type)} 
                                            label={`${type}: ${count}`}
                                            color={getTypeColor(type)}
                                            size="small"
                                            sx={{ fontWeight: 'medium' }}
                                            onClick={() => setTypeFilter(typeFilter === type ? '' : type)}
                                            variant={typeFilter === type ? 'filled' : 'outlined'}
                                        />
                                    ))}
                                </Box>
                                <List sx={{ p: 0 }}>
                                    {filteredAnomalies.map((anomaly, index) => (
                                        <React.Fragment key={index}>
                                            {index > 0 && <Divider />}
                                    <ListItem 
                                        sx={{ 
                                                    py: 2,
                                                    transition: 'all 0.2s',
                                                    '&:hover': {
                                                        bgcolor: 'action.hover'
                                                    },
                                                    borderLeft: `4px solid ${theme.palette[getTypeColor(anomaly.type)].main}`
                                        }}
                                    >
                                        <ListItemIcon>
                                                    {getTypeIcon(anomaly.type)}
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={
                                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                                            <Typography variant="subtitle1" sx={{ fontWeight: 'medium', flex: 1, minWidth: '300px' }}>
                                                        {anomaly.description}
                                                    </Typography>
                                                            <Box sx={{ display: 'flex', gap: 1, minWidth: '220px', justifyContent: 'flex-end' }}>
                                                    <Chip 
                                                        label={anomaly.severity}
                                                        color={getSeverityColor(anomaly.severity)}
                                                        size="small"
                                                                    variant="outlined"
                                                                    sx={{ fontWeight: 'bold', width: '80px' }}
                                                                />
                                                                <Chip
                                                                    label={anomaly.type}
                                                                    color={getTypeColor(anomaly.type)}
                                                                    size="small"
                                                                    variant="outlined"
                                                                    icon={getTypeIcon(anomaly.type)}
                                                                    sx={{ fontWeight: 'bold', minWidth: '140px' }}
                                                                />
                                                            </Box>
                                                        </Box>
                                            }
                                            secondary={
                                                        <Grid container spacing={2} sx={{ mt: 0.5 }}>
                                                            <Grid item xs={12} sm={6} md={3}>
                                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                                    <EventIcon fontSize="small" color="action" sx={{ mr: 0.5 }} />
                                                                    <Typography variant="body2" color="text.secondary">
                                                                        <b>Data:</b> {new Date(anomaly.date).toLocaleDateString('pt-BR')}
                                                                    </Typography>
                                                                </Box>
                                                            </Grid>
                                                            <Grid item xs={12} sm={6} md={3}>
                                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                                    <TimelineIcon fontSize="small" color="action" sx={{ mr: 0.5 }} />
                                                    <Typography variant="body2" color="text.secondary">
                                                                        <b>Volume:</b> {anomaly.volume}
                                                    </Typography>
                                                                </Box>
                                                            </Grid>
                                                            <Grid item xs={12} sm={6} md={3}>
                                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                                    <InfoIcon fontSize="small" color="action" sx={{ mr: 0.5 }} />
                                                    <Typography variant="body2" color="text.secondary">
                                                                        <b>Threshold:</b> {Math.round(anomaly.threshold)}
                                                    </Typography>
                                                                </Box>
                                                            </Grid>
                                                            <Grid item xs={12} sm={6} md={3}>
                                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                                    <ProblemIcon fontSize="small" color="action" sx={{ mr: 0.5 }} />
                                                                    <Typography variant="body2" color="text.secondary">
                                                                        <b>Desvio:</b> {anomaly.deviation} ({(anomaly.confidence * 100).toFixed(0)}% conf.)
                                                        </Typography>
                                                                </Box>
                                                            </Grid>
                                                        </Grid>
                                            }
                                        />
                                    </ListItem>
                                        </React.Fragment>
                                ))}
                            </List>
                            </>
                        ) : (
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 4 }}>
                                <Typography variant="h6" color="text.secondary" align="center" sx={{ mb: 1 }}>
                                    Nenhuma anomalia detectada no período selecionado
                                </Typography>
                                <Typography variant="body2" color="text.secondary" align="center">
                                    Experimente ajustar os filtros ou selecionar um período diferente
                            </Typography>
                            </Box>
                        )}
                    </CardContent>
                </Paper>
            </Box>
        </MainLayout>
    );
};

export default AnomaliesPage; 
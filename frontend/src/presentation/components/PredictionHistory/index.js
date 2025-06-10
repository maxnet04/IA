import React, { useState } from 'react';
import {
    Card,
    CardContent,
    CardHeader,
    Grid,
    Typography,
    TextField,
    Button,
    Alert,
    CircularProgress,
    Box,
    Divider,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Tabs,
    Tab,
    IconButton,
    Tooltip
} from '@mui/material';
import {
    Timeline as TimelineIcon,
    Compare as CompareIcon,
    TrendingUp as TrendingUpIcon,
    TrendingDown as TrendingDownIcon,
    Remove as RemoveIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ptBR } from 'date-fns/locale';
import usePredictionHistory from '../../../application/hooks/usePredictionHistory';

const PredictionHistory = () => {
    const [activeTab, setActiveTab] = useState('history');
    const [currentStartDate, setCurrentStartDate] = useState(null);
    const [currentEndDate, setCurrentEndDate] = useState(null);
    const [previousStartDate, setPreviousStartDate] = useState(null);
    const [previousEndDate, setPreviousEndDate] = useState(null);
    
    const {
        history,
        comparison,
        loading,
        error,
        dateRange,
        comparisonRange,
        loadHistory,
        comparePeriods
    } = usePredictionHistory();

    const handleTabChange = (tab) => {
        setActiveTab(tab);
    };

    const handleLoadHistory = () => {
        if (!currentStartDate || !currentEndDate) {
            return;
        }
        
        loadHistory({
            startDate: currentStartDate.toISOString().split('T')[0],
            endDate: currentEndDate.toISOString().split('T')[0]
        });
    };

    const handleComparePeriods = () => {
        if (!currentStartDate || !currentEndDate || !previousStartDate || !previousEndDate) {
            return;
        }
        
        comparePeriods(
            {
                startDate: currentStartDate.toISOString().split('T')[0],
                endDate: currentEndDate.toISOString().split('T')[0]
            },
            {
                startDate: previousStartDate.toISOString().split('T')[0],
                endDate: previousEndDate.toISOString().split('T')[0]
            }
        );
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR');
    };

    const getVariationIcon = (value) => {
        if (value > 0) {
            return <TrendingUpIcon color="error" />;
        } else if (value < 0) {
            return <TrendingDownIcon color="success" />;
        }
        return <RemoveIcon color="action" />;
    };

    const formatVariation = (value) => {
        if (value > 0) {
            return `+${value.toFixed(2)}%`;
        } else if (value < 0) {
            return `${value.toFixed(2)}%`;
        }
        return '0%';
    };

    return (
        <Card>
            <CardHeader 
                title={activeTab === 'history' ? "Histórico de Previsões" : "Comparação entre Períodos"} 
                avatar={activeTab === 'history' ? <TimelineIcon color="primary" /> : <CompareIcon color="primary" />}
            />
            <CardContent>
                <Tabs
                    value={activeTab}
                    onChange={handleTabChange}
                    indicatorColor="primary"
                    textColor="primary"
                    variant="fullWidth"
                    sx={{ mb: 3 }}
                >
                    <Tab label="Histórico" />
                    <Tab label="Comparação" />
                </Tabs>

                {error && (
                    <Alert severity="error" sx={{ mb: 3 }}>
                        {error}
                    </Alert>
                )}

                {activeTab === 'history' ? (
                    // Aba de Histórico
                    <Box>
                        <Grid container spacing={2} sx={{ mb: 3 }}>
                            <Grid item xs={12} md={5}>
                                <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
                                    <DatePicker
                                        label="Data Inicial"
                                        value={currentStartDate}
                                        onChange={setCurrentStartDate}
                                        slotProps={{ textField: { fullWidth: true } }}
                                    />
                                </LocalizationProvider>
                            </Grid>
                            <Grid item xs={12} md={5}>
                                <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
                                    <DatePicker
                                        label="Data Final"
                                        value={currentEndDate}
                                        onChange={setCurrentEndDate}
                                        slotProps={{ textField: { fullWidth: true } }}
                                    />
                                </LocalizationProvider>
                            </Grid>
                            <Grid item xs={12} md={2}>
                                <Button
                                    variant="contained"
                                    fullWidth
                                    onClick={handleLoadHistory}
                                    disabled={loading || !currentStartDate || !currentEndDate}
                                    sx={{ height: '56px' }}
                                >
                                    {loading ? <CircularProgress size={24} /> : 'Buscar'}
                                </Button>
                            </Grid>
                        </Grid>

                        {loading ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                                <CircularProgress />
                            </Box>
                        ) : history.length > 0 ? (
                            <TableContainer component={Paper} variant="outlined">
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Data</TableCell>
                                            <TableCell>Volume Previsto</TableCell>
                                            <TableCell>Volume Real</TableCell>
                                            <TableCell>Precisão</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {history.map((item, index) => (
                                            <TableRow key={index}>
                                                <TableCell>{formatDate(item.date)}</TableCell>
                                                <TableCell>{item.predicted_volume}</TableCell>
                                                <TableCell>{item.actual_volume}</TableCell>
                                                <TableCell>
                                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                        {item.accuracy}%
                                                        {item.accuracy >= 80 ? (
                                                            <Tooltip title="Alta precisão">
                                                                <TrendingUpIcon color="success" fontSize="small" sx={{ ml: 1 }} />
                                                            </Tooltip>
                                                        ) : item.accuracy >= 60 ? (
                                                            <Tooltip title="Precisão média">
                                                                <RemoveIcon color="warning" fontSize="small" sx={{ ml: 1 }} />
                                                            </Tooltip>
                                                        ) : (
                                                            <Tooltip title="Baixa precisão">
                                                                <TrendingDownIcon color="error" fontSize="small" sx={{ ml: 1 }} />
                                                            </Tooltip>
                                                        )}
                                                    </Box>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        ) : (
                            <Typography variant="body1" color="text.secondary" align="center">
                                Nenhum histórico disponível para o período selecionado.
                            </Typography>
                        )}
                    </Box>
                ) : (
                    // Aba de Comparação
                    <Box>
                        <Typography variant="subtitle1" gutterBottom>
                            Período Atual
                        </Typography>
                        <Grid container spacing={2} sx={{ mb: 3 }}>
                            <Grid item xs={12} md={5}>
                                <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
                                    <DatePicker
                                        label="Data Inicial"
                                        value={currentStartDate}
                                        onChange={setCurrentStartDate}
                                        slotProps={{ textField: { fullWidth: true } }}
                                    />
                                </LocalizationProvider>
                            </Grid>
                            <Grid item xs={12} md={5}>
                                <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
                                    <DatePicker
                                        label="Data Final"
                                        value={currentEndDate}
                                        onChange={setCurrentEndDate}
                                        slotProps={{ textField: { fullWidth: true } }}
                                    />
                                </LocalizationProvider>
                            </Grid>
                        </Grid>

                        <Typography variant="subtitle1" gutterBottom>
                            Período Anterior
                        </Typography>
                        <Grid container spacing={2} sx={{ mb: 3 }}>
                            <Grid item xs={12} md={5}>
                                <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
                                    <DatePicker
                                        label="Data Inicial"
                                        value={previousStartDate}
                                        onChange={setPreviousStartDate}
                                        slotProps={{ textField: { fullWidth: true } }}
                                    />
                                </LocalizationProvider>
                            </Grid>
                            <Grid item xs={12} md={5}>
                                <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
                                    <DatePicker
                                        label="Data Final"
                                        value={previousEndDate}
                                        onChange={setPreviousEndDate}
                                        slotProps={{ textField: { fullWidth: true } }}
                                    />
                                </LocalizationProvider>
                            </Grid>
                            <Grid item xs={12} md={2}>
                                <Button
                                    variant="contained"
                                    fullWidth
                                    onClick={handleComparePeriods}
                                    disabled={loading || !currentStartDate || !currentEndDate || !previousStartDate || !previousEndDate}
                                    sx={{ height: '56px' }}
                                >
                                    {loading ? <CircularProgress size={24} /> : 'Comparar'}
                                </Button>
                            </Grid>
                        </Grid>

                        {loading ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                                <CircularProgress />
                            </Box>
                        ) : comparison ? (
                            <Box>
                                <Typography variant="h6" gutterBottom>
                                    Resultados da Comparação
                                </Typography>
                                <TableContainer component={Paper} variant="outlined">
                                    <Table>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Métrica</TableCell>
                                                <TableCell align="right">Período Atual</TableCell>
                                                <TableCell align="right">Período Anterior</TableCell>
                                                <TableCell align="right">Variação</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            <TableRow>
                                                <TableCell>Volume Médio Diário</TableCell>
                                                <TableCell align="right">{comparison.currentPeriod?.media_volume_diario || 0}</TableCell>
                                                <TableCell align="right">{comparison.previousPeriod?.media_volume_diario || 0}</TableCell>
                                                <TableCell align="right">
                                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                                                        {getVariationIcon(comparison.variations.volume)}
                                                        <Typography sx={{ ml: 1 }}>
                                                            {formatVariation(comparison.variations.volume)}
                                                        </Typography>
                                                    </Box>
                                                </TableCell>
                                            </TableRow>
                                            <TableRow>
                                                <TableCell>Tempo Médio de Resolução (min)</TableCell>
                                                <TableCell align="right">{comparison.currentPeriod?.tempo_medio_resolucao || 0}</TableCell>
                                                <TableCell align="right">{comparison.previousPeriod?.tempo_medio_resolucao || 0}</TableCell>
                                                <TableCell align="right">
                                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                                                        {getVariationIcon(comparison.variations.tempoResolucao)}
                                                        <Typography sx={{ ml: 1 }}>
                                                            {formatVariation(comparison.variations.tempoResolucao)}
                                                        </Typography>
                                                    </Box>
                                                </TableCell>
                                            </TableRow>
                                            <TableRow>
                                                <TableCell>Taxa de Resolução (%)</TableCell>
                                                <TableCell align="right">{comparison.currentPeriod?.taxa_resolucao || 0}%</TableCell>
                                                <TableCell align="right">{comparison.previousPeriod?.taxa_resolucao || 0}%</TableCell>
                                                <TableCell align="right">
                                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                                                        {getVariationIcon(comparison.variations.taxaResolucao)}
                                                        <Typography sx={{ ml: 1 }}>
                                                            {formatVariation(comparison.variations.taxaResolucao)}
                                                        </Typography>
                                                    </Box>
                                                </TableCell>
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Box>
                        ) : (
                            <Typography variant="body1" color="text.secondary" align="center">
                                Selecione os períodos para comparação.
                            </Typography>
                        )}
                    </Box>
                )}
            </CardContent>
        </Card>
    );
};

export default PredictionHistory; 
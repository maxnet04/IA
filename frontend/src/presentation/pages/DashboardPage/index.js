import React, { useEffect, useState } from 'react';
import { 
    Box, 
    Typography, 
    Grid, 
    Card, 
    CardContent, 
    CardHeader, 
    CircularProgress, 
    Alert, 
    Button,
    Stack,
    Divider,
    Avatar,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Tooltip,
    IconButton,
    LinearProgress,
    Paper,
    Container,
    Chip
} from '@mui/material';
import { 
    TrendingUp as TrendingUpIcon, 
    Warning as WarningIcon, 
    Lightbulb as LightbulbIcon, 
    Assessment as AssessmentIcon,
    ArrowUpward as ArrowUpwardIcon,
    ArrowDownward as ArrowDownwardIcon,
    Timeline as TimelineIcon,
    FiberManualRecord as FiberManualRecordIcon,
    ArrowForward as ArrowForwardIcon,
    Error as ErrorIcon,
    ShowChart as ShowChartIcon,
    Percent as PercentIcon,
    Refresh as RefreshIcon,
    Info as InfoIcon,
    Dashboard as DashboardIcon,
    CalendarToday as CalendarTodayIcon
} from '@mui/icons-material';
import { useNavigate, Link } from 'react-router-dom';
import MainLayout from '../../layouts/MainLayout';
import predictiveService from '../../../infrastructure/api/predictiveService';
import incidentService from '../../../infrastructure/api/incidentService';
import { format, parseISO, subDays, addDays, isAfter, isBefore } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
    LineChart, 
    Line, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip as RechartsTooltip, 
    ResponsiveContainer, 
    Legend,
    Area,
    AreaChart
} from 'recharts';

// Função de ajuda para formatar os dados do gráfico
const formatTimelineData = (data) => {
    if (!data || !Array.isArray(data)) {
        console.error('Dados de timeline inválidos:', data);
        return [];
    }

    // Verifica o formato dos dados e adapta se necessário
    if (data.length > 0) {
        // Se já tiver o formato esperado com propriedades date e volume
        if (data[0].date && (data[0].volume !== undefined || data[0].incidents !== undefined)) {
            console.log('Formato de dados de timeline válido:', data);
            return data.map(item => ({
                date: item.date,
                volume: item.volume !== undefined ? item.volume : (item.incidents || 0)
            }));
        }
        
        // Se for outro formato, tenta converter
        console.warn('Formato de dados desconhecido, tentando adaptar:', data);
        
        // Verificando se os dados estão em um formato que pode ser convertido
        const keys = Object.keys(data[0]);
        
        // Possível formato com data e valor
        if (keys.length === 2 && keys.some(k => k.includes('data') || k.includes('date'))) {
            const dateKey = keys.find(k => k.includes('data') || k.includes('date')) || keys[0];
            const valueKey = keys.find(k => k !== dateKey) || keys[1];
            
            return data.map(item => ({
                date: item[dateKey],
                volume: Number(item[valueKey]) || 0
            }));
        }
        
        // Se for um array de valores simples, assume que são volumes em ordem cronológica
        if (typeof data[0] === 'number') {
            const today = new Date();
            return data.map((value, index) => ({
                date: format(subDays(today, data.length - 1 - index), 'yyyy-MM-dd'),
                volume: value
            }));
        }
    }
    
    return [];
};

const DashboardPage = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [summary, setSummary] = useState({
        predictions: [],
        anomalies: [],
        recommendations: [],
        metrics: null,
        timeline: []
    });

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        setLoading(true);
        setError(null);

        try {
            console.log('Carregando dados do dashboard...');
            
            let timelineData = null;
            
            // Tentar carregar os dados de timeline primeiro, isoladamente para melhor diagnóstico
            try {
                console.log('Requisitando dados de timeline...');
                timelineData = await incidentService.getTimelineAnalysis('7d');
                console.log('Dados de timeline recebidos com sucesso:', timelineData);
            } catch (timelineError) {
                console.error('Erro ao carregar timeline:', timelineError);
            }
            
            // Carregar os outros dados de resumo
            const [predictionsResult, anomaliesResult, recommendationsResult, metricsResult] = await Promise.allSettled([
                predictiveService.getPredictedVolume(new Date().toISOString().split('T')[0], 'ALL'),
                predictiveService.detectAnomalies('ALL', null, null, 'alta', 5),
                predictiveService.getRecommendations('ALL'),
                predictiveService.getDetailedMetrics('ALL')
            ]);

            const results = {
                predictions: null,
                anomalies: [],
                recommendations: [],
                metrics: null,
                timeline: []
            };

            // Processar dados de predição
            if (predictionsResult.status === 'fulfilled') {
                console.log('Dados de previsão recebidos:', predictionsResult.value);
                // Estrutura esperada: { data: { data: { date, predictedVolume, confidence, warning } } }
                const predictionData = predictionsResult.value.data;
                
                if (predictionData && typeof predictionData === 'object') {
                    results.predictions = {
                        date: predictionData.date,
                        volume: predictionData.predictedVolume,
                        confidence: predictionData.confidence * 100, // Converter para porcentagem
                        trend: predictionData.trend || 0, // Usar 0 como padrão se não existir
                        warning: predictionData.warning
                    };
                }
                
                console.log('Dados de previsão processados:', results.predictions);
            }
            
            // Processar dados de anomalias
            if (anomaliesResult.status === 'fulfilled') {
                console.log('Dados de anomalias recebidos:', anomaliesResult.value);
                
                // Verificar se temos anomalias dentro da estrutura
                const anomaliesData = anomaliesResult.value.data;
                
                if (anomaliesData && anomaliesData.anomalies) {
                    results.anomalies = anomaliesData.anomalies.map(anomaly => ({
                        ...anomaly,
                        date: anomaly.date || new Date().toISOString().split('T')[0],
                        description: anomaly.description || 'Anomalia detectada'
                    }));
                }
                
                console.log('Dados de anomalias processados:', results.anomalies);
            }
            
            // Processar dados de recomendações
            if (recommendationsResult.status === 'fulfilled') {
                console.log('Dados de recomendações recebidos:', recommendationsResult.value);
                
                // Verificar se temos recomendações dentro da estrutura
                const recommendationsData = recommendationsResult.value.data;
                
                if (recommendationsData && recommendationsData.recommendations) {
                    results.recommendations = recommendationsData.recommendations.map(rec => ({
                        title: rec.description || rec.type,
                        description: rec.impact || rec.description,
                        priority: rec.priority,
                        type: rec.type
                    }));
                }
                
                console.log('Dados de recomendações processados:', results.recommendations);
            }
            
            // Processar dados de métricas
            if (metricsResult.status === 'fulfilled') {
                console.log('Dados de métricas recebidos:', metricsResult.value);
                
                const metricsData = metricsResult.value.data;
                
                if (metricsData) {
                    results.metrics = {
                        media_volume_diario: metricsData.avg_volume || 0,
                        tempo_medio_resolucao: metricsData.avg_resolution_time || 0,
                        taxa_resolucao: metricsData.trend ? Math.abs(metricsData.trend) * 100 : 0
                    };
                }
                
                console.log('Dados de métricas processados:', results.metrics);
            }
            
            // Processar dados de timeline se estiverem disponíveis
            if (timelineData) {
                console.log('Processando dados de timeline:', timelineData);
                
                // Extrai os dados para o gráfico
                if (timelineData.dailyData && Array.isArray(timelineData.dailyData)) {
                    // Formata os dados no formato esperado pelo gráfico
                    results.timeline = timelineData.dailyData.map(item => ({
                        date: item.data,
                        volume: item.quantidade
                    }));
                } else if (timelineData.timeline && Array.isArray(timelineData.timeline)) {
                    results.timeline = timelineData.timeline;
                } else if (Array.isArray(timelineData)) {
                    results.timeline = timelineData;
                }
                
                console.log('Dados de timeline formatados:', results.timeline);
            }

            setSummary(results);
            
            // Informações para depuração
            console.log('Dados do dashboard processados:', results);
        } catch (err) {
            console.error('Erro ao carregar dados do dashboard:', err);
            setError('Erro ao carregar dados do dashboard. Por favor, tente novamente mais tarde.');
        } finally {
            setLoading(false);
        }
    };

    const getTrendIcon = (trend) => {
        if (trend > 0) {
            return <ArrowUpwardIcon color="error" />;
        } else if (trend < 0) {
            return <ArrowDownwardIcon color="success" />;
        }
        return null;
    };

    const getTrendText = (trend) => {
        if (trend > 0) {
            return `Aumento de ${trend}%`;
        } else if (trend < 0) {
            return `Redução de ${Math.abs(trend)}%`;
        }
        return 'Estável';
    };

    // Função para verificar se os dados do gráfico são válidos
    const hasValidTimelineData = () => {
        return summary.timeline && Array.isArray(summary.timeline) && summary.timeline.length > 0;
    };

    if (loading) {
        return (
            <MainLayout>
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                    <CircularProgress />
                </Box>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <Box sx={{ py: 2, px: 2 }}>
                <Typography variant="h4" component="h1" gutterBottom>
                    Dashboard
                </Typography>

                {error && (
                    <Alert severity="error" sx={{ mb: 3 }}>
                        {error}
                    </Alert>
                )}

                <Grid container spacing={3} sx={{ mb: 3 }}>
                    {/* Cards principais */}
                    <Grid item xs={12} md={3}>
                        <Card sx={{ 
                            height: '100%',
                            borderLeft: '4px solid #2196f3', 
                            borderRadius: 1,
                            transition: 'all 0.3s ease',
                            '&:hover': {
                                boxShadow: '0 6px 12px rgba(33, 150, 243, 0.15)',
                                transform: 'translateY(-2px)'
                            }
                        }}>
                            <CardHeader 
                                title="Previsões" 
                                avatar={<TrendingUpIcon color="primary" />}
                                action={
                                    <Button 
                                        size="small" 
                                        onClick={() => navigate('/predictive')}
                                        sx={{ 
                                            color: '#1976d2',
                                            fontSize: '0.75rem',
                                            fontWeight: 600,
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.5px',
                                            minWidth: 'auto',
                                            padding: '4px 12px',
                                            borderRadius: '16px',
                                            backgroundColor: 'rgba(25, 118, 210, 0.04)',
                                            '&:hover': {
                                                backgroundColor: 'rgba(25, 118, 210, 0.12)'
                                            }
                                        }}
                                    >
                                        Ver Mais
                                    </Button>
                                }
                            />
                            <CardContent>
                                {summary.predictions && summary.predictions.volume ? (
                                    <Stack spacing={1}>
                                        <Typography variant="h5">
                                            {summary.predictions.volume}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Volume previsto para hoje
                                        </Typography>
                                        <Divider sx={{ my: 1 }} />
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            {getTrendIcon(summary.predictions.trend)}
                                            <Typography variant="body2">
                                                {getTrendText(summary.predictions.trend)}
                                            </Typography>
                                        </Box>
                                    </Stack>
                                ) : (
                                    <Typography variant="body2" color="text.secondary">
                                        Sem previsões disponíveis
                                    </Typography>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Card de Anomalias */}
                    <Grid item xs={12} md={3}>
                        <Card sx={{ 
                            height: '100%',
                            borderLeft: '4px solid #ff9800',
                            borderRadius: 1,
                            transition: 'all 0.3s ease',
                            '&:hover': {
                                boxShadow: '0 6px 12px rgba(255, 152, 0, 0.15)',
                                transform: 'translateY(-2px)'
                            }
                        }}>
                            <CardHeader 
                                title="Anomalias" 
                                avatar={<WarningIcon color="warning" />}
                                action={
                                    <Button 
                                        size="small" 
                                        onClick={() => navigate('/anomalies')}
                                        sx={{ 
                                            color: '#1976d2',
                                            fontSize: '0.75rem',
                                            fontWeight: 600,
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.5px',
                                            minWidth: 'auto',
                                            padding: '4px 12px',
                                            borderRadius: '16px',
                                            backgroundColor: 'rgba(25, 118, 210, 0.04)',
                                            '&:hover': {
                                                backgroundColor: 'rgba(25, 118, 210, 0.12)'
                                            }
                                        }}
                                    >
                                        Ver Mais
                                    </Button>
                                }
                            />
                            <CardContent>
                                {summary.anomalies && summary.anomalies.length > 0 ? (
                                    <Stack spacing={1}>
                                        <Typography variant="h5">
                                            {summary.anomalies.length}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Anomalias detectadas
                                        </Typography>
                                        <Divider sx={{ my: 1 }} />
                                        <Typography variant="body2" noWrap>
                                            {summary.anomalies[0]?.description || 'Sem descrição'}
                                        </Typography>
                                    </Stack>
                                ) : (
                                    <Typography variant="body2" color="text.secondary">
                                        Nenhuma anomalia detectada
                                    </Typography>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Card de Recomendações */}
                    <Grid item xs={12} md={3}>
                        <Card sx={{ 
                            height: '100%',
                            borderLeft: '4px solid #4caf50',
                            borderRadius: 1,
                            transition: 'all 0.3s ease',
                            '&:hover': {
                                boxShadow: '0 6px 12px rgba(76, 175, 80, 0.15)',
                                transform: 'translateY(-2px)'
                            }
                        }}>
                            <CardHeader 
                                title="Recomendações" 
                                avatar={<LightbulbIcon color="primary" />}
                                action={
                                    <Button 
                                        size="small" 
                                        onClick={() => navigate('/recommendations')}
                                        sx={{ 
                                            color: '#1976d2',
                                            fontSize: '0.75rem',
                                            fontWeight: 600,
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.5px',
                                            minWidth: 'auto',
                                            padding: '4px 12px',
                                            borderRadius: '16px',
                                            backgroundColor: 'rgba(25, 118, 210, 0.04)',
                                            '&:hover': {
                                                backgroundColor: 'rgba(25, 118, 210, 0.12)'
                                            }
                                        }}
                                    >
                                        Ver Mais
                                    </Button>
                                }
                            />
                            <CardContent>
                                {summary.recommendations && summary.recommendations.length > 0 ? (
                                    <Stack spacing={1}>
                                        <Typography variant="h5">
                                            {summary.recommendations.length}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Recomendações geradas
                                        </Typography>
                                        <Divider sx={{ my: 1 }} />
                                        <Typography variant="body2">
                                            {summary.recommendations[0]?.title || 'Sem título'}
                                        </Typography>
                                    </Stack>
                                ) : (
                                    <Typography variant="body2" color="text.secondary">
                                        Nenhuma recomendação disponível
                                    </Typography>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Card de Métricas */}
                    <Grid item xs={12} md={3}>
                        <Card sx={{ 
                            height: '100%',
                            borderLeft: '4px solid #9c27b0',
                            borderRadius: 1,
                            transition: 'all 0.3s ease',
                            '&:hover': {
                                boxShadow: '0 6px 12px rgba(156, 39, 176, 0.15)',
                                transform: 'translateY(-2px)'
                            }
                        }}>
                            <CardHeader 
                                title="Métricas" 
                                avatar={<AssessmentIcon color="success" />}
                                action={
                                    <Button 
                                        size="small" 
                                        onClick={() => navigate('/predictive')}
                                        sx={{ 
                                            color: '#1976d2',
                                            fontSize: '0.75rem',
                                            fontWeight: 600,
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.5px',
                                            minWidth: 'auto',
                                            padding: '4px 12px',
                                            borderRadius: '16px',
                                            backgroundColor: 'rgba(25, 118, 210, 0.04)',
                                            '&:hover': {
                                                backgroundColor: 'rgba(25, 118, 210, 0.12)'
                                            }
                                        }}
                                    >
                                        Ver Mais
                                    </Button>
                                }
                            />
                            <CardContent>
                                {summary.metrics ? (
                                    <Stack spacing={1}>
                                        <Typography variant="h5">
                                            {summary.metrics.media_volume_diario || 0}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Média de volume diário
                                        </Typography>
                                        <Divider sx={{ my: 1 }} />
                                        <Typography variant="body2">
                                            Tempo médio: {summary.metrics.tempo_medio_resolucao || 0} min
                                        </Typography>
                                    </Stack>
                                ) : (
                                    <Typography variant="body2" color="text.secondary">
                                        Sem métricas disponíveis
                                    </Typography>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>
                    </Grid>

                {/* Card de Volume */}
                <Grid container spacing={3} sx={{ mb: 3 }}>
                    <Grid item xs={12}>
                        <Card sx={{ 
                            borderLeft: '4px solid #3f51b5',
                            borderRadius: 1,
                            transition: 'all 0.3s ease',
                            '&:hover': {
                                boxShadow: '0 6px 12px rgba(63, 81, 181, 0.15)'
                            }
                        }}>
                            <CardHeader 
                                title="Volume de Incidentes" 
                                action={
                                    <Button 
                                        size="small" 
                                        onClick={() => navigate('/timeline')}
                                        sx={{ 
                                            color: '#1976d2',
                                            fontSize: '0.75rem',
                                            fontWeight: 600,
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.5px',
                                            minWidth: 'auto',
                                            padding: '4px 12px',
                                            borderRadius: '16px',
                                            backgroundColor: 'rgba(25, 118, 210, 0.04)',
                                            '&:hover': {
                                                backgroundColor: 'rgba(25, 118, 210, 0.12)'
                                            }
                                        }}
                                    >
                                        Ver Mais
                                    </Button>
                                }
                            />
                            <CardContent>
                                {hasValidTimelineData() ? (
                                    <Box sx={{ height: 300 }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart
                                                data={summary.timeline}
                                                margin={{
                                                    top: 20,
                                                    right: 30,
                                                    left: 20,
                                                    bottom: 20,
                                                }}
                                            >
                                                <defs>
                                                    <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                                                        <stop offset="95%" stopColor="#8884d8" stopOpacity={0.1}/>
                                                    </linearGradient>
                                                    <filter id="shadow" height="200%">
                                                        <feDropShadow dx="0" dy="4" stdDeviation="8" floodOpacity="0.1"/>
                                                    </filter>
                                                </defs>
                                                <CartesianGrid 
                                                    strokeDasharray="3 3" 
                                                    vertical={false}
                                                    stroke="#E0E0E0"
                                                />
                                                <XAxis 
                                                    dataKey="date" 
                                                    tickFormatter={(date) => {
                                                        try {
                                                            return format(parseISO(date), 'dd/MM', { locale: ptBR });
                                                        } catch (e) {
                                                            return date ? date.substring(5) : '';
                                                        }
                                                    }}
                                                    stroke="#666"
                                                    tick={{ fill: '#666', fontSize: 12 }}
                                                    axisLine={{ stroke: '#E0E0E0' }}
                                                    tickLine={{ stroke: '#E0E0E0' }}
                                                />
                                                <YAxis 
                                                    stroke="#666"
                                                    tick={{ fill: '#666', fontSize: 12 }}
                                                    axisLine={{ stroke: '#E0E0E0' }}
                                                    tickLine={{ stroke: '#E0E0E0' }}
                                                />
                                                <RechartsTooltip
                                                    formatter={(value, name) => [`${value} incidentes`, 'Volume']}
                                                    labelFormatter={(date) => {
                                                        try {
                                                            return format(parseISO(date), 'dd/MM/yyyy', { locale: ptBR });
                                                        } catch (e) {
                                                            return date;
                                                        }
                                                    }}
                                                    contentStyle={{
                                                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                                        borderRadius: '8px',
                                                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                                                        border: 'none',
                                                        padding: '12px'
                                                    }}
                                                />
                                                <Area
                                                    type="monotone"
                                                    dataKey="volume"
                                                    stroke="#8884d8"
                                                    strokeWidth={3}
                                                    fill="url(#volumeGradient)"
                                                    fillOpacity={1}
                                                    name="Volume"
                                                    dot={{ 
                                                        r: 4, 
                                                        fill: '#8884d8', 
                                                        stroke: '#FFFFFF', 
                                                        strokeWidth: 2 
                                                    }}
                                                    activeDot={{ 
                                                        r: 8, 
                                                        fill: '#8884d8',
                                                        stroke: '#FFFFFF',
                                                        strokeWidth: 2,
                                                        filter: 'url(#shadow)'
                                                    }}
                                                    animationDuration={1500}
                                                    animationEasing="ease-out"
                                                />
                                                <Legend 
                                                    wrapperStyle={{
                                                        paddingTop: '20px'
                                                    }}
                                                    formatter={(value) => <span style={{ color: '#666', fontSize: '14px' }}>{value}</span>}
                                                />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </Box>
                                ) : (
                                    <>
                                        <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 2 }}>
                                            Sem dados de volume disponíveis
                                        </Typography>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>
                    </Grid>

                    {/* Últimas Anomalias */}
                <Grid container spacing={3}>
                    <Grid item xs={12}>
                        <Card 
                            elevation={0}
                            sx={{ 
                            borderLeft: '4px solid #ff9800',
                                borderRadius: '12px',
                            transition: 'all 0.3s ease',
                                backgroundColor: 'rgba(255, 255, 255, 0.98)',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                            '&:hover': {
                                    boxShadow: '0 6px 20px rgba(255, 152, 0, 0.12)',
                                    transform: 'translateY(-2px)',
                                    backgroundColor: '#fff'
                            }
                            }}
                        >
                            <CardHeader 
                                title={
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <Typography 
                                            sx={{ 
                                                fontSize: '24px',
                                                fontWeight: 400,
                                                color: 'rgba(0, 0, 0, 0.87)',
                                                lineHeight: 1.2
                                            }}
                                        >
                                            Últimas Anomalias
                                        </Typography>
                                        {summary.anomalies && summary.anomalies.length > 0 && (
                                            <Chip
                                                label={summary.anomalies.length}
                                                size="small"
                                                sx={{
                                                    backgroundColor: 'rgba(255, 152, 0, 0.12)',
                                                    color: '#ff9800',
                                                    fontWeight: 500,
                                                    height: '20px',
                                                    fontSize: '0.75rem'
                                                }}
                                            />
                                        )}
                                    </Box>
                                }
                                action={
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Button 
                                        size="small" 
                                        onClick={() => navigate('/anomalies')}
                                            sx={{ 
                                                color: '#1976d2',
                                                fontSize: '0.75rem',
                                                fontWeight: 600,
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.5px',
                                                minWidth: 'auto',
                                                padding: '4px 12px',
                                                borderRadius: '16px',
                                                backgroundColor: 'rgba(25, 118, 210, 0.04)',
                                                '&:hover': {
                                                    backgroundColor: 'rgba(25, 118, 210, 0.12)'
                                                }
                                            }}
                                        >
                                            Ver Mais
                                    </Button>
                                    </Box>
                                }
                                sx={{
                                    borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
                                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                    backdropFilter: 'blur(8px)',
                                    position: 'sticky',
                                    top: 0,
                                    zIndex: 1
                                }}
                            />
                            <CardContent sx={{ p: 0 }}>
                                {summary.anomalies && summary.anomalies.length > 0 ? (
                                    <Box 
                                        sx={{ 
                                            maxHeight: '400px',
                                            overflowY: 'auto',
                                            '&::-webkit-scrollbar': {
                                                width: '8px',
                                            },
                                            '&::-webkit-scrollbar-track': {
                                                background: 'rgba(0, 0, 0, 0.04)',
                                                borderRadius: '4px'
                                            },
                                            '&::-webkit-scrollbar-thumb': {
                                                background: 'rgba(0, 0, 0, 0.2)',
                                                borderRadius: '4px',
                                                '&:hover': {
                                                    background: 'rgba(0, 0, 0, 0.3)'
                                                }
                                            }
                                        }}
                                    >
                                        <Stack spacing={0.5} sx={{ p: 2 }}>
                                            {summary.anomalies.map((anomaly, index) => (
                                                <Box 
                                                    key={index}
                                                    sx={{
                                                        p: 2.5,
                                                        borderRadius: '8px',
                                                        backgroundColor: 'rgba(255, 152, 0, 0.04)',
                                                        border: '1px solid rgba(255, 152, 0, 0.1)',
                                                        transition: 'all 0.2s ease',
                                                        cursor: 'pointer',
                                                        position: 'relative',
                                                        overflow: 'hidden',
                                                        '&:hover': {
                                                            backgroundColor: 'rgba(255, 152, 0, 0.08)',
                                                            transform: 'translateX(4px)',
                                                            '&::after': {
                                                                opacity: 1,
                                                                transform: 'translateX(0)'
                                                            }
                                                        },
                                                        '&::after': {
                                                            content: '""',
                                                            position: 'absolute',
                                                            top: 0,
                                                            left: 0,
                                                            width: '4px',
                                                            height: '100%',
                                                            backgroundColor: '#ff9800',
                                                            opacity: 0,
                                                            transform: 'translateX(-4px)',
                                                            transition: 'all 0.2s ease'
                                                        }
                                                    }}
                                                    onClick={() => navigate('/anomalies')}
                                                >
                                                    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', width: '100%' }}>
                                                        <Box sx={{ flex: 1 }}>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                                                                <WarningIcon sx={{ color: '#ff9800', fontSize: '1.25rem' }} />
                                                                <Typography 
                                                                    variant="subtitle1" 
                                                                    sx={{ 
                                                                        fontWeight: 400,
                                                                        fontSize: '1rem',
                                                                        lineHeight: 1.3,
                                                                        color: 'rgba(0, 0, 0, 0.87)'
                                                                    }}
                                                                >
                                                                    Pico anormal no volume de incidentes (1544 vs média janela 745, stdDev janela 477.91)
                                                </Typography>
                                                            </Box>
                                                            
                                                            <Box 
                                                                sx={{ 
                                                                    display: 'flex',
                                                                    justifyContent: 'space-between',
                                                                    width: '100%',
                                                                    mt: 2,
                                                                    mb: 2
                                                                }}
                                                            >
                                                                <Box sx={{ 
                                                                    display: 'flex', 
                                                                    alignItems: 'center',
                                                                    gap: 1,
                                                                    flex: 1
                                                                }}>
                                                                    <Box 
                                                                        component="span" 
                                                                        sx={{ 
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            justifyContent: 'center',
                                                                            width: 20,
                                                                            height: 20,
                                                                            color: 'rgba(0, 0, 0, 0.54)',
                                                                            flexShrink: 0
                                                                        }}
                                                                    >
                                                                        <svg width="16" height="16" viewBox="0 0 24 24">
                                                                            <path fill="currentColor" d="M19,4H18V2H16V4H8V2H6V4H5A2,2 0 0,0 3,6V20A2,2 0 0,0 5,22H19A2,2 0 0,0 21,20V6A2,2 0 0,0 19,4M19,20H5V10H19V20M19,8H5V6H19V8Z" />
                                                                        </svg>
                                                                    </Box>
                                                                    <Box>
                                                                        <Typography 
                                                                            component="span"
                                                                            sx={{ 
                                                                                color: 'rgba(0, 0, 0, 0.54)',
                                                                                fontSize: '0.875rem',
                                                                                fontWeight: 600,
                                                                                mr: 0.5
                                                                            }}
                                                                        >
                                                                            Data:
                                                                        </Typography>
                                                                        <Typography 
                                                                            component="span"
                                                                            sx={{ 
                                                                                fontSize: '0.875rem',
                                                                                color: 'rgba(0, 0, 0, 0.87)'
                                                                            }}
                                                                        >
                                                                            30/03/2025
                                                </Typography>
                                                                    </Box>
                                                                </Box>

                                                                <Box sx={{ 
                                                                    display: 'flex', 
                                                                    alignItems: 'center',
                                                                    gap: 1,
                                                                    flex: 1
                                                                }}>
                                                                    <Box 
                                                                        component="span" 
                                                                        sx={{ 
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            justifyContent: 'center',
                                                                            width: 20,
                                                                            height: 20,
                                                                            color: 'rgba(0, 0, 0, 0.54)',
                                                                            flexShrink: 0
                                                                        }}
                                                                    >
                                                                        <svg width="16" height="16" viewBox="0 0 24 24">
                                                                            <path fill="currentColor" d="M3.5,18.5L9.5,12.5L13.5,16.5L22,6.92L20.59,5.5L13.5,13.5L9.5,9.5L2,17L3.5,18.5Z" />
                                                                        </svg>
                                                                    </Box>
                                                                    <Box>
                                                                        <Typography 
                                                                            component="span"
                                                                            sx={{ 
                                                                                color: 'rgba(0, 0, 0, 0.54)',
                                                                                fontSize: '0.875rem',
                                                                                fontWeight: 600,
                                                                                mr: 0.5
                                                                            }}
                                                                        >
                                                                            Volume:
                                                                        </Typography>
                                                                        <Typography 
                                                                            component="span"
                                                                            sx={{ 
                                                                                fontSize: '0.875rem',
                                                                                color: 'rgba(0, 0, 0, 0.87)'
                                                                            }}
                                                                        >
                                                                            1544
                                                                        </Typography>
                                                                    </Box>
                                                                </Box>

                                                                <Box sx={{ 
                                                                    display: 'flex', 
                                                                    alignItems: 'center',
                                                                    gap: 1,
                                                                    flex: 1
                                                                }}>
                                                                    <Box 
                                                                        component="span" 
                                                                        sx={{ 
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            justifyContent: 'center',
                                                                            width: 20,
                                                                            height: 20,
                                                                            color: 'rgba(0, 0, 0, 0.54)',
                                                                            flexShrink: 0
                                                                        }}
                                                                    >
                                                                        <svg width="16" height="16" viewBox="0 0 24 24">
                                                                            <path fill="currentColor" d="M11,9H13V7H11M12,20C7.59,20 4,16.41 4,12C4,7.59 7.59,4 12,4C16.41,4 20,7.59 20,12C20,16.41 16.41,20 12,20M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M11,17H13V11H11V17Z" />
                                                                        </svg>
                                                                    </Box>
                                                                    <Box>
                                                                        <Typography 
                                                                            component="span"
                                                                            sx={{ 
                                                                                color: 'rgba(0, 0, 0, 0.54)',
                                                                                fontSize: '0.875rem',
                                                                                fontWeight: 600,
                                                                                mr: 0.5
                                                                            }}
                                                                        >
                                                                            Threshold:
                                                                        </Typography>
                                                                        <Typography 
                                                                            component="span"
                                                                            sx={{ 
                                                                                fontSize: '0.875rem',
                                                                                color: 'rgba(0, 0, 0, 0.87)'
                                                                            }}
                                                                        >
                                                                            1462
                                                                        </Typography>
                                                                    </Box>
                                                                </Box>
                                                            </Box>
                                                        </Box>

                                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, ml: 3, minWidth: '200px' }}>
                                                            <Box sx={{ display: 'flex', gap: 1 }}>
                                                                <Chip 
                                                                    label="ALTA" 
                                                                    size="small"
                                                                    sx={{ 
                                                                        height: '24px',
                                                                        fontSize: '0.75rem',
                                                                        fontWeight: 500,
                                                                        backgroundColor: 'rgba(211, 47, 47, 0.1)',
                                                                        color: '#d32f2f',
                                                                        border: '1px solid rgba(211, 47, 47, 0.2)',
                                                                        borderRadius: '16px',
                                                                        px: 1
                                                                    }}
                                                                />
                                                                <Chip 
                                                                    icon={<TrendingUpIcon sx={{ fontSize: '1rem !important' }} />}
                                                                    label="VOLUME_SPIKE" 
                                                                    size="small"
                                                                    sx={{ 
                                                                        height: '24px',
                                                                        fontSize: '0.75rem',
                                                                        fontWeight: 500,
                                                                        backgroundColor: 'rgba(25, 118, 210, 0.1)',
                                                                        color: '#1976d2',
                                                                        border: '1px solid rgba(25, 118, 210, 0.2)',
                                                                        borderRadius: '16px',
                                                                        px: 1,
                                                                        '& .MuiChip-icon': {
                                                                            color: '#1976d2',
                                                                            marginLeft: '8px'
                                                                        }
                                                                    }}
                                                                />
                                                            </Box>

                                                            <Box sx={{ 
                                                                display: 'flex', 
                                                                alignItems: 'center',
                                                                gap: 1
                                                            }}>
                                                                <Box 
                                                                    component="span" 
                                                                    sx={{ 
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center',
                                                                        width: 20,
                                                                        height: 20,
                                                                        color: 'rgba(0, 0, 0, 0.54)',
                                                                        flexShrink: 0
                                                                    }}
                                                                >
                                                                    <svg width="16" height="16" viewBox="0 0 24 24">
                                                                        <path fill="currentColor" d="M4,15V9H12V4.16L19.84,12L12,19.84V15H4Z" />
                                                                    </svg>
                                                                </Box>
                                                                <Box>
                                                                    <Typography 
                                                                        component="span"
                                                                        sx={{ 
                                                                            color: 'rgba(0, 0, 0, 0.54)',
                                                                            fontSize: '0.875rem',
                                                                            fontWeight: 600,
                                                                            mr: 0.5
                                                                        }}
                                                                    >
                                                                        Desvio:
                                                                    </Typography>
                                                                    <Typography 
                                                                        component="span"
                                                                        sx={{ 
                                                                            fontSize: '0.875rem',
                                                                            color: 'rgba(0, 0, 0, 0.87)'
                                                                        }}
                                                                    >
                                                                        1.67 (87% conf.)
                                                                    </Typography>
                                                                </Box>
                                                            </Box>
                                                        </Box>
                                                    </Box>
                                            </Box>
                                        ))}
                                    </Stack>
                                    </Box>
                                ) : (
                                    <Box 
                                        sx={{ 
                                            p: 4, 
                                            textAlign: 'center',
                                            color: 'text.secondary',
                                            backgroundColor: 'rgba(0, 0, 0, 0.02)'
                                        }}
                                    >
                                        <WarningIcon 
                                            sx={{ 
                                                fontSize: 48, 
                                                color: 'rgba(255, 152, 0, 0.3)',
                                                mb: 2
                                            }} 
                                        />
                                        <Typography variant="body1" gutterBottom>
                                        Nenhuma anomalia recente
                                    </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            O sistema não detectou anomalias no período atual
                                        </Typography>
                                    </Box>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </Box>
        </MainLayout>
    );
};

export default DashboardPage; 
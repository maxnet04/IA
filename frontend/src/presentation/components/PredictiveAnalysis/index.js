import React, { useState, useEffect, useMemo } from 'react';
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
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Box,
    Divider,
    ToggleButtonGroup,
    ToggleButton,
    Tooltip
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import {
    Warning as WarningIcon,
    Lightbulb as LightbulbIcon,
    Assessment as AssessmentIcon,
    FilterList as FilterListIcon,
    ZoomIn as ZoomInIcon,
    ZoomOut as ZoomOutIcon,
    PanTool as PanIcon
} from '@mui/icons-material';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    Legend,
    ResponsiveContainer,
    ReferenceArea,
    ReferenceLine,
    Area,
    Brush
} from 'recharts';
import {
    ScatterChart,
    Scatter,
    ZAxis,
    BarChart,
    Bar,
    Cell,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Radar
} from 'recharts';
import usePredictiveAnalysis from '../../../application/hooks/usePredictiveAnalysis';
import PredictionHistory from '../PredictionHistory';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ptBR } from 'date-fns/locale';
import { format, parseISO, subMonths, addMonths } from 'date-fns';
import predictiveService from '../../../infrastructure/api/predictiveService';
import RecommendationsCard from '../RecommendationsCard';
import useSeasonality from '../../../application/hooks/useSeasonality';
import { ComposedChart } from 'recharts';
import GroupSelector from '../GroupSelector';

const PredictiveAnalysis = ({ 
    groups = [], 
    groupsLoading = false, 
    groupsError = null 
}) => {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [timeScale, setTimeScale] = useState('daily');
    const [monthsBack, setMonthsBack] = useState(3);
    const [monthsForward, setMonthsForward] = useState(2);
    const [scenarioParams, setScenarioParams] = useState({
        optimistic: 15, // % de aumento
        pessimistic: 10, // % de redução
        riskFactor: 'medium' // low, medium, high
    });
    const [selectedScenario, setSelectedScenario] = useState('base');
    const [formErrors, setFormErrors] = useState({
        date: '',
        monthsBack: '',
        monthsForward: ''
    });
    
    const {
        loading,
        error,
        volumeAnalysis,
        loadVolumeAnalysis,
        influenceFactors,
        loadInfluenceFactors,
        loadingInfluenceFactors,
        errorInfluenceFactors
    } = usePredictiveAnalysis();

    // Adicione o estado para a página atual dos fatores de influência
    const [factorsPage, setFactorsPage] = useState(0);
    const FACTORS_PER_PAGE = 5;

    // Estado para comparação de períodos
    const [periodComparison, setPeriodComparison] = useState(null);
    const [loadingPeriodComparison, setLoadingPeriodComparison] = useState(false);
    const [errorPeriodComparison, setErrorPeriodComparison] = useState(null);
    
    // Estado para capturar erros do componente de recomendações
    const [errorRecommendations, setErrorRecommendations] = useState(null);

    // Adicionar estado para o seletor de data
    const [dateRange, setDateRange] = useState({ startDate: null, endDate: null });

    // Adicionar estado para o seletor de grupo
    const [selectedGroup, setSelectedGroup] = useState('ALL');
    
    // Estado para controlar qual grupo foi analisado (usado para mostrar/ocultar gráficos)
    const [analyzedGroup, setAnalyzedGroup] = useState('ALL');
    
    // Sincronizar analyzedGroup com selectedGroup para carregar recomendações imediatamente
    useEffect(() => {
        if (selectedGroup) {
            setAnalyzedGroup(selectedGroup);
        }
    }, [selectedGroup]);
    
    // Estado para controlar quando as recomendações devem ser carregadas
    const [shouldShowRecommendations, setShouldShowRecommendations] = useState(false);
    
    // Debug para monitorar mudanças de estado
    useEffect(() => {
        console.log('🔍 [DEBUG] shouldShowRecommendations mudou para:', shouldShowRecommendations);
    }, [shouldShowRecommendations]);
    
    useEffect(() => {
        console.log('🔍 [DEBUG] analyzedGroup mudou para:', analyzedGroup);
    }, [analyzedGroup]);

    // Adicionar estados para controle da visualização
    const [periodComparisonBrushRange, setPeriodComparisonBrushRange] = useState({
        startIndex: 0,
        endIndex: 5
    });

    // Estado para métricas filtradas por período
    const [filteredMetrics, setFilteredMetrics] = useState({
        overallGrowth: null,
        highestDifference: { date: null, month: null, percentageChange: null, value: null },
        lowestDifference: { date: null, month: null, percentageChange: null, value: null },
        currentTotal: 0,
        previousTotal: 0
    });

    // Hook para obter dados de sazonalidade
    const { seasonalityData, loading: loadingSeasonality, error: errorSeasonality } = useSeasonality(
        selectedGroup, 
        dateRange.startDate && typeof dateRange.startDate === 'object' && dateRange.startDate instanceof Date && !isNaN(dateRange.startDate) ? format(dateRange.startDate, 'yyyy-MM-dd') : null, 
        dateRange.endDate && typeof dateRange.endDate === 'object' && dateRange.endDate instanceof Date && !isNaN(dateRange.endDate) ? format(dateRange.endDate, 'yyyy-MM-dd') : null,
        'day_of_week'
    );

    // Memoizar o componente de recomendações para evitar re-renderizações desnecessárias
    const recommendationsComponent = useMemo(() => {
        // Sempre mostrar o componente, mas carregar dados apenas quando necessário
        if (analyzedGroup && selectedDate) {
            console.log('🔍 [DEBUG] useMemo - Renderizando RecommendationsCard');
            console.log('🔍 [DEBUG] useMemo - analyzedGroup:', analyzedGroup);
            console.log('🔍 [DEBUG] useMemo - selectedDate:', format(selectedDate, 'yyyy-MM-dd'));
            
            return (
                <RecommendationsCard 
                    groupId={analyzedGroup} 
                    date={format(selectedDate, 'yyyy-MM-dd')} 
                    onError={(errorMsg) => setErrorRecommendations(errorMsg)}
                    variant="compact"
                    borderColor="#03a9f4"
                />
            );
        }
        
        return (
            <Card variant="outlined" sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                borderLeft: '4px solid #03a9f4',
                borderRadius: 1,
                minHeight: 350
            }}>
                <CardHeader 
                    title="Recomendações Baseadas em Dados" 
                    titleTypographyProps={{ 
                        variant: 'h6',
                        fontWeight: 600,
                        fontSize: '1.25rem'
                    }}
                    avatar={<LightbulbIcon sx={{ color: '#03a9f4', fontSize: 28 }} />}
                    subheader="Principais ações recomendadas baseadas nos dados"
                    sx={{
                        pb: 1.5,
                        '& .MuiCardHeader-content': {
                            overflow: 'hidden'
                        }
                    }}
                />
                <Divider />
                <CardContent sx={{ 
                    flexGrow: 1, 
                    display: 'flex',
                    justifyContent: 'center', 
                    alignItems: 'center',
                    px: 3,
                    py: 2.5
                }}>
                    <Box sx={{ 
                        textAlign: 'center', 
                        maxWidth: 400,
                        py: 4
                    }}>
                        <LightbulbIcon sx={{ 
                            color: 'rgba(3, 169, 244, 0.2)',
                            fontSize: 60,
                            mb: 2
                        }} />
                        <Typography 
                            color="text.secondary" 
                            variant="h6"
                            sx={{ mb: 1 }}
                        >
                            Dados não disponíveis
                        </Typography>
                        <Typography color="text.secondary" variant="body2">
                            Selecione um grupo e uma data para visualizar recomendações personalizadas baseadas em dados.
                        </Typography>
                    </Box>
                </CardContent>
            </Card>
        );
    }, [analyzedGroup, selectedDate]);

    // Efeito para carregar os dados automaticamente na inicialização
    useEffect(() => {
        if (selectedGroup && selectedDate) {
            handleAnalyze();
        }
    }, []); // Executar apenas uma vez na montagem do componente

    // Efeito para resetar as recomendações quando grupo ou data mudarem
    useEffect(() => {
        console.log('🔍 [DEBUG] useEffect disparado - resetando shouldShowRecommendations');
        console.log('🔍 [DEBUG] selectedGroup mudou para:', selectedGroup);
        console.log('🔍 [DEBUG] selectedDate mudou para:', selectedDate);
        setShouldShowRecommendations(false);
    }, [selectedGroup, selectedDate]);

    const handleTimeScaleChange = (event, newScale) => {
        if (newScale !== null) {
            setTimeScale(newScale);
        }
    };

    const validateField = (name, value) => {
        let error = '';
        if (!value && value !== 0) {
            error = `${name === 'date' ? 'Data' : 'Campo'} é obrigatório`;
        } else if ((name === 'monthsBack' || name === 'monthsForward') && (value < 1 || value > 12)) {
            error = 'O valor deve estar entre 1 e 12 meses';
        }
        return error;
    };

    const handleMonthsChange = (event, field) => {
        const value = parseInt(event.target.value) || '';
        if (field === 'back') {
            setMonthsBack(value);
            const error = validateField('monthsBack', value);
            setFormErrors(prev => ({
                ...prev,
                monthsBack: error
            }));
        } else {
            setMonthsForward(value);
            const error = validateField('monthsForward', value);
            setFormErrors(prev => ({
                ...prev,
                monthsForward: error
            }));
        }
    };



    const handleDateChange = (date) => {
        setSelectedDate(date);
        const error = validateField('date', date);
        setFormErrors(prev => ({
            ...prev,
            date: error
        }));
    };

    // Função para buscar comparação de períodos
    const loadPeriodComparison = async (groupId, currentPeriodStart, currentPeriodEnd) => {
        setLoadingPeriodComparison(true);
        setErrorPeriodComparison(null);
        try {
            const result = await predictiveService.getPeriodComparison(groupId, currentPeriodStart, currentPeriodEnd);
            if (!result.success) throw new Error(result.error || 'Erro ao obter comparação de períodos');
            setPeriodComparison(result.data);
        } catch (err) {
            setErrorPeriodComparison(err.message || 'Erro ao obter comparação de períodos');
            setPeriodComparison(null);
        } finally {
            setLoadingPeriodComparison(false);
        }
    };

    const handleAnalyze = () => {
        console.log('🔍 [DEBUG] handleAnalyze iniciado');
        console.log('🔍 [DEBUG] selectedGroup:', selectedGroup);
        console.log('🔍 [DEBUG] selectedDate:', selectedDate);
        console.log('🔍 [DEBUG] shouldShowRecommendations antes:', shouldShowRecommendations);
        
        if (!selectedGroup || !selectedDate || 
            monthsBack < 1 || monthsBack > 12 || 
            monthsForward < 1 || monthsForward > 12) return;
        
        try {
        const formattedDate = format(selectedDate, 'yyyy-MM-dd');
        
        // Armazenar o grupo que está sendo analisado
        console.log('🔍 [DEBUG] Definindo analyzedGroup para:', selectedGroup);
        setAnalyzedGroup(selectedGroup);
        
        // Permitir que as recomendações sejam carregadas
        console.log('🔍 [DEBUG] Definindo shouldShowRecommendations para: true');
        setShouldShowRecommendations(true);
        
        loadVolumeAnalysis(selectedGroup, formattedDate, {
            monthsBack,
            monthsForward
        });
        
            // Buscar fatores de influência reais
            const startDate = subMonths(selectedDate, monthsBack);
            const endDate = selectedDate;
            
            // Verificar se as datas são válidas antes de usá-las
            if (startDate instanceof Date && !isNaN(startDate) && 
                endDate instanceof Date && !isNaN(endDate)) {
                
                // Atualizar o dateRange para o hook useSeasonality
                setDateRange({
                    startDate: startDate,
                    endDate: endDate
                });
                
                const startDateFormatted = format(startDate, 'yyyy-MM-dd');
                const endDateFormatted = format(endDate, 'yyyy-MM-dd');
                
                loadInfluenceFactors(selectedGroup, startDateFormatted, endDateFormatted);
                // Buscar comparação de períodos
                loadPeriodComparison(selectedGroup, startDateFormatted, endDateFormatted);
            } else {
                console.error('Datas inválidas:', { startDate, endDate });
            }
        } catch (error) {
            console.error('Erro ao processar datas:', error);
        }
    };

    const formatData = (volumeAnalysis) => {
        if (!volumeAnalysis) return [];

        try {
            // Verificar se o volumeAnalysis já é uma array (nova API) ou ainda tem o formato antigo
            if (Array.isArray(volumeAnalysis)) {
                // Novo formato: já é uma timeline única
                return volumeAnalysis.map(item => ({
                    ...item,
                    date: format(parseISO(item.date), 'dd/MM/yyyy'),
                    isHistorical: item.type === 'historical',
                    isPrediction: item.type === 'prediction',
                    // Adicionar limites de confiança para o intervalo
                    confidenceUpper: item.predictedVolume && item.confidence ? 
                        Math.round(item.predictedVolume * (1 + (item.confidence || 0) * 0.5)) : 
                        null,
                    confidenceLower: item.predictedVolume && item.confidence ? 
                        Math.round(item.predictedVolume * (1 - (item.confidence || 0) * 0.5)) : 
                        null,
                    // Adicionar campo para a diferença (range) do intervalo de confiança
                    confidenceRange: item.predictedVolume && item.confidence ? 
                        Math.round(item.predictedVolume * (1 + (item.confidence || 0) * 0.5)) - Math.round(item.predictedVolume * (1 - (item.confidence || 0) * 0.5)) : 
                        null
                }));
            }

            // Formato antigo: separado em historical e predictions
            const historicalArr = Array.isArray(volumeAnalysis.historical) ? volumeAnalysis.historical : [];
            const predictionsArr = Array.isArray(volumeAnalysis.predictions) ? volumeAnalysis.predictions : [];

            const historical = historicalArr.map(h => ({
                ...h,
                date: format(parseISO(h.date), 'dd/MM/yyyy'),
                isHistorical: true,
                isPrediction: false,
                // Adicionar limites de confiança para históricos que têm predictedVolume e confidence
                confidenceUpper: h.predictedVolume && h.confidence ? 
                    Math.round(h.predictedVolume * (1 + (h.confidence || 0) * 0.5)) : 
                    null,
                confidenceLower: h.predictedVolume && h.confidence ? 
                    Math.round(h.predictedVolume * (1 - (h.confidence || 0) * 0.5)) : 
                    null,
                // Adicionar campo para a diferença (range) do intervalo de confiança
                confidenceRange: h.predictedVolume && h.confidence ? 
                    Math.round(h.predictedVolume * (1 + (h.confidence || 0) * 0.5)) - Math.round(h.predictedVolume * (1 - (h.confidence || 0) * 0.5)) : 
                    null
            }));

            const predictions = predictionsArr.map(p => ({
                ...p,
                date: format(parseISO(p.date), 'dd/MM/yyyy'),
                volume: null,
                isHistorical: false,
                isPrediction: true,
                confidenceUpper: p.predictedVolume && p.confidence ? 
                    Math.round(p.predictedVolume * (1 + (p.confidence || 0) * 0.5)) : 
                    null,
                confidenceLower: p.predictedVolume && p.confidence ? 
                    Math.round(p.predictedVolume * (1 - (p.confidence || 0) * 0.5)) : 
                    null,
                // Adicionar campo para a diferença (range) do intervalo de confiança
                confidenceRange: p.predictedVolume && p.confidence ? 
                    Math.round(p.predictedVolume * (1 + (p.confidence || 0) * 0.5)) - Math.round(p.predictedVolume * (1 - (p.confidence || 0) * 0.5)) : 
                    null
            }));

            return [...historical, ...predictions];
        } catch (error) {
            console.error("Erro ao formatar dados:", error);
            return [];
        }
    };

    const CustomTooltip = ({ active, payload, label }) => {
        if (!active || !payload || !payload.length) return null;

        const data = payload[0].payload;
        const isHistorical = data.isHistorical;

        return (
            <Card sx={{ p: 1, backgroundColor: 'rgba(255, 255, 255, 0.9)' }}>
                <Typography variant="subtitle2">
                    Data: {label}
                </Typography>
                
                {/* Para dados históricos, mostrar tanto o volume real quanto o previsto (se disponível) */}
                {isHistorical ? (
                    <>
                        <Typography color="primary">
                            Volume Real: {data.volume}
                        </Typography>
                        {data.predictedVolume && (
                            <>
                                <Typography color="secondary" sx={{ opacity: 0.8 }}>
                                    Volume Previsto: {data.predictedVolume}
                                </Typography>
                                {data.confidence && (
                                    <Typography variant="body2" color="text.secondary">
                                        Confiança: {(data.confidence * 100).toFixed(1)}%
                                    </Typography>
                                )}
                                {data.volume && data.predictedVolume && (
                                    <Typography 
                                        variant="body2" 
                                        color={Math.abs(data.volume - data.predictedVolume) / data.volume <= 0.1 ? "success.main" : "error.main"}
                                    >
                                        Diferença: {((Math.abs(data.volume - data.predictedVolume) / data.volume) * 100).toFixed(1)}%
                                    </Typography>
                                )}
                            </>
                        )}
                    </>
                ) : (
                    <>
                        <Typography color="secondary">
                            Volume Previsto: {data.predictedVolume}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Confiança: {data.confidence ? (data.confidence * 100).toFixed(1) : 0}%
                        </Typography>
                        {data.confidenceUpper && data.confidenceLower && (
                            <Typography variant="body2" color="text.secondary">
                                Intervalo: {data.confidenceLower} - {data.confidenceUpper}
                            </Typography>
                        )}
                    </>
                )}
            </Card>
        );
    };

    // Função para criar áreas de referência para intervalos de confiança
    const createReferenceAreas = (data, isHistorical) => {
        return data
            .filter(d => d.predictedVolume && d.confidence !== undefined)
            .map(d => {
                return {
                    x1: d.date,
                    x2: d.date,
                    y1: d.confidenceLower,
                    y2: d.confidenceUpper,
                    fill: isHistorical ? 'rgba(255, 165, 0, 0.3)' : 'rgba(82, 196, 26, 0.3)',
                    fillOpacity: 0.3,
                };
            });
    };

    // Função para simular cenários alternativos baseados nos dados existentes
    const generateScenarios = (baseData) => {
        if (!baseData || !Array.isArray(baseData)) return { base: [], optimistic: [], pessimistic: [] };
        
        const predictions = baseData.filter(d => d.isPrediction);
        
        const optimisticFactor = 1 + (scenarioParams.optimistic / 100);
        const pessimisticFactor = 1 - (scenarioParams.pessimistic / 100);
        
        // Aplicar fatores aos cenários
        const optimistic = predictions.map(item => ({
            ...item,
            predictedVolume: Math.round(item.predictedVolume * optimisticFactor),
            confidenceUpper: Math.round(item.confidenceUpper * optimisticFactor),
            confidenceLower: Math.round(item.confidenceLower * optimisticFactor),
            scenario: 'optimistic'
        }));
        
        const pessimistic = predictions.map(item => ({
            ...item,
            predictedVolume: Math.round(item.predictedVolume * pessimisticFactor),
            confidenceUpper: Math.round(item.confidenceUpper * pessimisticFactor),
            confidenceLower: Math.round(item.confidenceLower * pessimisticFactor),
            scenario: 'pessimistic'
        }));
        
        return {
            base: predictions,
            optimistic,
            pessimistic
        };
    };
    
    // Gerar dados para mapa de calor sazonal (exemplo)
    const generateSeasonalHeatmapData = () => {
        const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        
        // Array para guardar dados formatados para o mapa de calor
        let result = [];
        
        months.forEach((month, monthIndex) => {
            weekdays.forEach((day, dayIndex) => {
                // Simulação de dados mais realistas com padrões sazonais
                // Em um caso real, esses dados viriam da API
                
                // Base value
                let value = 20 + Math.floor(Math.random() * 50);
                
                // Padrões sazonais para tornar os dados mais realistas
                // Fins de semana têm volume maior
                if (dayIndex >= 5) value += 25;
                
                // Meses festivos (fim de ano) têm volume maior
                if (monthIndex >= 10) value += 30;
                
                // Meses de verão têm mais volume em certos dias
                if ((monthIndex >= 11 || monthIndex <= 1) && dayIndex <= 2) value += 15;
                
                // Início de mês geralmente tem mais volume
                if (monthIndex % 2 === 0 && dayIndex <= 1) value += 10;
                
                // Adiciona alguma variabilidade sazonal ao longo do ano
                value += Math.sin((monthIndex / 12) * Math.PI * 2) * 15;
                
                result.push({
                    month,
                    day,
                    value: Math.round(Math.max(0, value)),
                    monthIndex,
                    dayIndex
                });
            });
        });
        
        return result;
    };

    // Estado para controle da visualização do mapa de calor
    const [heatmapColorScheme, setHeatmapColorScheme] = useState('blueRed');
    const [heatmapFilter, setHeatmapFilter] = useState('all');
    const [heatmapTooltipContent, setHeatmapTooltipContent] = useState(null);
    
    // Funções para gerenciar a escala de cores do mapa de calor
    const getHeatmapColor = (value, max, scheme) => {
        const ratio = Math.min(value / max, 1);
        
        switch(scheme) {
            case 'blueRed':
                // Azul para vermelho (frio para quente)
                const r = Math.floor(ratio * 255);
                const g = Math.floor((1 - Math.abs(ratio - 0.5) * 2) * 100);
                const b = Math.floor((1 - ratio) * 255);
                return `rgb(${r}, ${g}, ${b})`;
                
            case 'greenRed':
                // Verde para vermelho
                return `rgb(${Math.floor(ratio * 255)}, ${Math.floor((1 - ratio) * 255)}, 50)`;
                
            case 'purple':
                // Escala de roxo
                return `rgb(${50 + Math.floor(ratio * 150)}, 0, ${100 + Math.floor(ratio * 155)})`;
                
            case 'monochrome':
                // Escala de cinza
                const gray = Math.floor(ratio * 220);
                return `rgb(${gray}, ${gray}, ${gray})`;
                
            default:
                return `rgb(${Math.floor(ratio * 255)}, ${Math.floor((1 - ratio) * 255)}, 0)`;
        }
    };
    
    // Transformar dados da API para o formato do mapa de calor
    const transformApiDataToHeatmap = (apiData) => {
        if (!apiData || !apiData.heatmapData || !Array.isArray(apiData.heatmapData)) {
            console.warn('Dados de sazonalidade inválidos:', apiData);
            return [];
        }
        
        const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        const result = [];

        try {
            // Para cada entrada de heatmapData (cada mês)
            apiData.heatmapData.forEach((monthData, monthIndex) => {
                if (!monthData) return;
                
                weekdays.forEach((day, dayIndex) => {
                    if (monthData[day] !== undefined) {
                        result.push({
                            month: monthData.month || months[monthIndex % 12],
                            day,
                            value: monthData[day],
                            monthIndex: months.indexOf(monthData.month || months[monthIndex % 12]),
                            dayIndex
                        });
                    }
                });
            });
        } catch (error) {
            console.error('Erro ao transformar dados do mapa de calor:', error);
        }
        
        return result;
    };

    // Usar dados reais da API ou dados simulados como fallback
    const getSeasonalityData = () => {
        try {
            if (seasonalityData && seasonalityData.heatmapData && Array.isArray(seasonalityData.heatmapData)) {
                return transformApiDataToHeatmap(seasonalityData);
            }
        } catch (error) {
            console.error('Erro ao obter dados de sazonalidade:', error);
        }
        // Fallback para dados simulados
        return generateSeasonalHeatmapData();
    };
    
    // Filtrar dados do mapa de calor
    const getFilteredHeatmapData = () => {
        const data = getSeasonalityData();
        
        switch(heatmapFilter) {
            case 'weekends':
                return data.filter(item => item.dayIndex >= 5);
            case 'weekdays':
                return data.filter(item => item.dayIndex < 5);
            case 'firstHalf':
                return data.filter(item => item.monthIndex < 6);
            case 'secondHalf':
                return data.filter(item => item.monthIndex >= 6);
            default:
                return data;
        }
    };
    
    // Função para encontrar o valor máximo no dataset (para normalização das cores)
    const getMaxHeatmapValue = (data) => {
        return Math.max(...data.map(item => item.value)) * 1.1; // 10% acima para melhor visualização
    };

    // Agrupa por mês e ano e retorna um map
    const agruparPorMes = (arr) => {
      const map = {};
      arr.forEach(item => {
        const date = new Date(item.incident_date);
        const mesNum = date.getMonth();
        const ano = date.getFullYear();
        const key = `${ano}-${String(mesNum + 1).padStart(2, '0')}`;
        if (!map[key]) map[key] = 0;
        map[key] += item.volume;
      });
      return map;
    };

    // Função para mesclar os dados por mês e ano para o gráfico
    const mergeByMonthAndYear = (currentPeriod = [], previousPeriod = []) => {
      const mesesNome = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      const all = [...currentPeriod, ...previousPeriod];
      const dataMap = {};
      all.forEach(item => {
        const [ano, mes] = item.incident_month.split('-');
        const mesNome = mesesNome[parseInt(mes, 10) - 1];
        if (!dataMap[mesNome]) dataMap[mesNome] = { mes: mesNome };
        dataMap[mesNome][ano] = item.incident_count || item.volume || 0;
      });
      // Ordena por mês
      return mesesNome
        .filter(mes => dataMap[mes])
        .map(mes => dataMap[mes]);
    };

    // Substituir o Tooltip padrão por um tooltip customizado para o gráfico de comparação
    const ComparisonTooltip = ({ active, payload, label }) => {
        if (!active || !payload || !payload.length) return null;
        // payload: [{ name: '2023', value: 30, ... }, { name: '2024', value: 45, ... }]
        const ano1 = payload[0]?.name;
        const valor1 = payload[0]?.value;
        const ano2 = payload[1]?.name;
        const valor2 = payload[1]?.value;
        let variacao = null;
        let cor = '#1976d2';
        if (valor1 !== undefined && valor2 !== undefined && valor1 !== 0) {
            variacao = ((valor2 - valor1) / valor1) * 100;
            cor = variacao > 0 ? '#43a047' : (variacao < 0 ? '#e53935' : '#1976d2');
        }
        return (
            <Card sx={{ p: 1, backgroundColor: 'rgba(255,255,255,0.95)' }}>
                <Typography variant="subtitle2">Mês: {label}</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    {payload.map((p, idx) => (
                        <Typography key={p.name} sx={{ color: idx === 0 ? '#1976d2' : '#ff5722', fontWeight: 500 }}>
                            {p.name}: {p.value}
                        </Typography>
                    ))}
                    {variacao !== null && (
                        <Typography sx={{ color: cor, fontWeight: 600 }}>
                            Variação: {variacao > 0 ? '+' : ''}{variacao.toFixed(1)}%
                        </Typography>
                    )}
                </Box>
            </Card>
        );
    };

    // Função para calcular métricas baseadas em um intervalo de dados
    const calculatePeriodMetrics = (currentPeriod, previousPeriod, startIndex, endIndex, dadosGrafico) => {
        console.log("Calculando métricas:", { currentPeriod, previousPeriod, startIndex, endIndex, dadosGraph: dadosGrafico });
        
        if (!currentPeriod || !previousPeriod || !dadosGrafico || !dadosGrafico.length) {
            console.warn("Dados insuficientes para cálculo de métricas");
            return {
                overallGrowth: null,
                highestDifference: { date: null, month: null, percentageChange: null, value: null },
                lowestDifference: { date: null, month: null, percentageChange: null, value: null },
                currentTotal: 0,
                previousTotal: 0
            };
        }

        // Filtrar para obter apenas os meses dentro do intervalo selecionado
        const selectedMonths = dadosGrafico
            .slice(startIndex, endIndex + 1)
            .map(item => item.mes);
        
        console.log("Meses selecionados:", selectedMonths);

        // Verificar estrutura dos dados para debug
        console.log("Estrutura do primeiro item current:", currentPeriod[0]);
        console.log("Estrutura do primeiro item previous:", previousPeriod[0]);

        // Calcular totais diretamente para diagnóstico
        let currentTotal = 0;
        let previousTotal = 0;
        
        // Para cada mês selecionado, somamos os valores correspondentes
        selectedMonths.forEach(month => {
            // Encontrar correspondência nos dados atuais/anteriores por nome do mês
            const currentMonthData = dadosGrafico.find(d => d.mes === month);
            if (currentMonthData) {
                const anoAtual = Object.keys(currentMonthData).find(key => !isNaN(parseInt(key)) && parseInt(key) > 2000);
                const anoAnterior = Object.keys(currentMonthData).find(key => key !== 'mes' && key !== anoAtual);
                
                if (anoAtual) currentTotal += currentMonthData[anoAtual] || 0;
                if (anoAnterior) previousTotal += currentMonthData[anoAnterior] || 0;
            }
        });
        
        console.log("Totais calculados:", { currentTotal, previousTotal });

        // Calcular crescimento percentual
        let overallGrowth = null;
        if (previousTotal > 0) {
            overallGrowth = ((currentTotal - previousTotal) / previousTotal) * 100;
            console.log("Crescimento calculado:", overallGrowth);
        }

        // Preparar dados para diferenças mensais
        const monthlyDifferences = [];
        
        // Para cada mês, calcular a diferença entre os anos
        selectedMonths.forEach(month => {
            const monthData = dadosGrafico.find(d => d.mes === month);
            if (monthData) {
                const anoAtual = Object.keys(monthData).find(key => !isNaN(parseInt(key)) && parseInt(key) > 2000);
                const anoAnterior = Object.keys(monthData).find(key => key !== 'mes' && key !== anoAtual);
                
                const currentValue = monthData[anoAtual] || 0;
                const previousValue = monthData[anoAnterior] || 0;
                
                if (previousValue > 0) {
                    const percentageChange = ((currentValue - previousValue) / previousValue) * 100;
                    const absoluteDifference = currentValue - previousValue;
                    
                    monthlyDifferences.push({
                        month,
                        percentageChange,
                        value: absoluteDifference
                    });
                }
            }
        });
        
        console.log("Diferenças mensais:", monthlyDifferences);

        // Encontrar maior diferença (positiva) e maior queda (negativa)
        let highestDifference = { month: null, percentageChange: null, value: null };
        let lowestDifference = { month: null, percentageChange: null, value: null };

        if (monthlyDifferences.length > 0) {
            // Ordenar por percentual de mudança (do maior para o menor)
            const sortedDiffs = [...monthlyDifferences].sort((a, b) => b.percentageChange - a.percentageChange);
            console.log("Diferenças ordenadas:", sortedDiffs);
            
            // Maior diferença é o primeiro item (maior percentual positivo)
            if (sortedDiffs[0] && sortedDiffs[0].percentageChange > 0) {
                highestDifference = sortedDiffs[0];
            }
            
            // Maior queda é o último item (menor percentual, possivelmente negativo)
            if (sortedDiffs[sortedDiffs.length - 1] && sortedDiffs[sortedDiffs.length - 1].percentageChange < 0) {
                lowestDifference = sortedDiffs[sortedDiffs.length - 1];
            }
        }
        
        console.log("Resultados finais:", { overallGrowth, highestDifference, lowestDifference });

        return {
            overallGrowth,
            highestDifference,
            lowestDifference,
            currentTotal,
            previousTotal
        };
    };

    // Função para lidar com mudanças no brush
    const handlePeriodComparisonBrushChange = (brushRange) => {
        if (brushRange && 
            brushRange.startIndex !== undefined && 
            brushRange.endIndex !== undefined && 
            (brushRange.startIndex !== periodComparisonBrushRange.startIndex || 
             brushRange.endIndex !== periodComparisonBrushRange.endIndex)) {
            
            console.log("Brush changed:", brushRange);
            setPeriodComparisonBrushRange(brushRange);
            
            // Recalcular métricas baseadas no novo intervalo selecionado
            const dadosGrafico = mergeByMonthAndYear(
                periodComparison?.currentPeriod, 
                periodComparison?.previousPeriod
            );
            
            if (dadosGrafico && dadosGrafico.length > 0) {
                // Atualizar o período selecionado para exibição
                const startMonth = dadosGrafico[brushRange.startIndex]?.mes;
                const endMonth = dadosGrafico[brushRange.endIndex]?.mes;
                
                if (startMonth && endMonth) {
                    // Em vez de passar a string do mês diretamente, enviamos apenas o dado textual
                    setDateRange({
                        startDate: startMonth,
                        endDate: endMonth
                    });
                    
                    // Recalcular métricas filtradas
                    const metrics = calculatePeriodMetrics(
                        periodComparison?.currentPeriod,
                        periodComparison?.previousPeriod,
                        brushRange.startIndex,
                        brushRange.endIndex,
                        dadosGrafico
                    );
                    
                    setFilteredMetrics(metrics);
                }
            }
        }
    };

    // Quando o componente recebe novos dados de comparação, inicializar as métricas filtradas
    useEffect(() => {
        if (periodComparison) {
            try {
                const dadosGrafico = mergeByMonthAndYear(
                    periodComparison.currentPeriod, 
                    periodComparison.previousPeriod
                );
                
                if (dadosGrafico && dadosGrafico.length > 0) {
                    // Inicializar as métricas com o intervalo padrão
                    // Atualizar o intervalo do brush para mostrar todos os dados disponíveis
                    const newBrushRange = {
                        startIndex: 0,
                        endIndex: Math.max(0, dadosGrafico.length - 1)
                    };
                    
                    setPeriodComparisonBrushRange(newBrushRange);
                    
                    const metrics = calculatePeriodMetrics(
                        periodComparison.currentPeriod,
                        periodComparison.previousPeriod,
                        newBrushRange.startIndex,
                        Math.min(newBrushRange.endIndex, dadosGrafico.length - 1),
                        dadosGrafico
                    );
                    
                    setFilteredMetrics(metrics);
                }
            } catch (error) {
                console.error('Erro ao processar periodComparison:', error);
            }
        }
    }, [periodComparison]);

    // Preparar dados para gráfico de barras por dia da semana
    const getWeekdayTotals = () => {
        const data = getSeasonalityData();
        const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        const result = weekdays.map(day => ({
            day,
            total: 0,
            color: day === 'Dom' || day === 'Sáb' ? '#ff5722' : '#009688'
        }));
        
        data.forEach(item => {
            const index = weekdays.indexOf(item.day);
            if (index !== -1) {
                result[index].total += item.value;
            }
        });

        // Normalizar os valores para percentuais do total
        const total = result.reduce((sum, item) => sum + item.total, 0);
        return result.map(item => ({
            ...item,
            percentage: total > 0 ? (item.total / total) * 100 : 0,
            total: item.total
        }));
    };

    // Preparar dados para gráfico de linha por mês
    const getMonthlyTrend = () => {
        const data = getSeasonalityData();
        const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        
        // Criar um mapa para somar os valores por mês
        const monthMap = {};
        months.forEach(month => {
            monthMap[month] = 0;
        });
        
        // Somar os valores para cada mês
        data.forEach(item => {
            if (item.month && monthMap[item.month] !== undefined) {
                monthMap[item.month] += item.value;
            }
        });
        
        // Filtrar apenas os meses que têm dados (valor > 0)
        const result = months
            .filter(month => monthMap[month] > 0)
            .map(month => ({
                month,
                total: monthMap[month],
                // Adicionar ordem do mês para classificação correta
                order: months.indexOf(month)
            }))
            .sort((a, b) => a.order - b.order); // Ordenar por mês (jan -> dez)
        
        return result;
    };

    // Calcular insights adicionais de sazonalidade
    const calculateSeasonalityInsights = () => {
        const weekdayTotals = getWeekdayTotals();
        const monthlyTrend = getMonthlyTrend();
        
        // Identificar picos e vales
        const sortedWeekdays = [...weekdayTotals].sort((a, b) => b.total - a.total);
        const sortedMonths = [...monthlyTrend].sort((a, b) => b.total - a.total);
        
        // Calcular variações entre períodos
        const weekdayVariation = weekdayTotals.length > 0 ? 
            ((Math.max(...weekdayTotals.map(d => d.total)) - Math.min(...weekdayTotals.map(d => d.total))) / 
            (Math.min(...weekdayTotals.map(d => d.total)) || 1)) * 100 : 0;
            
        const monthlyVariation = monthlyTrend.length > 0 ? 
            ((Math.max(...monthlyTrend.map(m => m.total)) - Math.min(...monthlyTrend.map(m => m.total))) / 
            (Math.min(...monthlyTrend.map(m => m.total)) || 1)) * 100 : 0;
        
        return {
            topWeekdays: sortedWeekdays.slice(0, 2).map(d => d.day),
            bottomWeekdays: sortedWeekdays.slice(-2).map(d => d.day),
            topMonths: sortedMonths.slice(0, 2).map(m => m.month),
            bottomMonths: sortedMonths.slice(-2).map(m => m.month),
            weekdayVariation: weekdayVariation,
            monthlyVariation: monthlyVariation,
            weekendVsWeekday: weekdayTotals.length > 0 ? 
                ((weekdayTotals.filter(d => d.day === 'Dom' || d.day === 'Sáb').reduce((sum, d) => sum + d.total, 0) / 2) / 
                (weekdayTotals.filter(d => d.day !== 'Dom' && d.day !== 'Sáb').reduce((sum, d) => sum + d.total, 0) / 5)) : 1
        };
    };

    // Gerar cores de gradiente para barras
    const getBarColor = (value, max) => {
        const ratio = value / max;
        const r = Math.floor(ratio * 150 + 50);
        const g = Math.floor((1 - ratio) * 150 + 50);
        const b = 100;
        return `rgb(${r}, ${g}, ${b})`;
    };

    useEffect(() => {
        const dadosGrafico = mergeByMonthAndYear(periodComparison?.currentPeriod, periodComparison?.previousPeriod);
        if (dadosGrafico.length > 0 && periodComparisonBrushRange.endIndex >= dadosGrafico.length) {
            setPeriodComparisonBrushRange(prev => ({
                ...prev,
                endIndex: Math.max(0, dadosGrafico.length - 1)
            }));
        }
        // eslint-disable-next-line
    }, [periodComparison, periodComparisonBrushRange]);

    return (
        <Box 
            className="predictive-analysis-container"
            sx={{ 
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
                <AssessmentIcon color="primary" sx={{ mr: 1 }} /> 
                Análise Preditiva
            </Typography>
            
            <Grid container spacing={2} sx={{ 
                width: '100%', 
                maxWidth: '98%',
                margin: '0 auto',
                justifyContent: 'center'
            }}>
                {/* Filtros */}
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
                            avatar={<FilterListIcon color="primary" />}
                        />
                        <CardContent>
                            <Grid container spacing={2} alignItems="center" justifyContent="flex-start" wrap="wrap">
                                {/* Seletor de Grupo */}
                                <Grid item xs={12} md={4} xl={4}>
                                    <GroupSelector
                                        value={selectedGroup}
                                        onChange={(selection) => setSelectedGroup(selection.value)}
                                        label="Selecionar Grupo"
                                        groups={groups}
                                        loading={groupsLoading}
                                        error={groupsError}
                                    />
                                </Grid>
                                {/* Data para Previsão */}
                                <Grid item xs={12} md={2} xl={2}>
                                    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
                                        <DatePicker
                                            label="Data para Previsão"
                                            value={selectedDate}
                                            onChange={handleDateChange}
                                            slotProps={{ 
                                                textField: { 
                                                    fullWidth: true,
                                                    error: !!formErrors.date,
                                                    helperText: formErrors.date
                                                } 
                                            }}
                                        />
                                    </LocalizationProvider>
                                </Grid>
                                {/* Meses Passados */}
                                <Grid item xs={12} md={2} xl={2}>
                                    <TextField
                                        fullWidth
                                        label="Meses Passados"
                                        type="number"
                                        value={monthsBack}
                                        onChange={(e) => handleMonthsChange(e, 'back')}
                                        error={!!formErrors.monthsBack}
                                        helperText={formErrors.monthsBack}
                                        InputProps={{
                                            inputProps: { 
                                                min: 1,
                                                max: 12
                                            }
                                        }}
                                    />
                                </Grid>
                                {/* Meses Futuros */}
                                <Grid item xs={12} md={2} xl={2}>
                                    <TextField
                                        fullWidth
                                        label="Meses Futuros"
                                        type="number"
                                        value={monthsForward}
                                        onChange={(e) => handleMonthsChange(e, 'forward')}
                                        error={!!formErrors.monthsForward}
                                        helperText={formErrors.monthsForward}
                                        InputProps={{
                                            inputProps: { 
                                                min: 1,
                                                max: 12
                                            }
                                        }}
                                    />
                                </Grid>
                                {/* Botão Analisar */}
                                <Grid item xs={12} md={2} xl={2} sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                                    <LoadingButton
                                        fullWidth
                                        variant="contained"
                                        onClick={handleAnalyze}
                                        loading={loading}
                                        sx={{ height: '56px' }}
                                    >
                                        Analisar
                                    </LoadingButton>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                </Grid>

                {error && (
                    <Grid item xs={12}>
                        <Alert severity="error">
                            {error}
                        </Alert>
                    </Grid>
                )}

                {loading ? (
                    <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                        <CircularProgress />
                    </Grid>
                ) : volumeAnalysis ? (
                    <>
                        {/* Gráfico de Volume */}
                        <Grid item xs={12}>
                            <Card sx={{ 
                                borderLeft: '4px solid #2196f3',
                                borderRadius: 1,
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                    boxShadow: '0 6px 12px rgba(33, 150, 243, 0.15)'
                                }
                            }}>
                                <CardHeader 
                                    title="Análise de Volume" 
                                    avatar={<AssessmentIcon color="primary" />}
                                    action={
                                        <ToggleButtonGroup
                                            value={timeScale}
                                            exclusive
                                            onChange={handleTimeScaleChange}
                                            size="small"
                                        >
                                            <ToggleButton value="daily">
                                                Diário
                                            </ToggleButton>
                                            <ToggleButton value="weekly">
                                                Semanal
                                            </ToggleButton>
                                            <ToggleButton value="monthly">
                                                Mensal
                                            </ToggleButton>
                                        </ToggleButtonGroup>
                                    }
                                />
                                <CardContent>
                                    <Box sx={{ height: 400, mb: 2 }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart
                                                data={formatData(volumeAnalysis)}
                                                margin={{
                                                    top: 5,
                                                    right: 30,
                                                    left: 20,
                                                    bottom: 5,
                                                }}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis 
                                                    dataKey="date"
                                                    tick={{ fontSize: 12 }}
                                                />
                                                <YAxis 
                                                    label={{ 
                                                        value: 'Volume', 
                                                        angle: -90, 
                                                        position: 'insideLeft' 
                                                    }}
                                                />
                                                <RechartsTooltip content={<CustomTooltip />} />
                                                <Legend />
                                                <Brush dataKey="date" height={30} stroke="#8884d8" />
                                                
                                                {/* Renderizar áreas de confiança para dados históricos */}
                                                {formatData(volumeAnalysis)
                                                    .filter(d => d.isHistorical && d.predictedVolume && d.confidence !== undefined)
                                                    .map((item, index) => (
                                                        <ReferenceArea
                                                            key={`hist-conf-${index}`}
                                                            x1={item.date}
                                                            x2={item.date}
                                                            y1={item.confidenceLower || 0}
                                                            y2={item.confidenceUpper || 0}
                                                            stroke="none"
                                                            fill="rgba(255, 165, 0, 0.3)"
                                                        />
                                                    ))}

                                                {/* Renderizar áreas de confiança para previsões */}
                                                {formatData(volumeAnalysis)
                                                    .filter(d => d.isPrediction && d.predictedVolume && d.confidence !== undefined)
                                                    .map((item, index) => (
                                                        <ReferenceArea
                                                            key={`pred-conf-${index}`}
                                                            x1={item.date}
                                                            x2={item.date}
                                                            y1={item.confidenceLower || 0}
                                                            y2={item.confidenceUpper || 0}
                                                            stroke="none"
                                                            fill="rgba(82, 196, 26, 0.3)"
                                                        />
                                                    ))}

                                                {/* Alternativa usando Area para histórico */}
                                                <Area
                                                    type="monotone"
                                                    dataKey={(data) => data.isHistorical ? data.confidenceUpper : null}
                                                    stroke="none"
                                                    fill="rgba(255, 165, 0, 0.15)"
                                                    activeDot={false}
                                                    connectNulls={true}
                                                />
                                                <Area
                                                    type="monotone"
                                                    dataKey={(data) => data.isHistorical ? data.confidenceLower : null}
                                                    stroke="none"
                                                    fill="rgba(255, 165, 0, 0.15)"
                                                    activeDot={false}
                                                    connectNulls={true}
                                                />

                                                {/* Alternativa usando Area para previsão */}
                                                <Area
                                                    type="monotone"
                                                    dataKey={(data) => data.isPrediction ? data.confidenceUpper : null}
                                                    stroke="none"
                                                    fill="rgba(82, 196, 26, 0.15)"
                                                    activeDot={false}
                                                    connectNulls={true}
                                                />
                                                <Area
                                                    type="monotone"
                                                    dataKey={(data) => data.isPrediction ? data.confidenceLower : null}
                                                    stroke="none"
                                                    fill="rgba(82, 196, 26, 0.15)"
                                                    activeDot={false}
                                                    connectNulls={true}
                                                />

                                                {/* Linha histórica (dados reais) */}
                                                <Line 
                                                    type="monotone" 
                                                    dataKey="volume" 
                                                    stroke="#8884d8" 
                                                    name="Volume Real"
                                                    strokeWidth={2}
                                                    dot={{ r: 4 }}
                                                    activeDot={{ r: 6 }}
                                                />

                                                {/* Linha de previsão para dados históricos */}
                                                <Line 
                                                    type="monotone" 
                                                    dataKey={(data) => data.isHistorical ? data.predictedVolume : null}
                                                    stroke="#ff7300" 
                                                    name="Previsão Retroativa"
                                                    strokeDasharray="3 3"
                                                    strokeWidth={1.5}
                                                    dot={{ r: 3 }}
                                                    connectNulls={true}
                                                />

                                                {/* Linha de previsão para datas futuras */}
                                                <Line 
                                                    type="monotone" 
                                                    dataKey={(data) => data.isPrediction ? data.predictedVolume : null}
                                                    stroke="#82ca9d" 
                                                    name="Previsão Futura"
                                                    strokeDasharray="5 5"
                                                    strokeWidth={2}
                                                    dot={{ r: 4 }}
                                                    connectNulls={true}
                                                />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </Box>

                                    {/* Metadados e Estatísticas */}
                                        <Grid container spacing={2} justifyContent="center" alignItems="center">
                                            <Grid item xs={12} md={4} sx={{ textAlign: 'center' }}>
                                                <Typography variant="subtitle1" gutterBottom>
                                                    Tendência: {(() => {
                                                        // Tentativa de acessar a tendência em diferentes formatos possíveis
                                                        let trend = null;
                                                        if (volumeAnalysis.metadata && typeof volumeAnalysis.metadata.trend === 'number') {
                                                            trend = volumeAnalysis.metadata.trend;
                                                        } else if (Array.isArray(volumeAnalysis) && volumeAnalysis[0]?.metadata?.trend) {
                                                            trend = volumeAnalysis[0].metadata.trend;
                                                        } else if (volumeAnalysis.trend) {
                                                            trend = volumeAnalysis.trend;
                                                        }
                                                        
                                                        return trend !== null 
                                                            ? (trend * 100).toFixed(1) + '%' 
                                                            : '0.0%';
                                                    })()}
                                                    </Typography>
                                            </Grid>
                                            <Grid item xs={12} md={4} sx={{ textAlign: 'center' }}>
                                                <Typography variant="subtitle1" gutterBottom>
                                                    Qualidade dos Dados: {(() => {
                                                        // Tentativa de acessar a qualidade dos dados em diferentes formatos possíveis
                                                        let quality = null;
                                                        if (volumeAnalysis.metadata && volumeAnalysis.metadata.dataQuality) {
                                                            quality = volumeAnalysis.metadata.dataQuality;
                                                        } else if (Array.isArray(volumeAnalysis) && volumeAnalysis[0]?.metadata?.dataQuality) {
                                                            quality = volumeAnalysis[0].metadata.dataQuality;
                                                        } else if (volumeAnalysis.dataQuality) {
                                                            quality = volumeAnalysis.dataQuality;
                                                        }
                                                        
                                                        return quality === 'high' ? 'Alta' : 'Baixa';
                                                    })()}
                                                    </Typography>
                                            </Grid>
                                            <Grid item xs={12} md={4} sx={{ textAlign: 'center' }}>
                                                <Typography variant="subtitle1" gutterBottom>
                                                    Última Atualização: {(() => {
                                                        // Tentativa de acessar a data de cálculo em diferentes formatos possíveis
                                                        let date = null;
                                                        if (volumeAnalysis.metadata && volumeAnalysis.metadata.calculatedAt) {
                                                            date = volumeAnalysis.metadata.calculatedAt;
                                                        } else if (Array.isArray(volumeAnalysis) && volumeAnalysis[0]?.metadata?.calculatedAt) {
                                                            date = volumeAnalysis[0].metadata.calculatedAt;
                                                        } else if (volumeAnalysis.calculatedAt) {
                                                            date = volumeAnalysis.calculatedAt;
                                                        } else if (volumeAnalysis.updatedAt) {
                                                            date = volumeAnalysis.updatedAt;
                                                        }
                                                        
                                                        return date 
                                                            ? format(parseISO(date), 'dd/MM/yyyy HH:mm')
                                                            : format(new Date(), 'dd/MM/yyyy HH:mm');
                                                    })()}
                                                    </Typography>
                                            </Grid>
                                        </Grid>
                                    </CardContent>
                                </Card>
                            </Grid>

                        {/* Novo Gráfico de Previsões Futuras */}
                        <Grid item xs={12}>
                            <Card sx={{ 
                                borderLeft: '4px solid #4caf50',
                                borderRadius: 1,
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                    boxShadow: '0 6px 12px rgba(76, 175, 80, 0.2)'
                                }
                            }}>
                                <CardHeader 
                                    title="Expectativa de Volume Futuro" 
                                    avatar={<LightbulbIcon sx={{ color: '#4caf50' }} />}
                                    subheader="Previsão de volume para os próximos meses com intervalo de confiança"
                                />
                                <CardContent>
                                    <Box sx={{ height: 400, mb: 2 }}>
                                        {(() => {
                                            const futureData = formatData(volumeAnalysis).filter(d => d.isPrediction);
                                            console.log('🔍 [DEBUG] Dados de previsão para gráfico de Expectativa de Volume Futuro:', futureData);
                                            return null;
                                        })()}
                                        <ResponsiveContainer width="100%" height="100%">
                                            <ComposedChart
                                                data={formatData(volumeAnalysis).filter(d => d.isPrediction)}
                                                margin={{
                                                    top: 10,
                                                    right: 30,
                                                    left: 20,
                                                    bottom: 10,
                                                }}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" opacity={0.5} />
                                                <XAxis 
                                                    dataKey="date"
                                                    tick={{ fontSize: 12 }}
                                                    tickLine={{ stroke: '#4caf50' }}
                                                />
                                                <YAxis 
                                                    label={{ 
                                                        value: 'Volume Esperado', 
                                                        angle: -90, 
                                                        position: 'insideLeft',
                                                        style: { fill: '#4caf50' }
                                                    }}
                                                    tickLine={{ stroke: '#4caf50' }}
                                                />
                                                <RechartsTooltip content={<CustomTooltip />} />
                                                <Legend 
                                                    wrapperStyle={{ paddingTop: 10 }}
                                                    payload={[
                                                        { value: 'Volume Previsto', type: 'line', color: '#4caf50' },
                                                        { value: 'Intervalo de Confiança', type: 'rect', color: 'rgba(76, 175, 80, 0.2)' }
                                                    ]}
                                                />

                                                {/* Definições para gradiente do intervalo de confiança */}
                                                <defs>
                                                    <linearGradient id="confidenceGradient" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#4caf50" stopOpacity={0.25}/>
                                                        <stop offset="95%" stopColor="#4caf50" stopOpacity={0.05}/>
                                                    </linearGradient>
                                                </defs>
                                                
                                                {/* Área do intervalo de confiança usando dois Area com stackId */}
                                                {/* Área invisível do zero até confidenceLower (para criar a base) */}
                                                <Area
                                                    type="linear"
                                                    dataKey="confidenceLower"
                                                    stroke="none"
                                                    fill="transparent"
                                                    fillOpacity={0}
                                                    stackId="confidence"
                                                    isAnimationActive={false}
                                                />
                                                {/* Área visível de confidenceLower até confidenceUpper */}
                                                <Area
                                                    type="linear"
                                                    dataKey={(d) => d.confidenceUpper - d.confidenceLower}
                                                    stroke="none"
                                                    fill="rgba(76, 175, 80, 0.3)"
                                                    fillOpacity={0.6}
                                                    stackId="confidence"
                                                    isAnimationActive={false}
                                                    name="Intervalo de Confiança"
                                                />
                                                
                                                {/* Linhas de referência para os limites (opcionais, mais sutis) */}
                                                <Line 
                                                    type="monotone" 
                                                    dataKey="confidenceUpper"
                                                    stroke="rgba(76, 175, 80, 0.3)" 
                                                    strokeWidth={1}
                                                    strokeDasharray="2 2"
                                                    dot={false}
                                                    activeDot={false}
                                                    name=""
                                                />
                                                <Line 
                                                    type="monotone" 
                                                    dataKey="confidenceLower"
                                                    stroke="rgba(76, 175, 80, 0.3)" 
                                                    strokeWidth={1}
                                                    strokeDasharray="2 2"
                                                    dot={false}
                                                    activeDot={false}
                                                    name=""
                                                />

                                                {/* Linha de previsão principal com efeito visual */}
                                                <Line 
                                                    type="monotone" 
                                                    dataKey="predictedVolume"
                                                    stroke="#4caf50" 
                                                    strokeWidth={3}
                                                    dot={{ 
                                                        stroke: '#4caf50', 
                                                        strokeWidth: 2, 
                                                        r: 6, 
                                                        fill: 'white' 
                                                    }}
                                                    activeDot={{ 
                                                        stroke: '#4caf50', 
                                                        strokeWidth: 2, 
                                                        r: 8, 
                                                        fill: 'white',
                                                        className: 'pulse-effect'
                                                    }}
                                                    name="Volume Previsto"
                                                />

                                                {/* Linha de tendência */}
                                                <ReferenceLine
                                                    stroke="#4caf50"
                                                    strokeDasharray="3 3"
                                                    strokeOpacity={0.8}
                                                    strokeWidth={2}
                                                    isFront={false}
                                                />
                                            </ComposedChart>
                                        </ResponsiveContainer>
                                    </Box>

                                    {/* Insights sobre previsões futuras */}
                                    <Box sx={{ 
                                        p: 2, 
                                        backgroundColor: 'rgba(76, 175, 80, 0.05)', 
                                        borderRadius: 1, 
                                        border: '1px solid rgba(76, 175, 80, 0.2)'
                                    }}>
                                        <Typography variant="h6" color="#4caf50" gutterBottom>
                                            Insights de Crescimento
                                        </Typography>
                                        <Grid container spacing={3}>
                                            <Grid item xs={12} md={4}>
                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                    <WarningIcon sx={{ color: 'orange', mr: 1 }} />
                                                    <Typography variant="body1">
                                                        {(() => {
                                                            // Calcular taxa de crescimento
                                                            const predictions = formatData(volumeAnalysis).filter(d => d.isPrediction);
                                                            if (predictions.length >= 2) {
                                                                const first = predictions[0].predictedVolume;
                                                                const last = predictions[predictions.length - 1].predictedVolume;
                                                                const growthRate = ((last - first) / first) * 100;
                                                                return `Expectativa de ${growthRate.toFixed(1)}% de crescimento no período`;
                                                            }
                                                            return "Crescimento estável esperado";
                                                        })()}
                                                    </Typography>
                                                </Box>
                                            </Grid>
                                            <Grid item xs={12} md={4}>
                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                    <AssessmentIcon sx={{ color: '#4caf50', mr: 1 }} />
                                                    <Typography variant="body1">
                                                        Confiança média de {(() => {
                                                            const predictions = formatData(volumeAnalysis).filter(d => d.isPrediction);
                                                            if (predictions.length > 0) {
                                                                const avgConfidence = predictions.reduce((acc, curr) => 
                                                                    acc + (curr.confidence || 0), 0) / predictions.length;
                                                                return (avgConfidence * 100).toFixed(1);
                                                            }
                                                            return "85";
                                                        })()}%
                                                    </Typography>
                                                </Box>
                                            </Grid>
                                            <Grid item xs={12} md={4}>
                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                    <LightbulbIcon sx={{ color: '#ffc107', mr: 1 }} />
                                                    <Typography variant="body1">
                                                        Melhor ponto para ação: {(() => {
                                                            const predictions = formatData(volumeAnalysis).filter(d => d.isPrediction);
                                                            if (predictions.length > 0) {
                                                                const highestVolume = Math.max(...predictions.map(p => p.predictedVolume || 0));
                                                                const bestPoint = predictions.find(p => p.predictedVolume === highestVolume);
                                                                return bestPoint ? bestPoint.date : "Em análise";
                                                            }
                                                            return "Em análise";
                                                        })()}
                                                    </Typography>
                                                </Box>
                                            </Grid>
                                        </Grid>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* Novo componente: Fatores de Influência */}
                        {analyzedGroup === 'ALL' && (
                            <Grid item xs={12} md={6}>
                                <Card sx={{ 
                                    borderLeft: '4px solid #9c27b0',
                                    borderRadius: 1,
                                    transition: 'all 0.3s ease',
                                    height: '100%',
                                    '&:hover': {
                                        boxShadow: '0 6px 12px rgba(156, 39, 176, 0.15)'
                                    }
                                }}>
                                    <CardHeader 
                                        title="Fatores de Influência" 
                                        avatar={<FilterListIcon sx={{ color: '#9c27b0' }} />}
                                        subheader="Variáveis que impactam o volume previsto"
                                    />
                                    <CardContent>
                                        {loadingInfluenceFactors ? (
                                            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 80 }}>
                                                <CircularProgress size={32} color="secondary" />
                                            </Box>
                                        ) : errorInfluenceFactors ? (
                                            <Alert severity="error">{errorInfluenceFactors}</Alert>
                                        ) : (
                                            <>
                                        <List>
                                                    {(influenceFactors && influenceFactors.length > 0
                                                        ? influenceFactors.slice(factorsPage * FACTORS_PER_PAGE, (factorsPage + 1) * FACTORS_PER_PAGE)
                                                        : []
                                                    ).map((factor, index) => (
                                                        <React.Fragment key={index + factorsPage * FACTORS_PER_PAGE}>
                                                    <ListItem alignItems="flex-start">
                                                        <ListItemIcon>
                                                            <Box 
                                                                sx={{ 
                                                                    width: 40, 
                                                                    height: 40, 
                                                                    borderRadius: '50%', 
                                                                    backgroundColor: 'rgba(156, 39, 176, 0.1)',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    color: '#9c27b0',
                                                                    fontWeight: 'bold'
                                                                }}
                                                            >
                                                                {Math.round(factor.impact * 100)}%
                                                            </Box>
                                                        </ListItemIcon>
                                                        <ListItemText
                                                            primary={factor.name}
                                                            secondary={
                                                                <>
                                                                    <Typography variant="body2" color="text.secondary">
                                                                        {factor.description}
                                                                    </Typography>
                                                                    <Box sx={{ width: '100%', mt: 1 }}>
                                                                        <Box sx={{ 
                                                                            height: 4, 
                                                                            width: '100%', 
                                                                            backgroundColor: 'rgba(156, 39, 176, 0.1)',
                                                                            borderRadius: 2
                                                                        }}>
                                                                            <Box sx={{ 
                                                                                height: '100%', 
                                                                                width: `${factor.impact * 100}%`,
                                                                                backgroundColor: '#9c27b0',
                                                                                borderRadius: 2
                                                                            }} />
                                                                        </Box>
                                                                    </Box>
                                                                </>
                                                            }
                                                        />
                                                    </ListItem>
                                                            {index < (Math.min(FACTORS_PER_PAGE, influenceFactors.length - factorsPage * FACTORS_PER_PAGE) - 1) && <Divider variant="inset" component="li" />}
                                                </React.Fragment>
                                            ))}
                                                    {(!influenceFactors || influenceFactors.length === 0) && (
                                                        <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
                                                            Nenhum fator de influência encontrado para o período selecionado.
                                                        </Typography>
                                                    )}
                                        </List>
                                                {/* Paginação */}
                                                {influenceFactors && influenceFactors.length > FACTORS_PER_PAGE && (
                                                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 2 }}>
                                                        <Button
                                                            variant="outlined"
                                                            size="small"
                                                            sx={{ mr: 1 }}
                                                            disabled={factorsPage === 0}
                                                            onClick={() => setFactorsPage(p => Math.max(0, p - 1))}
                                                        >
                                                            Anterior
                                                        </Button>
                                                        <Typography variant="body2" sx={{ mx: 1 }}>
                                                            Página {factorsPage + 1} de {Math.ceil(influenceFactors.length / FACTORS_PER_PAGE)}
                                                        </Typography>
                                                        <Button
                                                            variant="outlined"
                                                            size="small"
                                                            disabled={(factorsPage + 1) * FACTORS_PER_PAGE >= influenceFactors.length}
                                                            onClick={() => setFactorsPage(p => p + 1)}
                                                        >
                                                            Próxima
                                                        </Button>
                                                    </Box>
                                                )}
                                            </>
                                        )}
                                    </CardContent>
                                </Card>
                            </Grid>
                        )}

                        {/* Novo componente: Comparação com Períodos Anteriores */}
                        <Grid item xs={12} md={analyzedGroup === 'ALL' ? 6 : 12}>
                            <Card sx={{ 
                                borderLeft: '4px solid #ff5722',
                                borderRadius: 1,
                                transition: 'all 0.3s ease',
                                height: '100%',
                                '&:hover': {
                                    boxShadow: '0 6px 12px rgba(255, 87, 34, 0.15)'
                                }
                            }}>
                                <CardHeader 
                                    title="Comparação com Períodos Anteriores" 
                                    avatar={<AssessmentIcon sx={{ color: '#ff5722' }} />}
                                    subheader="Variação do desempenho em relação a ciclos passados"
                                />
                                <CardContent>
                                    {loadingPeriodComparison ? (
                                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 80 }}>
                                            <CircularProgress size={32} color="secondary" />
                                        </Box>
                                    ) : errorPeriodComparison ? (
                                        <Alert severity="error">{errorPeriodComparison}</Alert>
                                    ) : periodComparison ? (
                                        <>
                                    <Box sx={{ height: 350, mb: 2 }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            {(() => {
                                                const dadosGrafico = mergeByMonthAndYear(periodComparison?.currentPeriod, periodComparison?.previousPeriod);
                                                const anos = dadosGrafico.length > 0 ? Object.keys(dadosGrafico[0]).filter(k => k !== 'mes') : [];
                                                
                                                return (
                                                    <LineChart data={dadosGrafico}>
                                                        <CartesianGrid strokeDasharray="3 3" opacity={0.5} />
                                                        <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                                                        <YAxis />
                                                        <RechartsTooltip content={<ComparisonTooltip />} />
                                                        <Legend layout="horizontal" verticalAlign="bottom" align="center" />
                                                        {anos.map((ano, idx) => (
                                                <Line 
                                                                key={ano}
                                                                dataKey={ano}
                                                                name={`Ano ${ano}`}
                                                                stroke={idx === 0 ? "#1976d2" : "#ff5722"}
                                                    strokeWidth={2}
                                                    dot={{ r: 4 }}
                                                                strokeDasharray={idx === 0 ? "5 5" : undefined}
                                                            />
                                                        ))}
                                                        <Brush 
                                                            dataKey="mes" 
                                                            height={28} 
                                                            stroke="#ff5722" 
                                                            fill="rgba(255, 87, 34, 0.05)"
                                                            onChange={handlePeriodComparisonBrushChange}
                                                            startIndex={periodComparisonBrushRange.startIndex}
                                                            endIndex={periodComparisonBrushRange.endIndex}
                                                            travellerWidth={10}
                                                            className="period-comparison-brush"
                                                />
                                            </LineChart>
                                                );
                                            })()}
                                        </ResponsiveContainer>
                                    </Box>
                                    {dateRange.startDate && dateRange.endDate && (
                                        <Typography variant="caption" color="text.secondary" align="center" sx={{ display: 'block', mb: 1, fontWeight: 'bold' }}>
                                            Período visualizado: {typeof dateRange.startDate === 'string' ? dateRange.startDate : format(dateRange.startDate, 'MMM/yyyy')} - {typeof dateRange.endDate === 'string' ? dateRange.endDate : format(dateRange.endDate, 'MMM/yyyy')}
                                        </Typography>
                                    )}
                                    <Box
                                        sx={{
                                            p: 3,
                                            backgroundColor: 'rgba(255, 87, 34, 0.03)',
                                            borderRadius: 2,
                                            border: '1px solid rgba(255, 87, 34, 0.12)',
                                            mt: 2,
                                            mb: 0,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                        }}
                                    >
                                        {/* Crescimento anual */}
                                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '33%' }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                <AssessmentIcon sx={{ color: '#ff5722', fontSize: 20, mr: 1 }} />
                                                <Typography variant="body2" sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>
                                                    Crescimento:
                                                </Typography>
                                            </Box>
                                            <Typography variant="h6" sx={{ fontWeight: 700, color: '#333', textAlign: 'center' }}>
                                                {filteredMetrics.overallGrowth !== null
                                                    ? `${filteredMetrics.overallGrowth.toFixed(1)}%`
                                                    : '--'}
                                            </Typography>
                                    </Box>
                                    
                                        {/* Maior diferença */}
                                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '33%' }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, justifyContent: 'center' }}>
                                                <WarningIcon sx={{ color: '#e53935', fontSize: 20, mr: 1 }} />
                                                <Typography variant="body2" sx={{ fontWeight: 700, whiteSpace: 'nowrap', textAlign: 'center' }}>
                                                    Maior diferença:
                                        </Typography>
                                            </Box>
                                            <Typography variant="h6" sx={{ fontWeight: 700, color: '#333', textAlign: 'center' }}>
                                                {filteredMetrics.highestDifference && filteredMetrics.highestDifference.month
                                                    ? `${filteredMetrics.highestDifference.month} (${filteredMetrics.highestDifference.percentageChange > 0 ? '+' : ''}${filteredMetrics.highestDifference.percentageChange.toFixed(1)}%)`
                                                    : '--'}
                                        </Typography>
                                    </Box>

                                        {/* Maior queda */}
                                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '33%' }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                <LightbulbIcon sx={{ color: '#1976d2', fontSize: 20, mr: 1 }} />
                                                <Typography variant="body2" sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>
                                                    Maior queda:
                                                </Typography>
                                            </Box>
                                            <Typography variant="h6" sx={{ fontWeight: 700, color: '#333', textAlign: 'center' }}>
                                                {filteredMetrics.lowestDifference && filteredMetrics.lowestDifference.month && filteredMetrics.lowestDifference.percentageChange < 0
                                                    ? `${filteredMetrics.lowestDifference.month} (${filteredMetrics.lowestDifference.percentageChange.toFixed(1)}%)`
                                                    : '--'}
                                            </Typography>
                                        </Box>
                                    </Box>
                                        </>
                                    ) : (
                                        <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
                                            Nenhum dado de comparação disponível para o período selecionado.
                                        </Typography>
                                    )}
                                </CardContent>
                            </Card>
                        </Grid>



                        {/* Novo componente: Recomendações de Ação */}
                        <Grid item xs={12}>
                            {recommendationsComponent}
                            {errorRecommendations && (
                                <Alert severity="error" sx={{ mt: 2 }}>
                                    {errorRecommendations}
                                </Alert>
                            )}
                        </Grid>

                        {/* Componente de Cenários de Simulação */}
                        <Grid item xs={12}>
                            <Card sx={{ 
                                borderLeft: '4px solid #673ab7',
                                borderRadius: 1,
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                    boxShadow: '0 6px 12px rgba(103, 58, 183, 0.15)'
                                }
                            }}>
                                <CardHeader 
                                    title="Simulação de Cenários" 
                                    avatar={<AssessmentIcon sx={{ color: '#673ab7' }} />}
                                    subheader="Compare diferentes cenários baseados em parâmetros ajustáveis"
                                />
                                <CardContent>
                                    <Grid container spacing={2} sx={{ mb: 3 }}>
                                        <Grid item xs={12} md={3}>
                                            <TextField
                                                fullWidth
                                                label="Cenário Otimista (%)"
                                                type="number"
                                                value={scenarioParams.optimistic}
                                                onChange={(e) => setScenarioParams({
                                                    ...scenarioParams,
                                                    optimistic: parseFloat(e.target.value)
                                                })}
                                                helperText="% de aumento de volume"
                                                InputProps={{
                                                    inputProps: { min: 0, max: 100 }
                                                }}
                                            />
                                        </Grid>
                                        <Grid item xs={12} md={3}>
                                            <TextField
                                                fullWidth
                                                label="Cenário Pessimista (%)"
                                                type="number"
                                                value={scenarioParams.pessimistic}
                                                onChange={(e) => setScenarioParams({
                                                    ...scenarioParams,
                                                    pessimistic: parseFloat(e.target.value)
                                                })}
                                                helperText="% de redução de volume"
                                                InputProps={{
                                                    inputProps: { min: 0, max: 100 }
                                                }}
                                            />
                                        </Grid>
                                        <Grid item xs={12} md={3}>
                                            <TextField
                                                select
                                                fullWidth
                                                label="Fator de Risco"
                                                value={scenarioParams.riskFactor}
                                                onChange={(e) => setScenarioParams({
                                                    ...scenarioParams,
                                                    riskFactor: e.target.value
                                                })}
                                                helperText="Nível de incerteza"
                                            >
                                                <option value="low">Baixo</option>
                                                <option value="medium">Médio</option>
                                                <option value="high">Alto</option>
                                            </TextField>
                                        </Grid>
                                        <Grid item xs={12} md={3}>
                                            <ToggleButtonGroup
                                                value={selectedScenario}
                                                exclusive
                                                onChange={(e, value) => value && setSelectedScenario(value)}
                                                aria-label="cenário selecionado"
                                                sx={{ height: '100%' }}
                                            >
                                                <ToggleButton value="base" aria-label="base">
                                                    Base
                                                </ToggleButton>
                                                <ToggleButton value="optimistic" aria-label="otimista">
                                                    Otimista
                                                </ToggleButton>
                                                <ToggleButton value="pessimistic" aria-label="pessimista">
                                                    Pessimista
                                                </ToggleButton>
                                                <ToggleButton value="all" aria-label="todos">
                                                    Todos
                                                </ToggleButton>
                                            </ToggleButtonGroup>
                                        </Grid>
                                    </Grid>
                                    
                                    <Box sx={{ height: 400, mb: 2 }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart
                                                data={(() => {
                                                    const scenarios = generateScenarios(formatData(volumeAnalysis));
                                                    const baseData = scenarios.base || [];
                                                    const optimisticData = scenarios.optimistic || [];
                                                    const pessimisticData = scenarios.pessimistic || [];
                                                    
                                                    // Combinar todos os dados em um único array
                                                    return baseData.map((item, index) => ({
                                                        date: item.date,
                                                        base: item.predictedVolume,
                                                        optimistic: optimisticData[index]?.predictedVolume || null,
                                                        pessimistic: pessimisticData[index]?.predictedVolume || null
                                                    }));
                                                })()}
                                                margin={{
                                                    top: 10,
                                                    right: 30,
                                                    left: 20,
                                                    bottom: 10,
                                                }}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" opacity={0.5} />
                                                <XAxis 
                                                    dataKey="date"
                                                    tick={{ fontSize: 12 }}
                                                />
                                                <YAxis 
                                                    label={{ 
                                                        value: 'Volume Projetado', 
                                                        angle: -90, 
                                                        position: 'insideLeft',
                                                        style: { fill: '#673ab7' }
                                                    }}
                                                />
                                                <RechartsTooltip />
                                                <Legend />
                                                
                                                {/* Cenário base */}
                                                {(selectedScenario === 'base' || selectedScenario === 'all') && (
                                                    <Line 
                                                        type="monotone" 
                                                        dataKey="base"
                                                        name="Cenário Base"
                                                        stroke="#673ab7" 
                                                        strokeWidth={2}
                                                        dot={{ r: 4 }}
                                                        connectNulls={false}
                                                    />
                                                )}
                                                
                                                {/* Cenário otimista */}
                                                {(selectedScenario === 'optimistic' || selectedScenario === 'all') && (
                                                    <Line 
                                                        type="monotone" 
                                                        dataKey="optimistic"
                                                        name="Cenário Otimista"
                                                        stroke="#4caf50" 
                                                        strokeWidth={2}
                                                        dot={{ r: 4 }}
                                                        connectNulls={false}
                                                    />
                                                )}
                                                
                                                {/* Cenário pessimista */}
                                                {(selectedScenario === 'pessimistic' || selectedScenario === 'all') && (
                                                    <Line 
                                                        type="monotone" 
                                                        dataKey="pessimistic"
                                                        name="Cenário Pessimista"
                                                        stroke="#f44336" 
                                                        strokeWidth={2}
                                                        dot={{ r: 4 }}
                                                        connectNulls={false}
                                                    />
                                                )}
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </Box>
                                    
                                    <Box sx={{ 
                                        p: 2, 
                                        backgroundColor: 'rgba(103, 58, 183, 0.05)', 
                                        borderRadius: 1, 
                                        border: '1px solid rgba(103, 58, 183, 0.2)'
                                    }}>
                                        <Typography variant="h6" color="#673ab7" gutterBottom>
                                            Impacto nos Resultados
                                        </Typography>
                                        <Grid container spacing={3}>
                                            <Grid item xs={12} md={4}>
                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                    <WarningIcon sx={{ color: '#f44336', mr: 1 }} />
                                                    <Typography variant="body1">
                                                        Cenário Pessimista: 
                                                        {(() => {
                                                            const scenarios = generateScenarios(formatData(volumeAnalysis));
                                                            if (scenarios.base.length && scenarios.pessimistic.length) {
                                                                const baseTotal = scenarios.base.reduce((sum, item) => sum + item.predictedVolume, 0);
                                                                const pessimisticTotal = scenarios.pessimistic.reduce((sum, item) => sum + item.predictedVolume, 0);
                                                                const impact = ((pessimisticTotal - baseTotal) / baseTotal) * 100;
                                                                return ` ${impact.toFixed(1)}% de impacto`;
                                                            }
                                                            return ' -10.0% de impacto';
                                                        })()}
                                                    </Typography>
                                                </Box>
                                            </Grid>
                                            <Grid item xs={12} md={4}>
                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                    <LightbulbIcon sx={{ color: '#4caf50', mr: 1 }} />
                                                    <Typography variant="body1">
                                                        Cenário Otimista: 
                                                        {(() => {
                                                            const scenarios = generateScenarios(formatData(volumeAnalysis));
                                                            if (scenarios.base.length && scenarios.optimistic.length) {
                                                                const baseTotal = scenarios.base.reduce((sum, item) => sum + item.predictedVolume, 0);
                                                                const optimisticTotal = scenarios.optimistic.reduce((sum, item) => sum + item.predictedVolume, 0);
                                                                const impact = ((optimisticTotal - baseTotal) / baseTotal) * 100;
                                                                return ` +${impact.toFixed(1)}% de impacto`;
                                                            }
                                                            return ' +15.0% de impacto';
                                                        })()}
                                                    </Typography>
                                                </Box>
                                            </Grid>
                                            <Grid item xs={12} md={4}>
                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                    <AssessmentIcon sx={{ color: '#673ab7', mr: 1 }} />
                                                    <Typography variant="body1">
                                                        Fator de Risco: {scenarioParams.riskFactor === 'low' ? 'Baixo' : 
                                                                        scenarioParams.riskFactor === 'medium' ? 'Médio' : 'Alto'}
                                                    </Typography>
                                                </Box>
                                            </Grid>
                                        </Grid>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* Mapa de Calor Sazonal Melhorado */}
                        <Grid item xs={12}>
                            <Card sx={{ 
                                borderLeft: '4px solid #009688',
                                borderRadius: 1,
                                transition: 'all 0.3s ease',
                                marginTop: 3, // Adicionando margem superior para evitar sobreposição
                                '&:hover': {
                                    boxShadow: '0 6px 12px rgba(0, 150, 136, 0.15)'
                                }
                            }}>
                                <CardHeader 
                                    title="Análise de Sazonalidade" 
                                    avatar={<FilterListIcon sx={{ color: '#009688' }} />}
                                    subheader="Identificação de padrões sazonais por dia da semana e mês"
                                />
                                <CardContent>
                                    {loadingSeasonality ? (
                                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
                                            <CircularProgress color="secondary" />
                                            </Box>
                                    ) : errorSeasonality ? (
                                        <Alert severity="error" sx={{ mb: 2 }}>
                                            {errorSeasonality}
                                        </Alert>
                                    ) : (
                                        <>
                                            <Typography variant="body1" sx={{ mb: 2 }}>
                                                Análise de padrões de volume por dia da semana e mês, destacando os períodos mais relevantes para decisões operacionais.
                                                </Typography>
                                            
                                            <Grid container spacing={2}>
                                                {/* Painel principal com as principais descobertas */}
                                                <Grid item xs={12}>
                                                    <Box 
                                                        sx={{ 
                                                            bgcolor: 'rgba(0, 150, 136, 0.02)', 
                                                            py: 3,
                                                            px: 3.5, 
                                                            borderRadius: 2,
                                                            border: '1px solid rgba(0, 150, 136, 0.1)',
                                                            boxShadow: 'none',
                                                            mb: 2,
                                                            minHeight: 420
                                                        }}
                                                    >
                                                        <Typography variant="h6" color="#009688" sx={{ mb: 3, fontWeight: 600 }}>
                                                            Principais Descobertas
                                                        </Typography>
                                                        
                                                        <Grid container spacing={4}>
                                                            {/* Maiores volumes */}
                                                            <Grid item xs={12} md={6}>
                                                                <Box sx={{ 
                                                                    bgcolor: '#ffffff', 
                                                                    p: 2, 
                                                                    borderRadius: 1,
                                                                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                                                                    height: '100%',
                                                                    border: '1px solid rgba(46, 125, 50, 0.1)'
                                                                }}>
                                                                    <Typography variant="subtitle1" sx={{ color: '#2e7d32', fontWeight: 600, mb: 1.5, display: 'flex', alignItems: 'center' }}>
                                                                        <AssessmentIcon sx={{ mr: 1, fontSize: 20 }} /> Períodos de Maior Volume
                                                                    </Typography>
                                                                    
                                                                    {(() => {
                                                                        const data = getSeasonalityData();
                                                                        const sortedData = [...data].sort((a, b) => b.value - a.value);
                                                                        const topData = sortedData.slice(0, 5);
                                                                        
                                                                        return (
                                                                            <>
                                                                                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                                                                    {topData.map((item, index) => {
                                                                                        const dias = {
                                                                                            'Dom': 'Domingo', 
                                                                                            'Seg': 'Segunda', 
                                                                                            'Ter': 'Terça', 
                                                                                            'Qua': 'Quarta', 
                                                                                            'Qui': 'Quinta', 
                                                                                            'Sex': 'Sexta', 
                                                                                            'Sáb': 'Sábado'
                                                                                        };
                                                                                        
                                                                                        const avg = data.reduce((sum, item) => sum + item.value, 0) / 
                                                                                                   Math.max(1, data.length);
                                                                                        const pct = ((item.value - avg) / avg) * 100;
                                                                                        
                                                                                        return (
                                                                                            <Box key={index} sx={{ 
                                                                                                display: 'flex', 
                                                                                                alignItems: 'center', 
                                                                                                justifyContent: 'space-between',
                                                                                                borderBottom: '1px dashed rgba(0,0,0,0.08)',
                                                                                                py: 1.25
                                                                                            }}>
                                                                                                <Typography variant="body2" fontWeight={500}>
                                                                                                    {item.month}, {dias[item.day]}
                                                                                                </Typography>
                                                                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                                                                    <Typography variant="body1" fontWeight={600} fontSize="1rem" sx={{ mr: 1 }}>
                                                                                                        {item.value}
                                                                                                    </Typography>
                                                                                                    <Typography 
                                                                                                        variant="caption" 
                                        sx={{ 
                                                                                                            color: '#2e7d32',
                                                                                                            fontWeight: 600,
                                                                                                            bgcolor: 'rgba(46, 125, 50, 0.1)',
                                                                                                            px: 0.7,
                                                                                                            py: 0.3,
                                                                                                            borderRadius: 1
                                                                                                        }}
                                                                                                    >
                                                                                                        +{pct.toFixed(0)}%
                                                    </Typography>
                                                                                                </Box>
                                                                                            </Box>
                                                                                        );
                                                                                    })}
                                                                                </Box>
                                                                                
                                                                                <Typography variant="caption" color="text.secondary" sx={{ mt: 1.5, display: 'block', fontSize: '0.75rem' }}>
                                                                                    Percentuais indicam variação em relação à média
                                                    </Typography>
                                                </>
                                                                        );
                                                                    })()}
                                        </Box>
                                                            </Grid>
                                                            
                                                            {/* Menores volumes */}
                                                            <Grid item xs={12} md={6}>
                                                                <Box sx={{ 
                                                                    bgcolor: '#ffffff', 
                                                                    p: 2, 
                                                                    borderRadius: 1,
                                                                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                                                height: '100%',
                                                                    border: '1px solid rgba(211, 47, 47, 0.1)'
                                                                }}>
                                                                    <Typography variant="subtitle1" sx={{ color: '#d32f2f', fontWeight: 600, mb: 1.5, display: 'flex', alignItems: 'center' }}>
                                                                        <WarningIcon sx={{ mr: 1, fontSize: 20 }} /> Períodos de Menor Volume
                                                                    </Typography>
                                                                    
                                                                    {(() => {
                                                                        const data = getSeasonalityData();
                                                                        // Filtrar valores 0, que podem ser ausência de dados
                                                                        const filteredData = data.filter(item => item.value > 0);
                                                                        const sortedData = [...filteredData].sort((a, b) => a.value - b.value);
                                                                        const bottomData = sortedData.slice(0, 5);
                                                                        
                                                                        return (
                                                                            <>
                                                                                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                                                                    {bottomData.map((item, index) => {
                                                                                        const dias = {
                                                                                            'Dom': 'Domingo', 
                                                                                            'Seg': 'Segunda', 
                                                                                            'Ter': 'Terça', 
                                                                                            'Qua': 'Quarta', 
                                                                                            'Qui': 'Quinta', 
                                                                                            'Sex': 'Sexta', 
                                                                                            'Sáb': 'Sábado'
                                                                                        };
                                                                                        
                                                                                        const avg = data.reduce((sum, item) => sum + item.value, 0) / 
                                                                                                   Math.max(1, data.length);
                                                                                        const pct = ((item.value - avg) / avg) * 100;
                                                                                        
                                                                                        return (
                                                                                            <Box key={index} sx={{ 
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                                                                justifyContent: 'space-between',
                                                                                                borderBottom: '1px dashed rgba(0,0,0,0.08)',
                                                                                                py: 1.25
                                                                                            }}>
                                                                                                <Typography variant="body2" fontWeight={500}>
                                                                                                    {item.month}, {dias[item.day]}
                                                                                                </Typography>
                                                                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                                                                    <Typography variant="body1" fontWeight={600} fontSize="1rem" sx={{ mr: 1 }}>
                                                                                                        {item.value}
                                                                                                    </Typography>
                                                                                                    <Typography 
                                                                                                        variant="caption" 
                                                    sx={{ 
                                                                                                            color: '#d32f2f',
                                                                                                            fontWeight: 600,
                                                                                                            bgcolor: 'rgba(211, 47, 47, 0.1)',
                                                                                                            px: 0.7,
                                                                                                            py: 0.3,
                                                        borderRadius: 1
                                                    }}
                                                >
                                                                                                        {pct.toFixed(0)}%
                                                                                                    </Typography>
                                                </Box>
                                                                                            </Box>
                                                                                        );
                                                                                    })}
                                                                                </Box>
                                                                                
                                                                                <Typography variant="caption" color="text.secondary" sx={{ mt: 1.5, display: 'block', fontSize: '0.75rem' }}>
                                                                                    Percentuais indicam variação em relação à média
                                                                                </Typography>
                                                                            </>
                                                                        );
                                                                    })()}
                                                </Box>
                                                            </Grid>
                                                        </Grid>
                                                    </Box>
                                                </Grid>
                                                
                                                {/* Resumo por Dia da Semana */}
                                                <Grid item xs={12} md={6}>
                                                    <Box sx={{ bgcolor: '#ffffff', p: 1.5, borderRadius: 1, boxShadow: '0 1px 2px rgba(0,0,0,0.05)', height: '100%', display: 'flex', flexDirection: 'column' }}>
                                                        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 500, color: '#009688', mb: 1.5 }}>
                                                            Volume por Dia da Semana
                                                        </Typography>
                                                        
                                            {(() => {
                                                            const weekdayData = getWeekdayTotals();
                                                            const maxValue = Math.max(...weekdayData.map(d => d.percentage));
                                                            
                                                            return (
                                                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, flexGrow: 1 }}>
                                                                    {weekdayData.map((item, index) => {
                                                                        const dias = {
                                                                            'Dom': 'Domingo', 
                                                                            'Seg': 'Segunda', 
                                                                            'Ter': 'Terça', 
                                                                            'Qua': 'Quarta', 
                                                                            'Qui': 'Quinta', 
                                                                            'Sex': 'Sexta', 
                                                                            'Sáb': 'Sábado'
                                                                        };
                                                                        
                                                                        return (
                                                                            <Box key={index}>
                                                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                                                                    <Typography variant="body2" fontWeight={500}>
                                                                                        {dias[item.day]}
                                                                                    </Typography>
                                                                                    <Typography variant="body2" fontWeight={500}>
                                                                                        {item.percentage.toFixed(1)}%
                                                                                    </Typography>
                                                                                </Box>
                                                                                <Box sx={{ width: '100%', bgcolor: 'rgba(0,0,0,0.05)', height: 10, borderRadius: 5, overflow: 'hidden' }}>
                                                                                    <Box 
                                                        sx={{ 
                                                                                            height: '100%', 
                                                                                            width: `${(item.percentage / maxValue) * 100}%`,
                                                                                            bgcolor: item.day === 'Dom' || item.day === 'Sáb' ? '#ff5722' : '#009688',
                                                                                            borderRadius: 5
                                                                                        }} 
                                                                                    />
                                                                                </Box>
                                                                            </Box>
                                                                        );
                                                                    })}
                                                                    
                                                                    <Box sx={{ mt: 1, pt: 1, borderTop: '1px dashed rgba(0,0,0,0.1)', marginTop: 'auto' }}>
                                                                        <Typography variant="body2" fontWeight={500}>
                                                                            {weekdayData.find(d => d.day === 'Dom' || d.day === 'Sáb')?.percentage > 
                                                                             weekdayData.find(d => d.day !== 'Dom' && d.day !== 'Sáb')?.percentage
                                                                                ? "Fins de semana têm maior volume"
                                                                                : "Dias úteis têm maior volume"
                                                                            }
                                                                        </Typography>
                                                    </Box>
                                                                </Box>
                                                            );
                                            })()}
                                        </Box>
                                                </Grid>
                                                
                                                {/* Resumo por Mês - Gráfico de barras simples e direto */}
                                                <Grid item xs={12} md={6}>
                                                    <Box sx={{ 
                                                        bgcolor: '#ffffff', 
                                                        p: 2, 
                                                        borderRadius: 1, 
                                                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)', 
                                                        height: '100%', 
                                                        display: 'flex', 
                                                        flexDirection: 'column'
                                                    }}>
                                                        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 500, color: '#009688', mb: 1.5 }}>
                                                            Tendência de Volume por Mês
                                                        </Typography>
                                                        
                                                        <Box sx={{ 
                                                            flexGrow: 1, 
                                                            display: 'flex', 
                                                            alignItems: 'center', 
                                                            justifyContent: 'center',
                                                            mt: 1,
                                                            mb: 2
                                                        }}>
                                                            <ResponsiveContainer width="100%" height={280}>
                                                                <BarChart
                                                                    data={getMonthlyTrend()}
                                                                    margin={{ top: 15, right: 25, bottom: 25, left: 15 }}
                                                                >
                                                                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
                                                                    <XAxis 
                                                                        dataKey="month" 
                                                                        axisLine={false}
                                                                        tickLine={false}
                                                                        height={30}
                                                                        tick={{ fontSize: 12 }}
                                                                        padding={{ left: 15, right: 15 }}
                                                                    />
                                                                    <YAxis 
                                                                        axisLine={false}
                                                                        tickLine={false}
                                                                        tickFormatter={value => value >= 1000 ? `${(value/1000)}k` : value}
                                                                        tickCount={5}
                                                                        width={35}
                                                                    />
                                                                    <Tooltip 
                                                                        formatter={(value) => [value.toLocaleString(), "Volume"]}
                                                                        cursor={{ fill: 'rgba(0, 150, 136, 0.1)' }}
                                                                        labelFormatter={(label) => {
                                                                            const meses = {
                                                                                'Jan': 'Janeiro', 
                                                                                'Fev': 'Fevereiro', 
                                                                                'Mar': 'Março', 
                                                                                'Abr': 'Abril', 
                                                                                'Mai': 'Maio', 
                                                                                'Jun': 'Junho',
                                                                                'Jul': 'Julho', 
                                                                                'Ago': 'Agosto', 
                                                                                'Set': 'Setembro', 
                                                                                'Out': 'Outubro', 
                                                                                'Nov': 'Novembro', 
                                                                                'Dez': 'Dezembro'
                                                                            };
                                                                            return meses[label] || label;
                                                                        }}
                                                                    />
                                                                    <Bar 
                                                                        dataKey="total" 
                                                                        name="Volume"
                                                                        barSize={(() => {
                                                                            // Lógica para calcular o tamanho adequado da barra
                                                                            const monthsCount = getMonthlyTrend().length;
                                                                            // Base: barras grandes (40px) para poucos meses, reduzindo conforme aumenta
                                                                            if (monthsCount <= 4) return 45;
                                                                            if (monthsCount <= 6) return 35;
                                                                            if (monthsCount <= 8) return 30;
                                                                            if (monthsCount <= 10) return 25;
                                                                            return 20; // Para 11 ou 12 meses
                                                                        })()}
                                                                        radius={[4, 4, 0, 0]}
                                                                        maxBarSize={45}
                                                                    >
                                                                        {getMonthlyTrend().map((entry, index) => {
                                                                            const monthlyData = getMonthlyTrend();
                                                                            const maxBarValue = Math.max(...monthlyData.map(d => d.total));
                                                                            const minBarValue = Math.min(...monthlyData.map(d => d.total));
                                                                            
                                                                            // Classificar os valores do maior para o menor para mapear as cores
                                                                            const sortedValues = [...monthlyData]
                                                                                .sort((a, b) => b.total - a.total)
                                                                                .map(item => item.total);
                                                                            
                                                                            // Encontrar a posição do valor atual na lista ordenada
                                                                            const valueRank = sortedValues.indexOf(entry.total);
                                                                            
                                                                            // Calcular a intensidade normalizada (0 = maior valor, 1 = menor valor)
                                                                            const intensity = valueRank / Math.max(1, sortedValues.length - 1);
                                                                            
                                                                            // Cores com base no ranking (mais verde para os maiores valores)
                                                                            const r = Math.floor(50 + intensity * 60);
                                                                            const g = Math.floor(150 - intensity * 50);
                                                                            const b = Math.floor(120 - intensity * 40);
                                                                            
                                                                            return (
                                                                                <Cell 
                                                                                    key={`cell-${index}`}
                                                                                    fill={`rgb(${r}, ${g}, ${b})`}
                                                                                    stroke="#ffffff"
                                                                                    strokeWidth={1}
                                                                                />
                                                                            );
                                                                        })}
                                                                    </Bar>
                                                                    <ReferenceLine 
                                                                        y={getMonthlyTrend().reduce((sum, item) => sum + item.total, 0) / Math.max(1, getMonthlyTrend().length)} 
                                                                        stroke="rgba(0, 0, 0, 0.3)" 
                                                                        strokeDasharray="3 3"
                                                                        label={{ 
                                                                            value: 'Média', 
                                                                            position: 'right', 
                                                                            fill: '#666',
                                                                            fontSize: 11,
                                                                            offset: 5
                                                                        }}
                                                                    />
                                                                </BarChart>
                                                            </ResponsiveContainer>
                                                        </Box>
                                                        
                                                        {/* Bloco de pico/média/tendência */}
                                                        <Box 
                                                            sx={{ 
                                                                display: 'flex',
                                                                mt: 1,
                                                                pt: 1.5,
                                                                borderTop: '1px dashed rgba(0,0,0,0.1)',
                                                                justifyContent: 'space-around'
                                                            }}
                                                        >
                                                            {(() => {
                                                                const monthData = getMonthlyTrend();
                                                                if (!monthData || monthData.length === 0) return null;
                                                                
                                                                const statsMaxValue = Math.max(...monthData.map(d => d.total));
                                                                const maxMonth = monthData.find(d => d.total === statsMaxValue)?.month || '';
                                                                const avgValue = monthData.reduce((sum, item) => sum + item.total, 0) / monthData.length;
                                                                
                                                                let percentChange = 0;
                                                                if (monthData.length >= 2) {
                                                                    const firstValue = monthData[0].total;
                                                                    const lastValue = monthData[monthData.length-1].total;
                                                                    percentChange = ((lastValue - firstValue) / firstValue) * 100;
                                                                }
                                                                
                                                                return (
                                                                    <>
                                                                        <Box sx={{ textAlign: 'center' }}>
                                                                            <Typography variant="caption" sx={{ color: '#757575', display: 'block', fontSize: '0.75rem' }}>
                                                                                Pico
                                                                            </Typography>
                                                                            <Typography variant="body2" sx={{ color: '#009688', fontWeight: 600 }}>
                                                                                {maxMonth} ({statsMaxValue >= 1000 ? `${(statsMaxValue/1000).toFixed(1)}k` : statsMaxValue})
                                                                            </Typography>
                                                                        </Box>
                                                                        
                                                                        <Box sx={{ textAlign: 'center' }}>
                                                                            <Typography variant="caption" sx={{ color: '#757575', display: 'block', fontSize: '0.75rem' }}>
                                                                                Média
                                                                            </Typography>
                                                                            <Typography variant="body2" sx={{ color: '#009688', fontWeight: 600 }}>
                                                                                {avgValue >= 1000 ? `${(avgValue/1000).toFixed(1)}k` : Math.round(avgValue)}
                                                                            </Typography>
                                                                        </Box>
                                                                        
                                                                        <Box sx={{ textAlign: 'center' }}>
                                                                            <Typography variant="caption" sx={{ color: '#757575', display: 'block', fontSize: '0.75rem' }}>
                                                                                Tendência
                                                                            </Typography>
                                                                            <Typography 
                                                                                variant="body2" 
                                                                                sx={{ 
                                                                                    color: percentChange >= 0 ? '#2e7d32' : '#d32f2f', 
                                                                                    fontWeight: 600 
                                                                                }}
                                                                            >
                                                                                {percentChange > 0 ? '+' : ''}{percentChange.toFixed(1)}%
                                                                            </Typography>
                                                                        </Box>
                                                                    </>
                                                                );
                                                            })()}
                                                        </Box>
                                                    </Box>
                                                </Grid>
                                    
                                                {/* Recomendações Operacionais */}
                                                <Grid item xs={12}>
                                    <Box sx={{ 
                                                        bgcolor: 'rgba(3, 169, 244, 0.06)', 
                                                        p: 2, 
                                                        borderRadius: 2,
                                                        border: '1px solid rgba(3, 169, 244, 0.15)',
                                                        marginTop: 4, // Adicionando margem superior para evitar sobreposição
                                                    }}>
                                                        <Typography variant="h6" color="#0288d1" sx={{ mb: 1.5, fontWeight: 500, display: 'flex', alignItems: 'center' }}>
                                                            <LightbulbIcon sx={{ mr: 1, fontSize: 20 }} /> Recomendações para Decisões
                                        </Typography>
                                                        
                                                        {(() => {
                                                            const data = getSeasonalityData();
                                                            const weekdayData = getWeekdayTotals();
                                                            const monthlyData = getMonthlyTrend();
                                                            
                                                            const sortedDays = [...weekdayData].sort((a, b) => b.percentage - a.percentage);
                                                            const sortedMonths = [...monthlyData].sort((a, b) => b.total - a.total);
                                                            
                                                            const topDays = sortedDays.slice(0, 2).map(d => d.day);
                                                            const topMonths = sortedMonths.slice(0, 2).map(m => m.month);
                                                            
                                                            const bottomDays = sortedDays.slice(-2).map(d => d.day);
                                                            const bottomMonths = sortedMonths.slice(-2).map(m => m.month);
                                                            
                                                            const isWeekendHeavy = sortedDays[0].day === 'Dom' || sortedDays[0].day === 'Sáb';
                                                            
                                                            const dias = {
                                                                'Dom': 'Domingo', 
                                                                'Seg': 'Segunda', 
                                                                'Ter': 'Terça', 
                                                                'Qua': 'Quarta', 
                                                                'Qui': 'Quinta', 
                                                                'Sex': 'Sexta', 
                                                                'Sáb': 'Sábado'
                                                            };
                                                            
                                                            const meses = {
                                                                'Jan': 'Janeiro', 
                                                                'Fev': 'Fevereiro', 
                                                                'Mar': 'Março', 
                                                                'Abr': 'Abril', 
                                                                'Mai': 'Maio', 
                                                                'Jun': 'Junho',
                                                                'Jul': 'Julho', 
                                                                'Ago': 'Agosto', 
                                                                'Set': 'Setembro', 
                                                                'Out': 'Outubro', 
                                                                'Nov': 'Novembro', 
                                                                'Dez': 'Dezembro'
                                                            };
                                                            
                                                            return (
                                                                <Grid container spacing={2}>
                                                                    <Grid item xs={12} md={6}>
                                                                        <Box sx={{ bgcolor: '#ffffff', borderRadius: 1, p: 0 }}>
                                                                            <ListItem sx={{ py: 1.5 }}>
                                                                                <ListItemIcon sx={{ minWidth: 42 }}>
                                        <Box sx={{ 
                                                                                        bgcolor: 'rgba(3, 169, 244, 0.15)', 
                                                                                        borderRadius: '50%', 
                                                                                        width: 32, 
                                                                                        height: 32, 
                                            display: 'flex',
                                                                                        alignItems: 'center', 
                                                                                        justifyContent: 'center' 
                                                                                    }}>
                                                                                        <Typography variant="body1" fontWeight={600} color="#0288d1">1</Typography>
                                                                                    </Box>
                                                                                </ListItemIcon>
                                                                                <ListItemText
                                                                                    primary={<Typography variant="subtitle2" fontWeight={600}>{`Reforce a equipe nos dias de ${topDays.map(d => dias[d]).join(' e ')}`}</Typography>}
                                                                                    secondary={`São os dias com maior volume de demanda, representando potencial de ${sortedDays[0].percentage.toFixed(0)}% do total`}
                                                                                    secondaryTypographyProps={{ fontSize: '0.85rem' }}
                                                                                />
                                                                            </ListItem>
                                                                        </Box>
                                                                    </Grid>
                                                                    
                                                                    <Grid item xs={12} md={6}>
                                                                        <Box sx={{ bgcolor: '#ffffff', borderRadius: 1, p: 0 }}>
                                                                            <ListItem sx={{ py: 1.5 }}>
                                                                                <ListItemIcon sx={{ minWidth: 42 }}>
                                            <Box sx={{ 
                                                                                        bgcolor: 'rgba(3, 169, 244, 0.15)', 
                                                                                        borderRadius: '50%', 
                                                                                        width: 32, 
                                                                                        height: 32, 
                                                display: 'flex', 
                                                alignItems: 'center',
                                                                                        justifyContent: 'center' 
                                            }}>
                                                                                        <Typography variant="body1" fontWeight={600} color="#0288d1">2</Typography>
                                                </Box>
                                                                                </ListItemIcon>
                                                                                <ListItemText
                                                                                    primary={<Typography variant="subtitle2" fontWeight={600}>{`Planeje ações promocionais nos meses de ${topMonths.map(m => meses[m]).join(' e ')}`}</Typography>}
                                                                                    secondary="Estes meses já possuem alto volume, o que pode amplificar o impacto das suas campanhas"
                                                                                    secondaryTypographyProps={{ fontSize: '0.85rem' }}
                                                                                />
                                                                            </ListItem>
                                                                        </Box>
                                                                    </Grid>
                                                                    
                                                                    <Grid item xs={12} md={6}>
                                                                        <Box sx={{ bgcolor: '#ffffff', borderRadius: 1, p: 0 }}>
                                                                            <ListItem sx={{ py: 1.5 }}>
                                                                                <ListItemIcon sx={{ minWidth: 42 }}>
                                                <Box sx={{ 
                                                                                        bgcolor: 'rgba(3, 169, 244, 0.15)', 
                                                                                        borderRadius: '50%', 
                                                                                        width: 32, 
                                                                                        height: 32, 
                                                    display: 'flex',
                                                                                        alignItems: 'center', 
                                                                                        justifyContent: 'center' 
                                                                                    }}>
                                                                                        <Typography variant="body1" fontWeight={600} color="#0288d1">3</Typography>
                                                                                    </Box>
                                                                                </ListItemIcon>
                                                                                <ListItemText
                                                                                    primary={<Typography variant="subtitle2" fontWeight={600}>{`Implemente estratégias de aumento de demanda em ${bottomMonths.map(m => meses[m]).join(' e ')}`}</Typography>}
                                                                                    secondary="Estes meses apresentam menor volume e oferecem oportunidade para crescimento"
                                                                                    secondaryTypographyProps={{ fontSize: '0.85rem' }}
                                                                                />
                                                                            </ListItem>
                                                </Box>
                                                                    </Grid>
                                                                    
                                                                    <Grid item xs={12} md={6}>
                                                                        <Box sx={{ bgcolor: '#ffffff', borderRadius: 1, p: 0 }}>
                                                                            <ListItem sx={{ py: 1.5 }}>
                                                                                <ListItemIcon sx={{ minWidth: 42 }}>
                                    <Box sx={{ 
                                                                                        bgcolor: 'rgba(3, 169, 244, 0.15)', 
                                                                                        borderRadius: '50%', 
                                                                                        width: 32, 
                                                                                        height: 32, 
                                                                                        display: 'flex', 
                                                                                        alignItems: 'center', 
                                                                                        justifyContent: 'center' 
                                                                                    }}>
                                                                                        <Typography variant="body1" fontWeight={600} color="#0288d1">4</Typography>
                                                                                    </Box>
                                                                                </ListItemIcon>
                                                                                <ListItemText
                                                                                    primary={<Typography variant="subtitle2" fontWeight={600}>{isWeekendHeavy 
                                                                                        ? "Adote um modelo operacional com foco nos fins de semana" 
                                                                                        : "Concentre recursos nos dias úteis para maximizar atendimento"
                                                                                    }</Typography>}
                                                                                    secondary={isWeekendHeavy 
                                                                                        ? "O padrão sazonal indica maior demanda nos fins de semana, que deve ser priorizada" 
                                                                                        : "O volume é concentrado nos dias úteis, sugerindo um modelo operacional tradicional"
                                                                                    }
                                                                                    secondaryTypographyProps={{ fontSize: '0.85rem' }}
                                                                                />
                                                                            </ListItem>
                                                                        </Box>
                                            </Grid>
                                            </Grid>
                                                            );
                                                    })()}
                                                    </Box>
                                            </Grid>
                                        </Grid>
                                        </>
                                    )}
                                </CardContent>
                            </Card>
                        </Grid>
                    </>
                ) : null}
            </Grid>
        </Box>
    );
};

export default PredictiveAnalysis; 
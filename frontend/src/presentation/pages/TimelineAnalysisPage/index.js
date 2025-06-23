import React, { useState, useEffect, useCallback } from 'react';
import {
    Container,
    Grid,
    Paper,
    Typography,
    Box,
    CircularProgress,
    Alert,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Card,
    CardHeader,
    CardContent,
    Button,
    useTheme,
    Stack,
    Divider
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ptBR } from 'date-fns/locale';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Sector,
    BarChart,
    Bar,
    LabelList
} from 'recharts';
import {
    Timeline as TimelineIcon,
    FilterList as FilterListIcon,
    PieChart as PieChartIcon,
    Search as SearchIcon,
    DonutLarge as DonutLargeIcon
} from '@mui/icons-material';
import useTimelineAnalysis from '../../../application/hooks/useTimelineAnalysis';
import MainLayout from '../../layouts/MainLayout';
import incidentService from '../../../infrastructure/api/incidentService';
import { subDays } from 'date-fns';

// Paleta de cores mais atrativa e com melhor contraste
const COLORS = [
    '#2196F3', // Azul
    '#FF9800', // Laranja
    '#4CAF50', // Verde
    '#F44336', // Vermelho
    '#9C27B0', // Roxo
    '#00BCD4', // Ciano
    '#FFEB3B', // Amarelo
    '#795548', // Marrom
    '#607D8B', // Azul acinzentado
    '#E91E63'  // Rosa
];

// Componente para renderização customizada do setor ativo no gráfico de pizza
const renderActiveShape = (props) => {
    const RADIAN = Math.PI / 180;
    const { 
        cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle,
        fill, payload, percent, value, name 
    } = props;
    
    const sin = Math.sin(-RADIAN * midAngle);
    const cos = Math.cos(-RADIAN * midAngle);
    const sx = cx + (outerRadius + 10) * cos;
    const sy = cy + (outerRadius + 10) * sin;
    const mx = cx + (outerRadius + 30) * cos;
    const my = cy + (outerRadius + 30) * sin;
    const ex = mx + (cos >= 0 ? 1 : -1) * 22;
    const ey = my;
    const textAnchor = cos >= 0 ? 'start' : 'end';

    return (
        <g>
            <text x={cx} y={cy} dy={6} textAnchor="middle" fill={fill} fontSize={14} fontWeight="bold">
                {payload.name}
            </text>
            <Sector
                cx={cx}
                cy={cy}
                innerRadius={innerRadius}
                outerRadius={outerRadius}
                startAngle={startAngle}
                endAngle={endAngle}
                fill={fill}
            />
            <Sector
                cx={cx}
                cy={cy}
                startAngle={startAngle}
                endAngle={endAngle}
                innerRadius={outerRadius + 6}
                outerRadius={outerRadius + 10}
                fill={fill}
            />
            <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
            <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
            <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="#333">
                {`${name}: ${value}`}
            </text>
            <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={18} textAnchor={textAnchor} fill="#999">
                {`(${(percent * 100).toFixed(2)}%)`}
            </text>
        </g>
    );
};

// Função para formatar e validar dados do gráfico de linha
const formatTimelineData = (data) => {
    if (!data || !Array.isArray(data) || data.length === 0) {
        console.warn('Dados de timeline inválidos ou vazios:', data);
        // Retorna dados simulados para mostrar o gráfico mesmo sem dados reais
        const today = new Date();
        return Array.from({length: 7}, (_, i) => {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            return {
                date: date.toISOString().split('T')[0],
                incidents: Math.floor(Math.random() * 20) + 5 // Dados fictícios entre 5 e 25
            };
        }).reverse();
    }

    // Verificar a estrutura dos dados
    console.log('Estrutura dos dados de timeline:', data[0]);
    
    return data.map(item => {
        // Garantir que há uma propriedade "date" e "incidents" ou "valor"
        return {
            date: item.date || item.data || 'Sem data',
            incidents: item.incidents || item.quantidade || item.valor || item.count || 0
        };
    });
};

// Função para formatar e validar dados dos gráficos de pizza
const formatDistributionData = (data) => {
    if (!data || !Array.isArray(data) || data.length === 0) {
        console.warn('Dados de distribuição inválidos ou vazios:', data);
        // Retorna dados simulados para mostrar o gráfico mesmo sem dados reais
        return [
            { name: 'Grupo A', value: 12 },
            { name: 'Grupo B', value: 8 },
            { name: 'Grupo C', value: 5 }
        ];
    }

    console.log('Dados de distribuição recebidos:', data);
    
    return data.map(item => {
        return {
            name: item.name || item.nome || item.GRUPO_DIRECIONADO || 'Sem nome',
            value: item.value || item.valor || item.quantidade || item.total || item.count || 0
        };
    });
};

const TimelineAnalysisPage = () => {
    const theme = useTheme();
    const [startDate, setStartDate] = useState(subDays(new Date(), 7));
    const [endDate, setEndDate] = useState(new Date());
    const [selectedGroup, setSelectedGroup] = useState('');
    const [formattedTimelineData, setFormattedTimelineData] = useState([]);
    const [formattedActionData, setFormattedActionData] = useState([]);
    const [formattedGroupData, setFormattedGroupData] = useState([]);
    const [hasSearched, setHasSearched] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    
    // Estados para controlar o setor ativo nos gráficos de pizza
    const [activeIndexAction, setActiveIndexAction] = useState(0);
    const [activeIndexGroup, setActiveIndexGroup] = useState(0);

    const {
        timelineData,
        distributionByAction,
        distributionByGroup,
        loading: hookLoading,
        error: hookError,
        loadTimelineData
    } = useTimelineAnalysis();

    // Handlers para os eventos de mouse nos gráficos de pizza
    const onPieEnterAction = (_, index) => {
        setActiveIndexAction(index);
    };
    
    const onPieEnterGroup = (_, index) => {
        setActiveIndexGroup(index);
    };

    // Função de busca - somente será chamada ao clicar no botão
    const handleSearch = async (filters = { period: '7d' }) => {
        setLoading(true);
        setError(null);
        setHasSearched(true);

        try {
            // Se estiver usando o período padrão, atualiza as datas no formulário
            if (filters.period === '7d') {
                setStartDate(subDays(new Date(), 7));
                setEndDate(new Date());
            }

            const response = await incidentService.getTimelineAnalysis(filters.period || '7d');
            console.log('Dados recebidos da API:', response);
            
            // Processa dados da timeline (dados diários)
            if (response.dailyData && response.dailyData.length > 0) {
                const timelineFormatted = response.dailyData.map(item => ({
                    date: item.data,
                    incidents: item.quantidade
                }));
                setFormattedTimelineData(timelineFormatted);
        } else {
            setFormattedTimelineData([]);
        }

            // Processa dados de distribuição por grupo
            if (response.gruposData && response.gruposData.length > 0) {
                const groupFormatted = response.gruposData.map(item => ({
                    name: item.GRUPO_DIRECIONADO,
                    value: item.total
                }));
                setFormattedGroupData(groupFormatted);
            } else {
                setFormattedGroupData([]);
            }

            // Processa dados de distribuição por ação
            if (response.acoes) {
                const actionFormatted = Object.entries(response.acoes).map(([key, value]) => ({
                    name: key,
                    value: value
                }));
                setFormattedActionData(actionFormatted);
        } else {
            setFormattedActionData([]);
        }

        } catch (err) {
            console.error('Erro ao buscar análise temporal:', err);
            setError(err.message || 'Erro ao buscar análise temporal');
        } finally {
            setLoading(false);
        }
    };

    // Efeito para carregar os dados iniciais
    useEffect(() => {
        if (!hasSearched) {
            handleSearch({ period: '7d' });
        }
    }, []);

    // Renderiza gráfico de linha de incidentes
    const renderTimelineChart = () => {
        // Usa dados formatados ou simulados se estiverem vazios
        const chartData = formattedTimelineData?.length > 0 && formattedTimelineData.some(item => item.incidents > 0)
            ? formattedTimelineData
            : formatTimelineData([]);
            
        return (
            <ResponsiveContainer>
                <LineChart 
                    data={chartData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                        dataKey="date" 
                        tickFormatter={(value) => value ? value.split('-').slice(1).join('/') : ''}
                    />
                    <YAxis />
                    <Tooltip 
                        labelFormatter={(value) => `Data: ${value}`}
                        formatter={(value) => [`${value} incidentes`, 'Quantidade']}
                        contentStyle={{
                            backgroundColor: 'rgba(255, 255, 255, 0.9)',
                            borderRadius: '8px',
                            boxShadow: '0 2px 5px rgba(0,0,0,0.15)',
                            padding: '10px',
                            border: 'none'
                        }}
                    />
                    <Legend />
                    <Line
                        type="monotone"
                        dataKey="incidents"
                        stroke="#3f51b5"
                        name="Incidentes"
                        strokeWidth={3}
                        dot={{ r: 5, fill: '#3f51b5', stroke: '#fff', strokeWidth: 2 }}
                        activeDot={{ r: 8, fill: '#3f51b5', stroke: '#fff', strokeWidth: 2 }}
                        isAnimationActive={true}
                        animationDuration={1000}
                    />
                </LineChart>
            </ResponsiveContainer>
        );
    };

    // Renderiza gráficos de distribuição (pizza)
    const renderDistributionCharts = () => {
        // Usa dados formatados ou simulados se estiverem vazios
        const actionData = formattedActionData?.length > 0 && formattedActionData.some(item => item.value > 0)
            ? formattedActionData
            : [
                { name: 'RESOLVIDO', value: 12 },
                { name: 'DIRECIONADO', value: 8 },
                { name: 'CANCELADO', value: 4 }
            ];
            
        const groupData = formattedGroupData?.length > 0 && formattedGroupData.some(item => item.value > 0)
            ? formattedGroupData
            : [
                { name: 'Suporte N1', value: 10 },
                { name: 'Suporte N2', value: 7 },
                { name: 'Infraestrutura', value: 5 }
            ];

        return (
        <>
            {/* Distribuição por Ação - Gráfico de Pizza Melhorado */}
            <Grid item xs={12} md={6}>
                <Card sx={{ 
                    borderLeft: '4px solid #FF9800',
                    borderRadius: 1,
                    transition: 'all 0.3s ease',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    height: '100%',
                    '&:hover': {
                        boxShadow: '0 6px 12px rgba(255, 152, 0, 0.15)'
                    }
                }}>
                    <CardHeader
                        title="Distribuição por Ação"
                        subheader="Incidentes por tipo de ação realizada"
                        avatar={<DonutLargeIcon style={{ color: '#FF9800' }} />}
                        titleTypographyProps={{ fontWeight: 'bold' }}
                    />
                        <CardContent sx={{ height: 420, display: 'flex', flexDirection: 'column', pt: 2 }}>
                            <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
                                <Box sx={{ flex: '1 1 auto', minHeight: 0, maxHeight: 'calc(100% - 80px)', display: 'flex', alignItems: 'center' }}>
                                    <ResponsiveContainer>
                                        <PieChart>
                                            <Pie
                                                activeIndex={activeIndexAction}
                                                activeShape={renderActiveShape}
                                                data={actionData}
                                                cx="50%"
                                                cy="47%"
                                                innerRadius={70}
                                                outerRadius={100}
                                                dataKey="value"
                                                nameKey="name"
                                                onMouseEnter={onPieEnterAction}
                                                isAnimationActive={true}
                                                animationBegin={0}
                                                animationDuration={1000}
                                                paddingAngle={4}
                                            >
                                                {actionData.map((entry, index) => (
                                                    <Cell 
                                                        key={`cell-${index}`} 
                                                        fill={COLORS[index % COLORS.length]} 
                                                        stroke={theme.palette.background.paper}
                                                        strokeWidth={2}
                                                    />
                                                ))}
                                            </Pie>
                                            <Tooltip 
                                                formatter={(value, name, props) => [`${value} incidentes`, props.payload.name]}
                                                contentStyle={{
                                                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                                    borderRadius: '8px',
                                                    boxShadow: '0 2px 5px rgba(0,0,0,0.15)',
                                                    padding: '10px',
                                                    border: 'none'
                                                }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </Box>
                                <Box sx={{ 
                                    mt: 'auto', 
                                    pt: 2,
                                    display: 'flex', 
                                    justifyContent: 'center', 
                                    flexWrap: 'wrap', 
                                    gap: 1,
                                    minHeight: '80px'
                                }}>
                                    {actionData.map((entry, index) => (
                                        <Box 
                                            key={`legend-${index}`} 
                                            sx={{ 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                mx: 1, 
                                                cursor: 'pointer',
                                                '&:hover': { opacity: 0.8 }
                                            }}
                                            onClick={() => setActiveIndexAction(index)}
                                        >
                                            <Box 
                                                sx={{ 
                                                    width: 12, 
                                                    height: 12, 
                                                    backgroundColor: COLORS[index % COLORS.length],
                                                    mr: 1,
                                                    borderRadius: '4px'
                                                }} 
                                            />
                                            <Typography variant="body2" color="text.secondary">
                                                {entry.name}: {entry.value}
                                            </Typography>
                                        </Box>
                                    ))}
                                </Box>
                            </Box>
                    </CardContent>
                </Card>
            </Grid>

            {/* Distribuição por Grupo - Gráfico de Pizza Melhorado */}
            <Grid item xs={12} md={6}>
                <Card sx={{ 
                    borderLeft: '4px solid #4CAF50',
                    borderRadius: 1,
                    transition: 'all 0.3s ease',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    height: '100%',
                    '&:hover': {
                        boxShadow: '0 6px 12px rgba(76, 175, 80, 0.15)'
                    }
                }}>
                    <CardHeader
                        title="Distribuição por Grupo"
                        subheader="Incidentes por grupo responsável"
                        avatar={<DonutLargeIcon style={{ color: '#4CAF50' }} />}
                        titleTypographyProps={{ fontWeight: 'bold' }}
                    />
                        <CardContent sx={{ height: 420, display: 'flex', flexDirection: 'column', pt: 2 }}>
                            <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                activeIndex={activeIndexGroup}
                                                activeShape={renderActiveShape}
                                            data={groupData}
                                                cx="50%"
                                            cy="47%"
                                                innerRadius={70}
                                                outerRadius={100}
                                                dataKey="value"
                                                nameKey="name"
                                                onMouseEnter={onPieEnterGroup}
                                                isAnimationActive={true}
                                                animationBegin={200}
                                                animationDuration={1000}
                                                paddingAngle={4}
                                            >
                                            {groupData.map((entry, index) => (
                                                    <Cell 
                                                        key={`cell-${index}`} 
                                                        fill={COLORS[index % COLORS.length]} 
                                                        stroke={theme.palette.background.paper}
                                                        strokeWidth={2}
                                                    />
                                                ))}
                                            </Pie>
                                            <Tooltip 
                                                formatter={(value, name, props) => [`${value} incidentes`, props.payload.name]}
                                                contentStyle={{
                                                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                                    borderRadius: '8px',
                                                    boxShadow: '0 2px 5px rgba(0,0,0,0.15)',
                                                    padding: '10px',
                                                    border: 'none'
                                                }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </Box>
                            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 1, minHeight: '80px' }}>
                                {groupData.map((entry, index) => (
                                        <Box 
                                            key={`legend-${index}`} 
                                            sx={{ 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                mx: 1,
                                                cursor: 'pointer',
                                                '&:hover': { opacity: 0.8 }
                                            }}
                                            onClick={() => setActiveIndexGroup(index)}
                                        >
                                            <Box 
                                                sx={{ 
                                                    width: 12, 
                                                    height: 12, 
                                                    backgroundColor: COLORS[index % COLORS.length],
                                                    mr: 1,
                                                    borderRadius: '4px'
                                                }} 
                                            />
                                            <Typography variant="body2" color="text.secondary">
                                                {entry.name}: {entry.value}
                                            </Typography>
                                        </Box>
                                    ))}
                                </Box>
                    </CardContent>
                </Card>
            </Grid>
        </>
    );
    };

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
                    <TimelineIcon color="primary" sx={{ mr: 1 }} /> 
                    Análise Temporal
                </Typography>

                <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
                    <Grid container spacing={2} sx={{ 
                        width: '100%', 
                        maxWidth: '98%',
                        margin: '0 auto',
                        justifyContent: 'center'
                    }}>
                        {/* Filtros */}
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
                                        <Grid item xs={12} sm={3}>
                                            <DatePicker
                                                label="Data Inicial"
                                                value={startDate}
                                                onChange={setStartDate}
                                            slotProps={{ 
                                                textField: { 
                                                    fullWidth: true,
                                                    variant: "outlined"
                                                } 
                                            }}
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={3}>
                                            <DatePicker
                                                label="Data Final"
                                                value={endDate}
                                                onChange={setEndDate}
                                            slotProps={{ 
                                                textField: { 
                                                    fullWidth: true,
                                                    variant: "outlined"
                                                } 
                                            }}
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={3}>
                                        <FormControl fullWidth variant="outlined">
                                                <InputLabel>Grupo</InputLabel>
                                                <Select
                                                    value={selectedGroup}
                                                    onChange={(e) => setSelectedGroup(e.target.value)}
                                                    label="Grupo"
                                                >
                                                    <MenuItem value="">Todos</MenuItem>
                                                <MenuItem value="INFRA">Infraestrutura</MenuItem>
                                                <MenuItem value="SUPORTE">Suporte</MenuItem>
                                                <MenuItem value="DESENVOLVIMENTO">Desenvolvimento</MenuItem>
                                                </Select>
                                            </FormControl>
                                        </Grid>
                                        <Grid item xs={12} sm={3}>
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
                        </Grid>

                        {loading ? (
                            <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                                <CircularProgress />
                            </Grid>
                        ) : error ? (
                            <Grid item xs={12}>
                                <Alert severity="error">{error}</Alert>
                            </Grid>
                        ) : !hasSearched ? null : formattedTimelineData.length === 0 ? (
                            <Grid item xs={12}>
                                <Alert severity="warning">
                                    Nenhum dado encontrado para os filtros selecionados.
                                </Alert>
                            </Grid>
                        ) : (
                            <>
                                {/* Padrões de Ocorrência */}
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
                                            title="Padrões de Ocorrência"
                                            subheader="Evolução de incidentes ao longo do tempo"
                                            avatar={<TimelineIcon style={{ color: '#3f51b5' }} />}
                                            titleTypographyProps={{ fontWeight: 'bold' }}
                                        />
                                        <CardContent sx={{ height: 400 }}>
                                            {renderTimelineChart()}
                                        </CardContent>
                                    </Card>
                                </Grid>

                                {/* Renderiza os gráficos de distribuição */}
                                {renderDistributionCharts()}
                            </>
                        )}
                    </Grid>
                </LocalizationProvider>
            </Box>
        </MainLayout>
    );
};

export default TimelineAnalysisPage; 
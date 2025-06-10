import React, { useState } from 'react';
import { Card, CardHeader, CardContent, Typography, List, ListItem, ListItemText, 
         Chip, CircularProgress, Box, Divider, Button, Select, MenuItem, FormControl, 
         InputLabel, IconButton, Tooltip, Grid } from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import RecommendationIcon from '@mui/icons-material/Lightbulb';
import ErrorIcon from '@mui/icons-material/Error';
import FilterListIcon from '@mui/icons-material/FilterList';
import useRecommendations from '../../../application/hooks/useRecommendations';
import { styles } from './styles';

const RecommendationsCard = ({ productId, date, onError, variant = 'default', borderColor = '#03a9f4' }) => {
  const [showFilters, setShowFilters] = useState(false);
  
  const { 
    recommendations, 
    loading, 
    error, 
    category,
    limit,
    filterByCategory,
    changeLimit,
    refreshRecommendations
  } = useRecommendations(productId, date);

  // Notifica o componente pai sobre erros
  React.useEffect(() => {
    if (error && onError) {
      onError(error);
    }
  }, [error, onError]);

  const categoryColors = {
    'Capacidade': '#1976d2',
    'Recursos': '#2e7d32',
    'Planejamento': '#7b1fa2',
    'Anomalias': '#d32f2f',
    'Fatores de Influência': '#ed6c02',
    'Análise': '#0288d1',
    'Estratégia': '#689f38',
    'default': '#757575'
  };

  const priorityLabels = {
    'Alta': 'Alta Prioridade',
    'Média': 'Média Prioridade',
    'Baixa': 'Baixa Prioridade'
  };

  // Renderiza evidências de suporte para uma recomendação
  const renderEvidence = (evidence) => {
    if (!evidence || !Array.isArray(evidence) || evidence.length === 0) return null;

    return (
      <Box sx={styles.evidenceContainer}>
        <Typography variant="caption" color="text.secondary" component="div">
          Evidências:
        </Typography>
        <List dense disablePadding>
          {evidence.map((item, index) => (
            <ListItem key={index} disablePadding sx={{ py: 0.2 }}>
              <Typography variant="caption" color="text.secondary">
                • {item.description}
              </Typography>
            </ListItem>
          ))}
        </List>
      </Box>
    );
  };

  const handleCategoryChange = (e) => {
    filterByCategory(e.target.value);
  };

  const handleLimitChange = (e) => {
    changeLimit(e.target.value);
  };

  // Obter as duas recomendações mais impactantes
  const getTopRecommendations = (recs) => {
    if (!recs || !recs.length) return [];
    
    // Ordena por impactPercentage (do maior para o menor)
    return [...recs].sort((a, b) => (b.impactPercentage || 0) - (a.impactPercentage || 0)).slice(0, 2);
  };

  // Versão compacta para a página de análise preditiva
  if (variant === 'compact') {
    const topRecommendations = getTopRecommendations(recommendations);
    
    return (
      <Card sx={{ 
        borderLeft: `4px solid ${borderColor}`,
        borderRadius: 1,
        transition: 'all 0.3s ease',
        height: '100%',
        minHeight: 320,
        '&:hover': {
          boxShadow: `0 6px 12px rgba(${parseInt(borderColor.slice(1, 3), 16)}, ${parseInt(borderColor.slice(3, 5), 16)}, ${parseInt(borderColor.slice(5, 7), 16)}, 0.15)`
        }
      }}>
        <CardHeader 
          title="Recomendações Baseadas em Dados" 
          avatar={<RecommendationIcon sx={{ color: borderColor, fontSize: 26, background: `rgba(${parseInt(borderColor.slice(1, 3), 16)}, ${parseInt(borderColor.slice(3, 5), 16)}, ${parseInt(borderColor.slice(5, 7), 16)}, 0.1)`, p: 0.8, borderRadius: '50%' }} />}
          subheader="Principais ações recomendadas baseadas nos dados"
          titleTypographyProps={{ 
            variant: 'h6',
            fontWeight: 400,
            fontSize: '1rem',
            color: 'rgba(0, 0, 0, 0.75)'
          }}
          subheaderTypographyProps={{
            fontSize: '0.85rem',
            color: 'rgba(0, 0, 0, 0.6)'
          }}
          sx={{
            pb: 1,
            '& .MuiCardHeader-content': {
              overflow: 'hidden'
            }
          }}
        />
        <Divider sx={{ display: 'none' }} />
        <CardContent sx={{ px: 2.5, py: 1.75 }}>
          {loading ? (
            <Box sx={styles.loadingContainer}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Box sx={styles.errorContainer}>
              <ErrorIcon color="error" sx={styles.errorIcon} />
              <Typography color="error" align="center">{error}</Typography>
              <Button 
                variant="outlined" 
                color="primary" 
                size="small" 
                onClick={refreshRecommendations}
                sx={styles.retryButton}
              >
                Tentar Novamente
              </Button>
            </Box>
          ) : topRecommendations.length === 0 ? (
            <Box sx={styles.noData}>
              <Typography color="text.secondary" align="center">
                Nenhuma recomendação disponível para o período selecionado.
              </Typography>
            </Box>
          ) : (
            <Grid container spacing={2} sx={{ mt: 0 }}>
              {topRecommendations.map((recommendation, index) => (
                <Grid item xs={12} md={6} key={index}>
                  <Box sx={{ 
                    p: 1.75, 
                    border: `1px solid rgba(${parseInt(borderColor.slice(1, 3), 16)}, ${parseInt(borderColor.slice(3, 5), 16)}, ${parseInt(borderColor.slice(5, 7), 16)}, 0.2)`,
                    borderRadius: 1.5,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      boxShadow: '0 3px 6px rgba(0,0,0,0.1)',
                      borderColor: `rgba(${parseInt(borderColor.slice(1, 3), 16)}, ${parseInt(borderColor.slice(3, 5), 16)}, ${parseInt(borderColor.slice(5, 7), 16)}, 0.35)`,
                      transform: 'translateY(-2px)'
                    }
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 0.75 }}>
                      <RecommendationIcon sx={{ 
                        color: borderColor, 
                        mt: 0.2, 
                        mr: 1, 
                        fontSize: 20,
                        background: `rgba(${parseInt(borderColor.slice(1, 3), 16)}, ${parseInt(borderColor.slice(3, 5), 16)}, ${parseInt(borderColor.slice(5, 7), 16)}, 0.08)`,
                        p: 0.4,
                        borderRadius: '50%'
                      }} />
                      <Typography variant="h6" sx={{ fontWeight: 500, lineHeight: 1.3, fontSize: '0.9rem', color: 'rgba(0, 0, 0, 0.75)' }}>
                        {recommendation.title}
                      </Typography>
                    </Box>
                    <Typography variant="body1" sx={{ 
                      mb: 1.25, 
                      flexGrow: 1, 
                      color: 'text.primary',
                      fontSize: '0.875rem',
                      lineHeight: 1.4
                    }}>
                      {recommendation.description}
                    </Typography>
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      mt: 'auto',
                      pt: 0.75,
                      backgroundColor: 'rgba(0,0,0,0.01)',
                      mx: -1.75,
                      px: 1.75,
                      pb: 0.5,
                      borderBottomLeftRadius: 6,
                      borderBottomRightRadius: 6
                    }}>
                      <Box sx={{ 
                        display: 'inline-block', 
                        px: 1.5, 
                        py: 0.4, 
                        borderRadius: 2, 
                        backgroundColor: recommendation.priority === 'Alta' ? 'rgba(244, 67, 54, 0.1)' : 'rgba(255, 152, 0, 0.1)',
                        color: recommendation.priority === 'Alta' ? '#d32f2f' : '#ed6c02',
                        fontSize: '0.75rem',
                        fontWeight: 600
                      }}>
                        {recommendation.priority}
                      </Box>
                      {recommendation.impactPercentage && (
                        <Box sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5
                        }}>
                          <InfoIcon sx={{ fontSize: 16, color: 'action.active', opacity: 0.7 }} />
                          <Typography variant="caption" sx={{ 
                            color: 'text.secondary',
                            fontWeight: 600,
                            fontSize: '0.8rem'
                          }}>
                            Impacto: {recommendation.impactPercentage.toFixed(1)}%
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Box>
                </Grid>
              ))}
            </Grid>
          )}
        </CardContent>
      </Card>
    );
  }

  // Versão padrão para a página dedicada de recomendações
  return (
    <Card variant="outlined" sx={styles.card}>
      <CardHeader
        title="Recomendações Baseadas em Dados"
        titleTypographyProps={{ variant: 'h6' }}
        avatar={<RecommendationIcon color="primary" />}
        action={
          <IconButton aria-label="filtrar" onClick={() => setShowFilters(!showFilters)}>
            <FilterListIcon />
          </IconButton>
        }
        sx={styles.cardHeader}
      />
      
      {showFilters && (
        <Box sx={styles.filterContainer}>
          <Box display="flex" flexDirection="row" gap={2}>
            <FormControl variant="outlined" size="small" sx={{ minWidth: 150 }}>
              <InputLabel id="category-select-label">Categoria</InputLabel>
              <Select
                labelId="category-select-label"
                value={category}
                onChange={handleCategoryChange}
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

            <FormControl variant="outlined" size="small" sx={{ minWidth: 100 }}>
              <InputLabel id="limit-select-label">Quantidade</InputLabel>
              <Select
                labelId="limit-select-label"
                value={limit}
                onChange={handleLimitChange}
                label="Quantidade"
              >
                <MenuItem value={3}>3</MenuItem>
                <MenuItem value={5}>5</MenuItem>
                <MenuItem value={10}>10</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>
      )}

      <Divider />
      
      <CardContent sx={styles.contentContainer}>
        {loading ? (
          <Box sx={styles.loadingContainer}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Box sx={styles.errorContainer}>
            <ErrorIcon color="error" sx={styles.errorIcon} />
            <Typography color="error" align="center">{error}</Typography>
            <Button 
              variant="outlined" 
              color="primary" 
              size="small" 
              onClick={refreshRecommendations}
              sx={styles.retryButton}
            >
              Tentar Novamente
            </Button>
          </Box>
        ) : recommendations.length === 0 ? (
          <Box sx={styles.noData}>
            <Typography color="text.secondary" align="center">
              Nenhuma recomendação encontrada para os critérios selecionados.
            </Typography>
          </Box>
        ) : (
          <List dense disablePadding>
            {recommendations.map((recommendation, index) => (
              <React.Fragment key={index}>
                {index > 0 && <Divider component="li" />}
                <ListItem 
                  alignItems="flex-start" 
                  sx={styles.recommendationItem}
                >
                  <ListItemText
                    primary={
                      <Box sx={styles.titleContainer}>
                        <Typography variant="subtitle1" component="span">{recommendation.title}</Typography>
                        <Tooltip title={`Impacto estimado: ${recommendation.impactPercentage.toFixed(1)}%`}>
                          <Box sx={styles.infoIcon}>
                            <InfoIcon fontSize="small" color="action" />
                          </Box>
                        </Tooltip>
                      </Box>
                    }
                    secondary={
                      <>
                        <Typography variant="body2" color="text.primary" gutterBottom>
                          {recommendation.description}
                        </Typography>
                        
                        <Box sx={styles.chipContainer}>
                          <Chip 
                            label={recommendation.category}
                            size="small"
                            sx={{ 
                              ...styles.categoryChip,
                              bgcolor: categoryColors[recommendation.category] || categoryColors.default,
                            }}
                          />
                          <Chip 
                            label={priorityLabels[recommendation.priority] || recommendation.priority}
                            size="small"
                            variant="outlined"
                            sx={styles.priorityChip}
                          />
                        </Box>
                        
                        {recommendation.supportingEvidence && renderEvidence(recommendation.supportingEvidence)}
                      </>
                    }
                  />
                </ListItem>
              </React.Fragment>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  );
};

export default RecommendationsCard; 
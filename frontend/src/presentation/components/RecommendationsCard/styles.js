// Estilos para o componente RecommendationsCard
export const styles = {
  card: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    transition: 'all 0.3s ease',
    '&:hover': {
      boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
    }
  },
  cardHeader: {
    padding: '16px 16px 8px 16px',
  },
  contentContainer: {
    flexGrow: 1,
    padding: 0,
    '&:last-child': {
      paddingBottom: 0
    }
  },
  noData: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '200px',
    flexDirection: 'column',
    textAlign: 'center',
    padding: '0 16px'
  },
  filterContainer: {
    padding: '0 16px 16px',
  },
  recommendationItem: {
    padding: '12px 16px',
    borderRadius: '4px',
    '&:hover': {
      backgroundColor: 'rgba(0, 0, 0, 0.04)'
    }
  },
  evidenceContainer: {
    marginTop: 1,
    paddingLeft: 2,
    borderLeft: '1px solid #e0e0e0'
  },
  chipContainer: {
    display: 'flex',
    gap: 1,
    marginTop: 1
  },
  categoryChip: {
    color: 'white',
    fontSize: '0.7rem'
  },
  priorityChip: {
    fontSize: '0.7rem'
  },
  titleContainer: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: 0.5
  },
  infoIcon: {
    marginLeft: 1,
    display: 'inline-flex'
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '200px'
  },
  errorContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '200px'
  },
  errorIcon: {
    fontSize: 40,
    marginBottom: 2
  },
  retryButton: {
    marginTop: 2
  }
}; 
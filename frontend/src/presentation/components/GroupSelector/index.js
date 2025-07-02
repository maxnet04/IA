import React, { useState, useEffect } from 'react';
import {
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Box,
    Typography,
    Chip,
    CircularProgress,
    Alert
} from '@mui/material';
/**
 * Componente para seleção de grupo direcionado
 */
const GroupSelector = ({
    value,
    onChange,
    disabled = false,
    label = 'Selecionar Grupo',
    size = 'medium',
    variant = 'outlined',
    groups = [],
    loading = false,
    error = null,
    hideAllOption = false
}) => {
    const [selectedValue, setSelectedValue] = useState(value || '');

    // Atualiza valor quando prop value muda
    useEffect(() => {
        setSelectedValue(value || '');
    }, [value]);

    const handleSelectionChange = (event) => {
        const newValue = event.target.value;
        setSelectedValue(newValue);
        if (onChange) {
            onChange({
                value: newValue,
                type: 'group'
            });
        }
    };

    const renderOptions = () => {
        const options = [];
        
        // Só adiciona a opção "Todos os Grupos" se hideAllOption for false
        if (!hideAllOption) {
            options.push(
                <MenuItem key="ALL" value="ALL">
                    <Box display="flex" alignItems="center" gap={1}>
                        <Chip
                            label="TODOS"
                            size="small"
                            color="primary"
                            variant="outlined"
                        />
                        <Typography>Todos os Grupos</Typography>
                    </Box>
                </MenuItem>
            );
        }
        
        // Adiciona os grupos específicos
        options.push(...groups.map((group) => (
            <MenuItem key={group.group_id} value={group.group_id}>
                <Box display="flex" alignItems="center" gap={1}>
                    <Chip
                        label={group.total_incidents || 0}
                        size="small"
                        color="secondary"
                    />
                    <Typography>{group.group_name || group.group_id}</Typography>
                </Box>
            </MenuItem>
        )));
        
        return options;
    };

    return (
        <FormControl fullWidth size={size} variant={variant} disabled={disabled || loading}>
            <InputLabel>{label}</InputLabel>
            <Select
                value={selectedValue}
                label={label}
                onChange={handleSelectionChange}
                renderValue={(selected) => {
                    if (selected === 'ALL') return 'Todos os Grupos';
                    const group = groups.find(g => g.group_id === selected);
                    return group ? (group.group_name || group.group_id) : '';
                }}
            >
                {loading && (
                    <MenuItem disabled>
                        <Box display="flex" alignItems="center" gap={1}>
                            <CircularProgress size={16} />
                            <Typography variant="body2" color="textSecondary">
                                Carregando grupos...
                            </Typography>
                        </Box>
                    </MenuItem>
                )}
                {renderOptions()}
            </Select>
            {error && (
                <Alert severity="error" sx={{ mt: 1 }}>
                    {error}
                </Alert>
            )}
        </FormControl>
    );
};

export default GroupSelector; 
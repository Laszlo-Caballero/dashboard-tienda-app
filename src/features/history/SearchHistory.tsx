import React, { useState, useEffect } from 'react';
import { api } from '../../core/api';
import type { SearchHistoryEntry } from '../../core/api';
import {
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Chip,
  IconButton,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Delete, Mic, Image, Search, Refresh } from '@mui/icons-material';

export const SearchHistory: React.FC = () => {
  const [history, setHistory] = useState<SearchHistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const data = await api.history.list();
      setHistory(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleClearHistory = async () => {
    if (window.confirm('¿Está seguro de que desea borrar de forma permanente todo el historial de búsquedas?')) {
      setLoading(true);
      try {
        const res = await api.history.clear();
        if (res.status === 'success') {
          setSuccessMsg('Historial borrado exitosamente.');
          setHistory([]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
  };

  const getSearchIcon = (type: string) => {
    switch (type) {
      case 'voice': return <Mic color="primary" fontSize="small" />;
      case 'image': return <Image color="secondary" fontSize="small" />;
      default: return <Search color="action" fontSize="small" />;
    }
  };

  const getSearchTypeLabel = (type: string) => {
    switch (type) {
      case 'voice': return 'Voz';
      case 'image': return 'Imagen (CLIP)';
      default: return 'Texto';
    }
  };

  return (
    <Box>
      <Paper sx={{ p: 2, mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Monitoreo e Historial de Consultas de Clientes por Búsqueda Semántica Vectorial y Vocal
        </Typography>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton onClick={fetchHistory} size="small">
            <Refresh />
          </IconButton>
          <Button
            variant="outlined"
            color="error"
            startIcon={<Delete />}
            onClick={handleClearHistory}
            disabled={history.length === 0 || loading}
          >
            Borrar Todo el Historial
          </Button>
        </Box>
      </Paper>

      {successMsg && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccessMsg('')}>
          {successMsg}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}>
          <CircularProgress />
        </Box>
      ) : history.length === 0 ? (
        <Paper sx={{ p: 5, textAlign: 'center', borderRadius: 3 }}>
          <Typography color="text.secondary">
            El historial de búsquedas está vacío. Realice búsquedas de productos por voz o por imagen para ver los registros aquí.
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell>Icono</TableCell>
                <TableCell>Tipo de Búsqueda</TableCell>
                <TableCell>Consulta / Archivo</TableCell>
                <TableCell>Fecha y Hora</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {history.map((entry) => (
                <TableRow key={entry.historialid} hover>
                  <TableCell width={60}>{getSearchIcon(entry.tipo_busqueda)}</TableCell>
                  <TableCell>
                    <Chip
                      label={getSearchTypeLabel(entry.tipo_busqueda)}
                      size="small"
                      color={entry.tipo_busqueda === 'voice' ? 'primary' : entry.tipo_busqueda === 'image' ? 'secondary' : 'default'}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell sx={{ fontWeight: '500' }}>
                    {entry.consulta}
                  </TableCell>
                  <TableCell>
                    {new Date(entry.fecha).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

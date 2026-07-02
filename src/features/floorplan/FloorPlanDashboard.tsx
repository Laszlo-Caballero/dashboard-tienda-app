import React, { useState, useEffect } from 'react';
import { api } from '../../core/api';
import type { FloorplanTask, FloorplanTaskResult, FloorplanNode } from '../../core/api';
import {
  Box,
  Button,
  Typography,
  Grid,
  Paper,
  Divider,
  CircularProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  IconButton,
} from '@mui/material';
import { CloudUpload, Refresh } from '@mui/icons-material';

export const FloorPlanDashboard: React.FC = () => {
  const [tasks, setTasks] = useState<FloorplanTask[]>([]);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [activeTaskResult, setActiveTaskResult] = useState<FloorplanTaskResult | null>(null);
  const [activeTaskStatus, setActiveTaskStatus] = useState<string>('');
  const [selectedNode, setSelectedNode] = useState<FloorplanNode | null>(null);
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch histories
  const fetchTasks = async () => {
    try {
      const res = await api.floorplan.allTasks();
      setTasks(res.tasks);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // Poll active task status
  useEffect(() => {
    if (!activeTaskId) return;

    const interval = setInterval(async () => {
      try {
        const res = await api.floorplan.getResult(activeTaskId);
        setActiveTaskStatus(res.status);
        if (res.status === 'success' && res.data) {
          setActiveTaskResult(res.data);
          setActiveTaskId(null); // Stop polling
          fetchTasks(); // Refresh list
        } else if (res.status === 'failed') {
          setErrorMsg('El procesamiento del plano falló. Por favor intente de nuevo.');
          setActiveTaskId(null);
          fetchTasks();
        }
      } catch (err) {
        console.error(err);
        setActiveTaskId(null);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeTaskId]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setErrorMsg('');
    setActiveTaskResult(null);
    setSelectedNode(null);
    try {
      const res = await api.floorplan.analyze(file);
      if (res.task_id) {
        setActiveTaskId(res.task_id);
        setActiveTaskStatus(res.status);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al iniciar análisis de plano.');
    } finally {
      setUploading(false);
    }
  };

  const handleSelectHistoricalTask = (task: FloorplanTask) => {
    if (task.status === 'SUCCESS' && task.result) {
      if (task.result.status === 'success' && task.result.data) {
        setActiveTaskResult(task.result.data);
        setActiveTaskStatus('success');
        setSelectedNode(null);
        setErrorMsg('');
      } else {
        setErrorMsg(task.result.message || 'La tarea falló internamente.');
        setActiveTaskResult(null);
      }
    } else {
      setErrorMsg(`La tarea seleccionada está en estado: ${task.status}`);
      setActiveTaskResult(null);
    }
  };

  // Node Color Helper
  const getNodeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'office': return '#6366f1';
      case 'hallway': return '#10b981';
      case 'retail': return '#f59e0b';
      case 'checkout': return '#ef4444';
      default: return '#6b7280';
    }
  };

  return (
    <Box>
      <Grid container spacing={3}>
        {/* Left Side: Upload & Task Monitor */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
            Analizar Plano Topológico (CV/AI)
          </Typography>
          
          <Paper sx={{ p: 3, mb: 3, textAlign: 'center', border: '2px dashed #ccc', borderRadius: 3 }}>
            <CloudUpload sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Cargue el plano arquitectónico de la tienda (PNG, JPG) para procesar
            </Typography>
            <Button
              variant="contained"
              component="label"
              fullWidth
              disabled={uploading || !!activeTaskId}
            >
              {uploading ? 'Cargando Plano...' : 'Seleccionar Archivo'}
              <input type="file" hidden accept="image/*" onChange={handleFileUpload} />
            </Button>
          </Paper>

          {/* Active Poll status */}
          {activeTaskId && (
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={16} /> Procesando Tarea Celery Asíncrona
              </Typography>
              <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                Task ID: <code>{activeTaskId}</code>
              </Typography>
              <Typography variant="caption" sx={{ display: 'block' }}>
                Estado: <Chip label={activeTaskStatus} size="small" color="warning" sx={{ height: 16, fontSize: 10 }} />
              </Typography>
            </Alert>
          )}

          {errorMsg && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setErrorMsg('')}>
              {errorMsg}
            </Alert>
          )}

          {/* Celery tasks monitor from Redis */}
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            Tareas en Celery / Redis
            <IconButton size="small" onClick={fetchTasks}>
              <Refresh fontSize="small" />
            </IconButton>
          </Typography>

          <TableContainer component={Paper} sx={{ maxHeight: 350, borderRadius: 2 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Task ID</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Acción</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tasks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} align="center">Sin historial de tareas</TableCell>
                  </TableRow>
                ) : (
                  tasks.map((t) => (
                    <TableRow key={t.task_id} hover>
                      <TableCell sx={{ fontSize: 11 }}>
                        <code>{t.task_id.substring(0, 10)}...</code>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={t.status}
                          size="small"
                          color={t.status === 'SUCCESS' ? 'success' : t.status === 'FAILURE' ? 'error' : 'warning'}
                          sx={{ fontSize: 9, height: 18 }}
                        />
                      </TableCell>
                      <TableCell>
                        <Button size="small" variant="text" onClick={() => handleSelectHistoricalTask(t)}>
                          Ver
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>

        {/* Right Side: Graph Visualizer and Details */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
            Grafo Topológico Resultante
          </Typography>

          {activeTaskResult ? (
            <Box>
              {/* Summary Cards */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid size={{ xs: 3 }}>
                  <Paper sx={{ p: 1.5, textAlign: 'center' }}>
                    <Typography variant="caption" color="text.secondary">Total Nodos</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>{activeTaskResult.summary.total_nodes}</Typography>
                  </Paper>
                </Grid>
                <Grid size={{ xs: 3 }}>
                  <Paper sx={{ p: 1.5, textAlign: 'center' }}>
                    <Typography variant="caption" color="text.secondary">Total Conexiones</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>{activeTaskResult.summary.total_edges}</Typography>
                  </Paper>
                </Grid>
                <Grid size={{ xs: 3 }}>
                  <Paper sx={{ p: 1.5, textAlign: 'center' }}>
                    <Typography variant="caption" color="text.secondary">Habitaciones</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>{activeTaskResult.summary.rooms}</Typography>
                  </Paper>
                </Grid>
                <Grid size={{ xs: 3 }}>
                  <Paper sx={{ p: 1.5, textAlign: 'center' }}>
                    <Typography variant="caption" color="text.secondary">Pasillos</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>{activeTaskResult.summary.corridors}</Typography>
                  </Paper>
                </Grid>
              </Grid>

              {/* Dynamic SVG Graph Canvas */}
              <Paper
                variant="outlined"
                sx={{
                  width: '100%',
                  bgcolor: '#fafafa',
                  borderRadius: 3,
                  position: 'relative',
                  overflow: 'hidden',
                  p: 1,
                  mb: 3
                }}
              >
                <svg
                  viewBox="0 0 600 600"
                  style={{ width: '100%', height: 'auto', maxHeight: 450 }}
                >
                  <rect width="600" height="600" fill="#f8fafc" rx="8" />

                  {/* Draw Edges */}
                  {activeTaskResult.edges.map((edge, idx) => {
                    const sourceNode = activeTaskResult.nodes.find(n => n.id === edge.source);
                    const targetNode = activeTaskResult.nodes.find(n => n.id === edge.target);
                    if (!sourceNode || !targetNode) return null;

                    // Centroid mapped coordinates scaled to 600x600 canvas
                    // Original range roughly: [0-500] -> [0-600]
                    const x1 = (sourceNode.centroid[0] / 500) * 500 + 50;
                    const y1 = (sourceNode.centroid[1] / 600) * 500 + 50;
                    const x2 = (targetNode.centroid[0] / 500) * 500 + 50;
                    const y2 = (targetNode.centroid[1] / 600) * 500 + 50;

                    return (
                      <g key={idx}>
                        <line
                          x1={x1}
                          y1={y1}
                          x2={x2}
                          y2={y2}
                          stroke="#94a3b8"
                          strokeWidth="2.5"
                          strokeDasharray={edge.connection_type === 'door' ? 'none' : '5,5'}
                        />
                        {/* Connection weight badge */}
                        <circle cx={(x1+x2)/2} cy={(y1+y2)/2} r="10" fill="#e2e8f0" />
                        <text
                          x={(x1+x2)/2}
                          y={(y1+y2)/2 + 3}
                          textAnchor="middle"
                          fontSize="9"
                          fontWeight="bold"
                          fill="#475569"
                        >
                          {edge.weight}
                        </text>
                      </g>
                    );
                  })}

                  {/* Draw Nodes */}
                  {activeTaskResult.nodes.map((node) => {
                    const cx = (node.centroid[0] / 500) * 500 + 50;
                    const cy = (node.centroid[1] / 600) * 500 + 50;
                    const isSelected = selectedNode?.id === node.id;

                    return (
                      <g
                        key={node.id}
                        style={{ cursor: 'pointer' }}
                        onClick={() => setSelectedNode(node)}
                      >
                        <circle
                          cx={cx}
                          cy={cy}
                          r={isSelected ? 18 : 14}
                          fill={getNodeColor(node.type)}
                          stroke="#ffffff"
                          strokeWidth="2.5"
                          style={{ transition: 'all 0.2s' }}
                        />
                        {/* Node Label Text */}
                        <text
                          x={cx}
                          y={cy - 22}
                          textAnchor="middle"
                          fontSize="10.5"
                          fontWeight="600"
                          fill="#1e293b"
                          style={{
                            background: 'white',
                            paintOrder: 'stroke',
                            stroke: '#ffffff',
                            strokeWidth: 4
                          }}
                        >
                          {node.name}
                        </text>
                      </g>
                    );
                  })}
                </svg>

                <Box sx={{ position: 'absolute', bottom: 12, left: 12, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Chip label="Oficina" size="small" sx={{ bgcolor: getNodeColor('office'), color: 'white', fontSize: 10 }} />
                  <Chip label="Pasillo" size="small" sx={{ bgcolor: getNodeColor('hallway'), color: 'white', fontSize: 10 }} />
                  <Chip label="Retail" size="small" sx={{ bgcolor: getNodeColor('retail'), color: 'white', fontSize: 10 }} />
                  <Chip label="Caja" size="small" sx={{ bgcolor: getNodeColor('checkout'), color: 'white', fontSize: 10 }} />
                </Box>
              </Paper>

              {/* Node Details Info Panel */}
              {selectedNode ? (
                <Paper sx={{ p: 2, borderLeft: '5px solid', borderColor: getNodeColor(selectedNode.type), borderRadius: 2 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                    Nódulo Seleccionado: {selectedNode.name}
                  </Typography>
                  <Divider sx={{ my: 1 }} />
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="body2" color="text.secondary">Tipo:</Typography>
                      <Typography variant="body1" sx={{ textTransform: 'capitalize', fontWeight: '500' }}>{selectedNode.type}</Typography>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="body2" color="text.secondary">Área Métrica:</Typography>
                      <Typography variant="body1" sx={{ fontWeight: '500' }}>{selectedNode.sqm} m² ({selectedNode.area} px)</Typography>
                    </Grid>
                  </Grid>
                </Paper>
              ) : (
                <Alert severity="info">
                  Haga clic en cualquier nódulo del grafo para ver sus especificaciones y dimensiones métricas.
                </Alert>
              )}
            </Box>
          ) : (
            <Paper sx={{ p: 5, textAlign: 'center', borderRadius: 3 }}>
              <Typography color="text.secondary">
                No hay resultados para mostrar. Cargue un plano de distribución arquitectónica a la izquierda o cargue una tarea histórica de la lista.
              </Typography>
            </Paper>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

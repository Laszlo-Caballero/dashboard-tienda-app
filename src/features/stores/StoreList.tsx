import React, { useState, useEffect } from 'react';
import { api } from '../../core/api';
import type { Store } from '../../core/api';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  Button,
  Paper,
  Divider,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Chip,
  Tooltip,
} from '@mui/material';
import {
  LocationOn,
  MyLocation,
  EditLocation,
  Add,
  Edit,
  Delete,
  Store as StoreIcon,
  Close,
} from '@mui/icons-material';

interface StoreFormData {
  nombre: string;
  latitud: string;
  longitud: string;
  ancho: string;
  alto: string;
}

const emptyForm: StoreFormData = { nombre: '', latitud: '', longitud: '', ancho: '', alto: '' };

export const StoreList: React.FC = () => {
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [sellerFilter, setSellerFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [updatingLocation, setUpdatingLocation] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Map simulation click coordinate hooks
  const [clickCoords, setClickCoords] = useState<{ lat: number; lng: number } | null>(null);

  // CRUD dialog states
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [formData, setFormData] = useState<StoreFormData>(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchStores = async (filter?: string) => {
    setLoading(true);
    try {
      const data = await api.stores.list(filter);
      setStores(data);
      if (data.length > 0 && !selectedStore) {
        setSelectedStore(data[0]);
      } else if (selectedStore) {
        const updated = data.find(s => s.tiendaId === selectedStore.tiendaId);
        if (updated) setSelectedStore(updated);
        else setSelectedStore(data.length > 0 ? data[0] : null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStores();
  }, []);

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchStores(sellerFilter);
  };

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!selectedStore) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const lat = -12.1 - (y / rect.height) * 0.1;
    const lng = -76.9 - (x / rect.width) * 0.2;
    setClickCoords({
      lat: parseFloat(lat.toFixed(6)),
      lng: parseFloat(lng.toFixed(6))
    });
  };

  const handleSaveLocation = async () => {
    if (!selectedStore || !clickCoords) return;
    setUpdatingLocation(true);
    setSuccessMsg('');
    try {
      const res = await api.stores.updateLocation(selectedStore.tiendaId, clickCoords.lat, clickCoords.lng);
      if (res.status === 'success') {
        setSuccessMsg('¡Ubicación GPS de la tienda actualizada con éxito!');
        setClickCoords(null);
        fetchStores(sellerFilter);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingLocation(false);
    }
  };

  // --- CRUD Handlers ---

  const openCreateDialog = () => {
    setFormData(emptyForm);
    setCreateOpen(true);
    setErrorMsg('');
  };

  const openEditDialog = (store: Store) => {
    setFormData({
      nombre: store.nombre,
      latitud: store.latitud?.toString() || '',
      longitud: store.longitud?.toString() || '',
      ancho: store.ancho?.toString() || '',
      alto: store.alto?.toString() || '',
    });
    setEditOpen(true);
    setErrorMsg('');
  };

  const openDeleteDialog = (store: Store) => {
    setSelectedStore(store);
    setDeleteOpen(true);
  };

  const handleCreate = async () => {
    if (!formData.nombre.trim()) {
      setErrorMsg('El nombre es obligatorio.');
      return;
    }
    setSaving(true);
    setErrorMsg('');
    try {
      await api.stores.create({
        nombre: formData.nombre.trim(),
        latitud: formData.latitud ? parseFloat(formData.latitud) : undefined,
        longitud: formData.longitud ? parseFloat(formData.longitud) : undefined,
        ancho: formData.ancho ? parseInt(formData.ancho) : undefined,
        alto: formData.alto ? parseInt(formData.alto) : undefined,
      });
      setCreateOpen(false);
      setSuccessMsg('¡Tienda creada exitosamente!');
      fetchStores(sellerFilter);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al crear tienda');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedStore) return;
    if (!formData.nombre.trim()) {
      setErrorMsg('El nombre es obligatorio.');
      return;
    }
    setSaving(true);
    setErrorMsg('');
    try {
      await api.stores.update(selectedStore.tiendaId, {
        nombre: formData.nombre.trim(),
        latitud: formData.latitud ? parseFloat(formData.latitud) : undefined,
        longitud: formData.longitud ? parseFloat(formData.longitud) : undefined,
        ancho: formData.ancho ? parseInt(formData.ancho) : undefined,
        alto: formData.alto ? parseInt(formData.alto) : undefined,
      });
      setEditOpen(false);
      setSuccessMsg('¡Tienda actualizada exitosamente!');
      fetchStores(sellerFilter);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al actualizar tienda');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedStore) return;
    setSaving(true);
    try {
      await api.stores.delete(selectedStore.tiendaId);
      setDeleteOpen(false);
      setSuccessMsg('Tienda eliminada exitosamente.');
      setSelectedStore(null);
      fetchStores(sellerFilter);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al eliminar tienda');
    } finally {
      setSaving(false);
    }
  };

  const handleFormChange = (field: keyof StoreFormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  // --- Form Fields Component ---
  const StoreFormFields = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
      {errorMsg && <Alert severity="error">{errorMsg}</Alert>}
      <TextField
        label="Nombre de la Tienda *"
        value={formData.nombre}
        onChange={handleFormChange('nombre')}
        fullWidth
        autoFocus
      />
      <Grid container spacing={2}>
        <Grid size={{ xs: 6 }}>
          <TextField
            label="Latitud"
            value={formData.latitud}
            onChange={handleFormChange('latitud')}
            fullWidth
            type="number"
            slotProps={{ htmlInput: { step: '0.000001' } }}
          />
        </Grid>
        <Grid size={{ xs: 6 }}>
          <TextField
            label="Longitud"
            value={formData.longitud}
            onChange={handleFormChange('longitud')}
            fullWidth
            type="number"
            slotProps={{ htmlInput: { step: '0.000001' } }}
          />
        </Grid>
      </Grid>
      <Grid container spacing={2}>
        <Grid size={{ xs: 6 }}>
          <TextField
            label="Ancho (px plano)"
            value={formData.ancho}
            onChange={handleFormChange('ancho')}
            fullWidth
            type="number"
          />
        </Grid>
        <Grid size={{ xs: 6 }}>
          <TextField
            label="Alto (px plano)"
            value={formData.alto}
            onChange={handleFormChange('alto')}
            fullWidth
            type="number"
          />
        </Grid>
      </Grid>
    </Box>
  );

  return (
    <Box>
      {/* Top Bar: Filter + Create */}
      <Paper sx={{ p: 2, mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
        <form onSubmit={handleFilterSubmit} style={{ display: 'flex', gap: 8, flexGrow: 1 }}>
          <TextField
            size="small"
            placeholder="Filtrar por marca (ej: Plaza Vea)..."
            value={sellerFilter}
            onChange={(e) => setSellerFilter(e.target.value)}
            fullWidth
          />
          <Button type="submit" variant="contained">Filtrar</Button>
        </form>
        <Button
          variant="contained"
          color="success"
          startIcon={<Add />}
          onClick={openCreateDialog}
          sx={{ whiteSpace: 'nowrap' }}
        >
          Nueva Tienda
        </Button>
      </Paper>

      {successMsg && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMsg('')}>
          {successMsg}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {/* Left panel: stores list */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
              <StoreIcon /> Locales y Tiendas
              <Chip label={stores.length} size="small" color="primary" sx={{ ml: 1 }} />
            </Typography>
            {stores.length === 0 && (
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography color="text.secondary">No hay tiendas registradas.</Typography>
              </Paper>
            )}
            {stores.map((s) => (
              <Card
                key={s.tiendaId}
                sx={{
                  mb: 2,
                  cursor: 'pointer',
                  borderRadius: 2,
                  border: selectedStore?.tiendaId === s.tiendaId ? '2px solid' : '1px solid',
                  borderColor: selectedStore?.tiendaId === s.tiendaId ? 'primary.main' : 'divider',
                  boxShadow: selectedStore?.tiendaId === s.tiendaId ? 2 : 0,
                  transition: 'all 0.2s ease',
                  '&:hover': { boxShadow: 3, borderColor: 'primary.light' },
                }}
                onClick={() => {
                  setSelectedStore(s);
                  setClickCoords(null);
                  setSuccessMsg('');
                }}
              >
                <CardContent sx={{ pb: '16px !important', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                      {s.nombre}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                      <LocationOn fontSize="small" /> Lat: {s.latitud ?? '—'}, Lng: {s.longitud ?? '—'}
                    </Typography>
                    {(s.ancho || s.alto) && (
                      <Typography variant="caption" color="text.secondary">
                        Plano: {s.ancho ?? '—'} × {s.alto ?? '—'} px
                      </Typography>
                    )}
                  </Box>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <Tooltip title="Editar tienda">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={(e) => { e.stopPropagation(); setSelectedStore(s); openEditDialog(s); }}
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Eliminar tienda">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={(e) => { e.stopPropagation(); openDeleteDialog(s); }}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Grid>

          {/* Right panel: map and coordinates updater */}
          <Grid size={{ xs: 12, md: 8 }}>
            {selectedStore && (
              <Box>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                  Ubicación GPS y Plano de {selectedStore.nombre}
                </Typography>

                {/* Map Simulator Panel */}
                <Paper
                  sx={{
                    position: 'relative',
                    height: 380,
                    mb: 3,
                    background: '#e0ecff',
                    backgroundImage: 'radial-gradient(#b0d0ff 1px, transparent 1px)',
                    backgroundSize: '20px 20px',
                    borderRadius: 3,
                    border: '1px solid',
                    borderColor: 'divider',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'crosshair',
                  }}
                  onClick={handleMapClick}
                >
                  <Typography variant="caption" sx={{ position: 'absolute', top: 12, left: 12, color: 'text.secondary', fontWeight: '500' }}>
                    🗺️ Simulador GPS Google Maps (Haz clic en el mapa para ubicar nuevo marcador)
                  </Typography>

                  {/* Marker representing current saved store GPS location */}
                  <Box
                    sx={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -100%)',
                      color: 'primary.main',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                    }}
                  >
                    <MyLocation sx={{ fontSize: 32 }} />
                    <Paper sx={{ px: 1, py: 0.2, fontSize: 10, fontWeight: 'bold' }}>
                      {selectedStore.nombre}
                    </Paper>
                  </Box>

                  {/* Click Coords Marker Pin */}
                  {clickCoords && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: '40%',
                        left: '65%',
                        transform: 'translate(-50%, -100%)',
                        color: 'error.main',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        animation: 'bounce 1s infinite alternate',
                        '@keyframes bounce': {
                          from: { transform: 'translate(-50%, -100%)' },
                          to: { transform: 'translate(-50%, -115%)' }
                        }
                      }}
                    >
                      <LocationOn sx={{ fontSize: 36 }} />
                      <Paper sx={{ px: 1, py: 0.2, fontSize: 10, bgcolor: 'error.main', color: 'white', fontWeight: 'bold' }}>
                        Nuevo GPS
                      </Paper>
                    </Box>
                  )}
                </Paper>

                {/* Details & Action Drawer */}
                <Paper sx={{ p: 3, borderRadius: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Coordenadas Actuales:
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: '500', mb: 2 }}>
                    Latitud: <code>{selectedStore.latitud ?? '—'}</code> | Longitud: <code>{selectedStore.longitud ?? '—'}</code>
                  </Typography>

                  {clickCoords && (
                    <Box sx={{ bgcolor: 'error.light', p: 2, borderRadius: 2, mb: 2, color: 'error.contrastText' }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                        📍 Coordenadas de Ubicación Seleccionada:
                      </Typography>
                      <Typography variant="body2">
                        Latitud: <code>{clickCoords.lat}</code> | Longitud: <code>{clickCoords.lng}</code>
                      </Typography>
                    </Box>
                  )}

                  <Divider sx={{ my: 2 }} />

                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                    {clickCoords && (
                      <Button variant="outlined" onClick={() => setClickCoords(null)}>
                        Cancelar
                      </Button>
                    )}
                    <Button
                      variant="contained"
                      color="secondary"
                      startIcon={<EditLocation />}
                      disabled={!clickCoords || updatingLocation}
                      onClick={handleSaveLocation}
                    >
                      {updatingLocation ? <CircularProgress size={24} /> : 'Guardar Nueva Ubicación GPS'}
                    </Button>
                  </Box>
                </Paper>
              </Box>
            )}
          </Grid>
        </Grid>
      )}

      {/* ====== CREATE DIALOG ====== */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Add color="success" /> Nueva Tienda
          </Box>
          <IconButton onClick={() => setCreateOpen(false)}><Close /></IconButton>
        </DialogTitle>
        <DialogContent>
          <StoreFormFields />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setCreateOpen(false)}>Cancelar</Button>
          <Button variant="contained" color="success" onClick={handleCreate} disabled={saving}>
            {saving ? <CircularProgress size={20} /> : 'Crear Tienda'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ====== EDIT DIALOG ====== */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Edit color="primary" /> Editar Tienda — {selectedStore?.nombre}
          </Box>
          <IconButton onClick={() => setEditOpen(false)}><Close /></IconButton>
        </DialogTitle>
        <DialogContent>
          <StoreFormFields />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setEditOpen(false)}>Cancelar</Button>
          <Button variant="contained" color="primary" onClick={handleUpdate} disabled={saving}>
            {saving ? <CircularProgress size={20} /> : 'Guardar Cambios'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ====== DELETE CONFIRM DIALOG ====== */}
      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ color: 'error.main', fontWeight: 'bold' }}>
          ⚠️ Confirmar Eliminación
        </DialogTitle>
        <DialogContent>
          <Typography>
            ¿Estás seguro de que deseas eliminar la tienda <strong>{selectedStore?.nombre}</strong>?
            Esta acción no se puede deshacer y también eliminará los productos asociados.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteOpen(false)}>Cancelar</Button>
          <Button variant="contained" color="error" onClick={handleDelete} disabled={saving}>
            {saving ? <CircularProgress size={20} /> : 'Eliminar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

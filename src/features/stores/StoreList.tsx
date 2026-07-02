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
} from '@mui/material';
import { LocationOn, MyLocation, EditLocation } from '@mui/icons-material';

export const StoreList: React.FC = () => {
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [sellerFilter, setSellerFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [updatingLocation, setUpdatingLocation] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Map simulation click coordinate hooks
  const [clickCoords, setClickCoords] = useState<{ lat: number; lng: number } | null>(null);

  const fetchStores = async (filter?: string) => {
    setLoading(true);
    try {
      const data = await api.stores.list(filter);
      setStores(data);
      if (data.length > 0 && !selectedStore) {
        setSelectedStore(data[0]);
      } else if (selectedStore) {
        // keep selected store updated
        const updated = data.find(s => s.tiendaId === selectedStore.tiendaId);
        if (updated) setSelectedStore(updated);
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

    // Convert map pixel click coordinates to mock GPS coords
    // Lima coordinates roughly: lat -12.1, lng -77.0
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

  return (
    <Box>
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
      </Paper>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {/* Left panel: stores list */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
              Locales y Tiendas
            </Typography>
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
                }}
                onClick={() => {
                  setSelectedStore(s);
                  setClickCoords(null);
                  setSuccessMsg('');
                }}
              >
                <CardContent sx={{ pb: '16px !important' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                    {s.nombre}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
                    <LocationOn fontSize="small" /> Lat: {s.latitud}, Lng: {s.longitud}
                  </Typography>
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

                {successMsg && (
                  <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMsg('')}>
                    {successMsg}
                  </Alert>
                )}

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
                    Latitud: <code>{selectedStore.latitud}</code> | Longitud: <code>{selectedStore.longitud}</code>
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
    </Box>
  );
};

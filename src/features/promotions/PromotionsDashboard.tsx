import React, { useState, useEffect } from 'react';
import { api } from '../../core/api';
import type { Promotion } from '../../core/api';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardActions,
  TextField,
  Typography,
  Grid,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Tooltip,
  Paper,
  CircularProgress,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Add,
  Delete,
  CloudUpload,
  ContentCopy,
} from '@mui/icons-material';

export const PromotionsDashboard: React.FC = () => {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(false);

  // Tabs state
  const [activeTab, setActiveTab] = useState<'standard' | 'surprise'>('standard');
  const [surprisePromotions, setSurprisePromotions] = useState<Promotion[]>([]);

  // Form states
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [discountCode, setDiscountCode] = useState('');
  const [qrType, setQrType] = useState<'text' | 'file'>('text');
  const [qrData, setQrData] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [surprises, setSurprises] = useState<{ title: string; description: string }[]>([]);

  const addSurpriseField = () => {
    setSurprises([...surprises, { title: '', description: '' }]);
  };

  const removeSurpriseField = (index: number) => {
    setSurprises(surprises.filter((_, idx) => idx !== index));
  };

  const handleSurpriseChange = (index: number, field: 'title' | 'description', value: string) => {
    const updated = [...surprises];
    updated[index][field] = value;
    setSurprises(updated);
  };

  // Redeem states
  const [redeemCode, setRedeemCode] = useState('');
  const [redeemedPromo, setRedeemedPromo] = useState<Promotion | null>(null);
  const [redeemModalOpen, setRedeemModalOpen] = useState(false);


  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!redeemCode) return;
    try {
      const res = await api.promotions.redeem(redeemCode);
      if (res.status === 'success') {
        setRedeemedPromo(res.data);
        setRedeemModalOpen(true);
        setRedeemCode('');
      } else {
        alert(res.message || 'Bono/Cupón inválido');
      }
    } catch (err: any) {
      console.error(err);
      alert('Error al validar cupón: ' + (err.message || 'desconocido'));
    }
  };

  const getImageUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    const base = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '');
    return `${base}${url}`;
  };

  const fetchPromotions = async () => {
    setLoading(true);
    try {
      const data = await api.promotions.list();
      setPromotions(data);
      const surprises = await api.promotions.listSurprises();
      setSurprisePromotions(surprises);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromotions();
  }, []);

  const handleOpen = () => {
    setTitle('');
    setDescription('');
    setDiscountCode('');
    setQrType('text');
    setQrData('');
    setFile(null);
    setSurprises([]);
    setOpen(true);
  };


  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    setLoading(true);
    try {
      if (activeTab === 'standard') {
        if (qrType === 'text') {
          await api.promotions.createWithQrData(title, description, discountCode, qrData, surprises);
        } else {
          await api.promotions.createWithUpload(title, description, discountCode, file || undefined);
        }
      } else {
        if (qrType === 'text') {
          await api.promotions.createSurpriseWithQrData(title, description, qrData);
        } else {
          await api.promotions.createSurpriseWithUpload(title, description, file || undefined);
        }
      }
      setOpen(false);
      fetchPromotions();
    } catch (err) {
      console.error(err);
      alert('Error al crear la promoción. Asegúrate de ser administrador.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Está seguro de que desea eliminar esta promoción?')) {
      setLoading(true);
      try {
        if (activeTab === 'standard') {
          await api.promotions.delete(id);
        } else {
          await api.promotions.deleteSurprise(id);
        }
        fetchPromotions();
      } catch (err) {
        console.error(err);
        alert('Error al eliminar. Asegúrate de ser administrador.');
      } finally {
        setLoading(false);
      }
    }
  };


  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    alert(`Código de descuento "${code}" copiado al portapapeles.`);
  };

  return (
    <Box>
      <Paper sx={{ p: 2, mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: 2 }}>
        <Box>
          <Typography variant="h5" component="h1" sx={{ fontWeight: 'bold' }}>
            Módulo de Promociones
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Administra promociones y publica códigos QR oficiales para los clientes.
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="primary"
          startIcon={<Add />}
          onClick={handleOpen}
          sx={{ borderRadius: 2 }}
        >
          Nueva Promoción
        </Button>
      </Paper>

      <Paper component="form" onSubmit={handleRedeem} sx={{ p: 2, mb: 3, display: 'flex', gap: 2, alignItems: 'center', borderRadius: 2, bgcolor: '#f0f4f9' }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: 'primary.main', minWidth: 'fit-content' }}>
          🎁 Canjear Cupón o Código Sorpresa:
        </Typography>
        <TextField
          size="small"
          placeholder="Ej. REGALO15"
          value={redeemCode}
          onChange={(e) => setRedeemCode(e.target.value)}
          sx={{ bgcolor: 'background.paper', borderRadius: 1, flexGrow: 1 }}
        />
        <Button type="submit" variant="contained" color="secondary" sx={{ borderRadius: 2 }}>
          Canjear
        </Button>
      </Paper>


      <Tabs
        value={activeTab}
        onChange={(_e, v) => setActiveTab(v as 'standard' | 'surprise')}
        sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab label="Promociones Oficiales" value="standard" />
        <Tab label="Sorpresas de Canje (Botes)" value="surprise" />
      </Tabs>

      {loading && (activeTab === 'standard' ? promotions.length === 0 : surprisePromotions.length === 0) ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}>
          <CircularProgress />
        </Box>
      ) : (activeTab === 'standard' ? promotions.length === 0 : surprisePromotions.length === 0) ? (
        <Typography align="center" color="text.secondary" sx={{ my: 5 }}>
          {activeTab === 'standard'
            ? 'No hay promociones activas. ¡Crea una nueva promoción para verla aquí!'
            : 'No hay sorpresas registradas. ¡Crea una sorpresa para el algoritmo de canje!'}
        </Typography>
      ) : (
        <Grid container spacing={3}>
          {(activeTab === 'standard' ? promotions : surprisePromotions).map((promo) => (
            <Grid key={promo.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderRadius: 3, boxShadow: 2 }}>
                <CardContent sx={{ textAlign: 'center', p: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                    {promo.title}
                  </Typography>

                  {promo.description && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {promo.description}
                    </Typography>
                  )}

                  {activeTab === 'standard' && (promo as any).surprises && (promo as any).surprises.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <Chip
                        label={`${(promo as any).surprises.length} Sorpresas`}
                        color="secondary"
                        size="small"
                        sx={{ fontWeight: 'bold' }}
                      />
                    </Box>
                  )}


                  <Box sx={{ display: 'flex', justifyContent: 'center', my: 2, p: 1, border: '1px solid #e0e0e0', borderRadius: 2, bgcolor: '#fafafa', width: 'fit-content', mx: 'auto' }}>
                    <img
                      src={getImageUrl(promo.qr_code_url)}
                      alt={`Código QR de ${promo.title}`}
                      style={{ width: 180, height: 180, objectFit: 'contain' }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://placehold.co/180x180/e0e0e0/505050?text=QR+Code';
                      }}
                    />
                  </Box>

                  {activeTab === 'standard' ? (
                    promo.discount_code ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mt: 1 }}>
                        <Chip
                          label={`CÓDIGO: ${promo.discount_code}`}
                          color="success"
                          variant="filled"
                          onClick={() => handleCopyCode(promo.discount_code || '')}
                          onDelete={() => handleCopyCode(promo.discount_code || '')}
                          deleteIcon={<ContentCopy />}
                          sx={{ fontWeight: 'bold' }}
                        />
                      </Box>
                    ) : (
                      <Chip label="Escanea el QR para la promo" size="small" variant="outlined" />
                    )
                  ) : (
                    <Chip label="Sorpresa Dinámica" color="secondary" size="small" variant="outlined" />
                  )}
                </CardContent>

                <CardActions sx={{ justifyContent: 'flex-end', borderTop: '1px solid #f0f0f0', px: 2, py: 1.5, bgcolor: '#fbfbfb' }}>
                  <Tooltip title={activeTab === 'standard' ? 'Eliminar Promoción' : 'Eliminar Sorpresa'}>
                    <IconButton color="error" size="small" onClick={() => handleDelete(promo.id)}>
                      <Delete />
                    </IconButton>
                  </Tooltip>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}


      {/* Create Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleCreate}>
          <DialogTitle sx={{ fontWeight: 'bold' }}>
            {activeTab === 'standard' ? 'Crear Nueva Promoción' : 'Crear Nueva Sorpresa'}
          </DialogTitle>
          <DialogContent dividers>
            <TextField
              label={activeTab === 'standard' ? 'Título de la Promoción *' : 'Título de la Sorpresa *'}
              fullWidth
              margin="dense"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            <TextField
              label="Descripción"
              fullWidth
              multiline
              rows={2}
              margin="dense"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            {activeTab === 'standard' && (
              <TextField
                label="Código de Descuento (Opcional)"
                fullWidth
                margin="dense"
                value={discountCode}
                onChange={(e) => setDiscountCode(e.target.value)}
                placeholder="Ej. VERANO20, 2X1CERVEZA"
              />
            )}

            {activeTab === 'standard' && (
              <Box sx={{ mt: 3, mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                    🎁 Recompensas Sorpresa Adicionales (Opcional)
                  </Typography>
                  <Button size="small" variant="outlined" onClick={addSurpriseField}>
                    + Agregar Sorpresa
                  </Button>
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                  Si agregas recompensas sorpresa, cuando el cliente escanee este QR se seleccionará dinámicamente una de estas sorpresas.
                </Typography>

                {surprises.map((surprise, index) => (
                  <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1.5, p: 1.5, border: '1px solid #e0e0e0', borderRadius: 2, bgcolor: '#fafafa', position: 'relative' }}>
                    <Box sx={{ flexGrow: 1 }}>
                      <TextField
                        label={`Título de Sorpresa #${index + 1} *`}
                        size="small"
                        fullWidth
                        value={surprise.title}
                        onChange={(e) => handleSurpriseChange(index, 'title', e.target.value)}
                        required
                        sx={{ mb: 1 }}
                      />
                      <TextField
                        label="Descripción / Regalo"
                        size="small"
                        fullWidth
                        value={surprise.description}
                        onChange={(e) => handleSurpriseChange(index, 'description', e.target.value)}
                      />
                    </Box>
                    <IconButton color="error" size="small" onClick={() => removeSurpriseField(index)} sx={{ alignSelf: 'center' }}>
                      <Delete />
                    </IconButton>
                  </Box>
                ))}
              </Box>
            )}


            <FormControl component="fieldset" sx={{ mt: 2, display: 'block' }}>

              <FormLabel component="legend">Origen del código QR</FormLabel>
              <RadioGroup
                row
                value={qrType}
                onChange={(e) => setQrType(e.target.value as 'text' | 'file')}
              >
                <FormControlLabel
                  value="text"
                  control={<Radio />}
                  label="Generar QR desde texto/URL"
                />
                <FormControlLabel
                  value="file"
                  control={<Radio />}
                  label="Subir imagen de QR propia"
                />
              </RadioGroup>
            </FormControl>

            {qrType === 'text' ? (
              <TextField
                label="Texto o URL para el QR *"
                fullWidth
                margin="dense"
                value={qrData}
                onChange={(e) => setQrData(e.target.value)}
                placeholder="Ej. https://mitienda.com/descuento"
                required={qrType === 'text'}
                helperText="El código QR se generará automáticamente a partir de este texto."
              />
            ) : (
              <Box sx={{ mt: 1 }}>
                <Button
                  component="label"
                  variant="outlined"
                  startIcon={<CloudUpload />}
                  sx={{ width: '100%', py: 1.5, borderStyle: 'dashed' }}
                >
                  {file ? `Archivo: ${file.name}` : 'Seleccionar Imagen del QR *'}
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        setFile(e.target.files[0]);
                      }
                    }}
                    required={qrType === 'file'}
                  />
                </Button>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, textAlign: 'center' }}>
                  Sube un archivo de imagen (PNG, JPG, JPEG) que contenga tu código QR o flyer promocional.
                </Typography>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpen(false)} color="secondary">Cancelar</Button>
            <Button type="submit" variant="contained" color="primary">Crear Promoción</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Redeem Result Dialog */}
      <Dialog open={redeemModalOpen} onClose={() => setRedeemModalOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold', textAlign: 'center', pb: 1 }}>
          🎉 ¡Bono Canjeado!
        </DialogTitle>
        <DialogContent sx={{ textAlign: 'center', py: 2 }}>
          {redeemedPromo && (
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'success.main', mb: 1 }}>
                {redeemedPromo.title}
              </Typography>
              {redeemedPromo.description && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  {redeemedPromo.description}
                </Typography>
              )}
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 1, border: '1px solid #e0e0e0', borderRadius: 2, bgcolor: '#fafafa', width: 'fit-content', mx: 'auto', mb: 3 }}>
                <img
                  src={getImageUrl(redeemedPromo.qr_code_url)}
                  alt="Código QR del bono"
                  style={{ width: 200, height: 200, objectFit: 'contain' }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://placehold.co/200x200/e0e0e0/505050?text=QR+Code';
                  }}
                />
              </Box>
              {redeemedPromo.discount_code && (
                <Chip
                  label={`CÓDIGO: ${redeemedPromo.discount_code}`}
                  color="success"
                  sx={{ fontWeight: 'bold', fontSize: 14, py: 2, px: 1 }}
                />
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
          <Button onClick={() => setRedeemModalOpen(false)} variant="contained" color="primary">
            Cerrar y Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>

  );
};

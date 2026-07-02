import React, { useState, useEffect } from 'react';
import { api } from '../../core/api';
import type { FCMToken } from '../../core/api';
import {
  Box,
  Button,
  Typography,
  Grid,
  TextField,
  Paper,
  MenuItem,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
} from '@mui/material';
import { Send, PhoneAndroid, Devices, AddCircle } from '@mui/icons-material';

export const NotificationsDashboard: React.FC = () => {
  const [tokens, setTokens] = useState<FCMToken[]>([]);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Register Token Form
  const [newToken, setNewToken] = useState('');
  const [newPlatform, setNewPlatform] = useState('android');
  const [registering, setRegistering] = useState(false);

  // Send Notification Form
  const [pushTitle, setPushTitle] = useState('');
  const [pushBody, setPushBody] = useState('');
  const [selectedTargetToken, setSelectedTargetToken] = useState('all'); // 'all' or specific token
  const [sendingPush, setSendingPush] = useState(false);

  const fetchTokens = async () => {
    setLoading(true);
    try {
      const res = await api.notifications.listTokens();
      if (res.status === 'success') {
        setTokens(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTokens();
  }, []);

  const handleRegisterToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newToken) return;

    setRegistering(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await api.notifications.registerToken(newToken, newPlatform);
      if (res.status === 'success') {
        setSuccessMsg('¡Dispositivo registrado exitosamente para notificaciones push!');
        setNewToken('');
        fetchTokens();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al registrar token de dispositivo.');
    } finally {
      setRegistering(false);
    }
  };

  const handleSendPush = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pushTitle || !pushBody) {
      setErrorMsg('Por favor complete el título y el cuerpo de la notificación.');
      return;
    }

    setSendingPush(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const target = selectedTargetToken === 'all' ? null : selectedTargetToken;
      const res = await api.notifications.send(pushTitle, pushBody, target);
      if (res.status === 'success') {
        setSuccessMsg(res.message);
        setPushTitle('');
        setPushBody('');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al simular envío push.');
    } finally {
      setSendingPush(false);
    }
  };

  return (
    <Box>
      {successMsg && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccessMsg('')}>
          {successMsg}
        </Alert>
      )}
      {errorMsg && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setErrorMsg('')}>
          {errorMsg}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Left Side: Register Token & Token List */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
            Registrar Token FCM del Dispositivo
          </Typography>

          <Paper component="form" onSubmit={handleRegisterToken} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
            <TextField
              label="Token FCM de Firebase"
              fullWidth
              size="small"
              placeholder="Ej. fcm_token_device_unique_string..."
              value={newToken}
              onChange={(e) => setNewToken(e.target.value)}
              sx={{ mb: 2 }}
            />
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid size={{ xs: 8 }}>
                <TextField
                  select
                  label="Plataforma de Dispositivo"
                  fullWidth
                  size="small"
                  value={newPlatform}
                  onChange={(e) => setNewPlatform(e.target.value)}
                >
                  <MenuItem value="android">Android</MenuItem>
                  <MenuItem value="ios">iOS / Apple</MenuItem>
                  <MenuItem value="web">Web Browser</MenuItem>
                </TextField>
              </Grid>
              <Grid size={{ xs: 4 }} sx={{ display: 'flex', alignItems: 'center' }}>
                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  startIcon={<AddCircle />}
                  disabled={registering || !newToken}
                >
                  Registrar
                </Button>
              </Grid>
            </Grid>
          </Paper>

          <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
            <Devices /> Dispositivos Registrados ({tokens.length})
          </Typography>

          <TableContainer component={Paper} sx={{ borderRadius: 2, maxHeight: 350 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell>Usuario ID</TableCell>
                  <TableCell>Plataforma</TableCell>
                  <TableCell>Token ID</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={3} align="center">
                      <CircularProgress size={24} />
                    </TableCell>
                  </TableRow>
                ) : tokens.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} align="center">No hay dispositivos registrados</TableCell>
                  </TableRow>
                ) : (
                  tokens.map((t) => (
                    <TableRow key={t.token_id} hover>
                      <TableCell>{t.usuarioid}</TableCell>
                      <TableCell sx={{ textTransform: 'capitalize' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <PhoneAndroid fontSize="inherit" /> {t.platform}
                        </Box>
                      </TableCell>
                      <TableCell sx={{ fontSize: 11 }}>
                        <code>{t.token.substring(0, 15)}...</code>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>

        {/* Right Side: Push simulation panel */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
            Simulador de Envío de Notificaciones Push
          </Typography>

          <Paper component="form" onSubmit={handleSendPush} sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Redacte el contenido del mensaje. Si no selecciona un token específico, el mensaje se enviará como un **broadcast masivo** a todos los dispositivos registrados en FCM.
            </Typography>

            <TextField
              label="Título de la Notificación"
              fullWidth
              placeholder="¡Gran Descuento de Fin de Semana!"
              value={pushTitle}
              onChange={(e) => setPushTitle(e.target.value)}
              sx={{ mb: 2 }}
            />

            <TextField
              label="Cuerpo de la Notificación"
              fullWidth
              multiline
              rows={3}
              placeholder="Aprovecha 20% de descuento en la categoría de Lácteos en todas las tiendas."
              value={pushBody}
              onChange={(e) => setPushBody(e.target.value)}
              sx={{ mb: 2 }}
            />

            <TextField
              select
              label="Enviar a"
              fullWidth
              value={selectedTargetToken}
              onChange={(e) => setSelectedTargetToken(e.target.value)}
              sx={{ mb: 3 }}
            >
              <MenuItem value="all">📢 Todos los dispositivos (Broadcast)</MenuItem>
              {tokens.map((t) => (
                <MenuItem key={t.token_id} value={t.token}>
                  📱 Disp. {t.token_id} ({t.platform}) - {t.token.substring(0, 20)}...
                </MenuItem>
              ))}
            </TextField>

            <Button
              type="submit"
              variant="contained"
              color="secondary"
              fullWidth
              size="large"
              startIcon={<Send />}
              disabled={sendingPush || !pushTitle || !pushBody}
            >
              {sendingPush ? <CircularProgress size={24} color="inherit" /> : 'Enviar/Simular Notificación Push'}
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

import React, { useState, useEffect } from 'react';
import { api } from '../../core/api';
import type { Product } from '../../core/api';
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
  InputAdornment,
  CircularProgress,
  Pagination,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Search,
  Mic,
  PhotoCamera,
  Link as LinkIcon,
} from '@mui/icons-material';

export const ProductList: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  // Pagination states
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 12;

  // Modals state
  const [formOpen, setFormOpen] = useState(false);
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [imageOpen, setImageOpen] = useState(false);
  
  // Active product for editing
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form inputs
  const [nombre, setNombre] = useState('');
  const [precio, setPrecio] = useState('');
  const [vendidoPor, setVendidoPor] = useState('');
  const [marca, setMarca] = useState('');
  const [urlVenta, setUrlVenta] = useState('');
  const [categoria, setCategoria] = useState('');
  const [subCategoria, setSubCategoria] = useState('');
  const [caracteristicasStr, setCaracteristicasStr] = useState('');
  const [especificacionesStr, setEspecificacionesStr] = useState('');

  // Voice Search states
  const [voiceQueryText, setVoiceQueryText] = useState('');
  const [voiceSearching, setVoiceSearching] = useState(false);

  // Image recognition states
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageMatches, setImageMatches] = useState<{ productoid: number; nombre: string; score: number }[]>([]);
  const [imageSearching, setImageSearching] = useState(false);

  const fetchProducts = async (q?: string, targetPage: number = 1) => {
    setLoading(true);
    try {
      const data = await api.products.list(q, targetPage, limit);
      setProducts(data.products || []);
      setPage(data.page || 1);
      setTotalPages(data.total_pages || 1);
    } catch (err) {
      console.error(err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts(searchQuery, page);
  }, [page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchProducts(searchQuery, 1);
  };


  const handleOpenCreateForm = () => {
    setEditingProduct(null);
    setNombre('');
    setPrecio('');
    setVendidoPor('');
    setMarca('');
    setUrlVenta('');
    setCategoria('');
    setSubCategoria('');
    setCaracteristicasStr('');
    setEspecificacionesStr('');
    setFormOpen(true);
  };

  const handleOpenEditForm = (p: Product) => {
    setEditingProduct(p);
    setNombre(p.nombre);
    setPrecio(p.precio.toString());
    setVendidoPor(p.vendido_por);
    setMarca(p.marca || '');
    setUrlVenta(p.url_venta || '');
    setCategoria(p.categoria || '');
    setSubCategoria(p.sub_categoria || '');
    setCaracteristicasStr((p.caracteristicas || []).join(', '));
    setEspecificacionesStr((p.especificaciones || []).join(', '));
    setFormOpen(true);
  };

  const handleFormSubmit = async () => {
    if (!nombre || !precio || !vendidoPor) {
      alert('Por favor, complete los campos obligatorios: Nombre, Precio y Vendido por.');
      return;
    }

    const payload = {
      nombre,
      precio: parseFloat(precio),
      precios: [parseFloat(precio)],
      vendido_por: vendidoPor,
      marca,
      url_venta: urlVenta,
      categoria,
      sub_categoria: subCategoria,
      caracteristicas: caracteristicasStr.split(',').map(s => s.trim()).filter(Boolean),
      especificaciones: especificacionesStr.split(',').map(s => s.trim()).filter(Boolean),
    };

    setLoading(true);
    try {
      if (editingProduct) {
        await api.products.update(editingProduct.productoid, payload);
      } else {
        await api.products.create(payload);
      }
      setFormOpen(false);
      fetchProducts();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Está seguro de que desea eliminar este producto?')) {
      setLoading(true);
      try {
        await api.products.delete(id);
        fetchProducts();
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Voice Search Action
  const handleVoiceSearch = async () => {
    if (!voiceQueryText) return;
    setVoiceSearching(true);
    try {
      const results = await api.products.voiceSearch(voiceQueryText);
      setProducts(results);
      setVoiceOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setVoiceSearching(false);
    }
  };

  // Image Recognition Action
  const handleImageIdentify = async () => {
    if (!imageFile) return;
    setImageSearching(true);
    try {
      const res = await api.products.identifyImage(imageFile);
      setImageMatches(res.matches);
    } catch (err) {
      console.error(err);
    } finally {
      setImageSearching(false);
    }
  };

  return (
    <Box>
      {/* Header Controls */}
      <Paper sx={{ p: 2, mb: 3, display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', justifyContent: 'space-between' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: 8, flexGrow: 1, maxWidth: 500 }}>
          <TextField
            size="small"
            placeholder="Buscar productos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            fullWidth
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }
            }}
          />
          <Button type="submit" variant="contained">Buscar</Button>
        </form>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Búsqueda por Voz">
            <IconButton color="primary" onClick={() => { setVoiceQueryText(''); setVoiceOpen(true); }}>
              <Mic />
            </IconButton>
          </Tooltip>
          <Tooltip title="Identificar por Imagen (CLIP)">
            <IconButton color="secondary" onClick={() => { setImageFile(null); setImageMatches([]); setImageOpen(true); }}>
              <PhotoCamera />
            </IconButton>
          </Tooltip>
          <Button variant="contained" color="success" startIcon={<Add />} onClick={handleOpenCreateForm}>
            Nuevo Producto
          </Button>
        </Box>
      </Paper>

      {/* Products Grid */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}>
          <CircularProgress />
        </Box>
      ) : products.length === 0 ? (
        <Typography align="center" color="text.secondary" sx={{ my: 5 }}>
          No se encontraron productos. Intente buscar con otra palabra o añada uno nuevo.
        </Typography>
      ) : (
        <>
          <Grid container spacing={3}>

          {products.map((product) => (
            <Grid key={product.productoid} size={{ xs: 12, sm: 6, md: 4 }}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderRadius: 2 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Typography variant="h6" component="h2" sx={{ fontWeight: 'bold' }}>
                      {product.nombre}
                    </Typography>
                    <Chip label={`S/ ${product.precio.toFixed(2)}`} color="primary" variant="outlined" size="small" />
                  </Box>

                  {product.categoria && (
                    <Chip label={product.categoria} size="small" sx={{ mb: 2, mr: 0.5 }} />
                  )}
                  {product.sub_categoria && (
                    <Chip label={product.sub_categoria} size="small" variant="outlined" sx={{ mb: 2 }} />
                  )}

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {product.descripcion || 'Sin descripción detallada.'}
                  </Typography>

                  <Typography variant="caption" sx={{ display: 'block' }} color="text.primary">
                    <strong>Vendido por:</strong> {product.vendido_por}
                  </Typography>
                  {product.marca && (
                    <Typography variant="caption" sx={{ display: 'block' }} color="text.primary">
                      <strong>Marca:</strong> {product.marca}
                    </Typography>
                  )}

                  {product.caracteristicas && product.caracteristicas.length > 0 && (
                    <Box sx={{ mt: 1.5 }}>
                      {product.caracteristicas.map((char, idx) => (
                        <Chip key={idx} label={char} size="small" variant="outlined" sx={{ mr: 0.5, mb: 0.5, fontSize: 10 }} />
                      ))}
                    </Box>
                  )}
                </CardContent>

                <CardActions sx={{ justifyContent: 'space-between', bgcolor: 'grey.50', px: 2 }}>
                  {product.url_venta ? (
                    <IconButton size="small" color="primary" href={product.url_venta} target="_blank">
                      <LinkIcon fontSize="small" />
                    </IconButton>
                  ) : (
                    <Box />
                  )}
                  <Box>
                    <IconButton size="small" color="info" onClick={() => handleOpenEditForm(product)}>
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDelete(product.productoid)}>
                      <Delete fontSize="small" />
                    </IconButton>
                  </Box>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
        {totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={(_, value) => setPage(value)}
              color="primary"
            />
          </Box>
        )}
      </>
      )}


      {/* CRUD Product Modal */}
      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>
          {editingProduct ? 'Editar Producto' : 'Crear Nuevo Producto'}
        </DialogTitle>
        <DialogContent dividers>
          <TextField
            label="Nombre del Producto *"
            fullWidth
            margin="dense"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />
          <TextField
            label="Precio *"
            type="number"
            fullWidth
            margin="dense"
            value={precio}
            onChange={(e) => setPrecio(e.target.value)}
          />
          <TextField
            label="Vendido por *"
            fullWidth
            margin="dense"
            value={vendidoPor}
            placeholder="Ej. Plaza Vea Sagitario"
            onChange={(e) => setVendidoPor(e.target.value)}
          />
          <Grid container spacing={2}>
            <Grid size={{ xs: 6 }}>
              <TextField
                label="Marca"
                fullWidth
                margin="dense"
                value={marca}
                onChange={(e) => setMarca(e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField
                label="URL de Venta"
                fullWidth
                margin="dense"
                value={urlVenta}
                onChange={(e) => setUrlVenta(e.target.value)}
              />
            </Grid>
          </Grid>
          <Grid container spacing={2}>
            <Grid size={{ xs: 6 }}>
              <TextField
                label="Categoría"
                fullWidth
                margin="dense"
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField
                label="Sub Categoría"
                fullWidth
                margin="dense"
                value={subCategoria}
                onChange={(e) => setSubCategoria(e.target.value)}
              />
            </Grid>
          </Grid>
          <TextField
            label="Características (separadas por comas)"
            fullWidth
            margin="dense"
            value={caracteristicasStr}
            placeholder="Ej. Bajo en grasa, Con pulpa de fruta"
            onChange={(e) => setCaracteristicasStr(e.target.value)}
          />
          <TextField
            label="Especificaciones (separadas por comas)"
            fullWidth
            margin="dense"
            value={especificacionesStr}
            placeholder="Ej. Contenido: 1kg, Sabor: Fresa"
            onChange={(e) => setEspecificacionesStr(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFormOpen(false)}>Cancelar</Button>
          <Button onClick={handleFormSubmit} variant="contained">Guardar</Button>
        </DialogActions>
      </Dialog>

      {/* Voice Search Dialog */}
      <Dialog open={voiceOpen} onClose={() => setVoiceOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Mic color="primary" /> Búsqueda por Voz
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Escriba o simule su comando hablado (ej. "buscar leche gloria de un litro"):
          </Typography>
          <TextField
            autoFocus
            fullWidth
            placeholder="Ingrese frase de voz..."
            value={voiceQueryText}
            onChange={(e) => setVoiceQueryText(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVoiceOpen(false)}>Cancelar</Button>
          <Button onClick={handleVoiceSearch} variant="contained" disabled={voiceSearching}>
            {voiceSearching ? <CircularProgress size={24} /> : 'Simular Búsqueda'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Image Identification Dialog */}
      <Dialog open={imageOpen} onClose={() => setImageOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PhotoCamera color="secondary" /> Identificar Producto por Foto (CLIP)
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Seleccione una imagen de producto para ejecutar la clasificación semántica vectorial:
          </Typography>
          <Button variant="outlined" component="label" fullWidth sx={{ py: 3, borderStyle: 'dashed', mb: 2 }}>
            {imageFile ? `Archivo: ${imageFile.name}` : 'Seleccionar Imagen (Plano o Foto)'}
            <input type="file" hidden accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
          </Button>

          {imageFile && (
            <Button onClick={handleImageIdentify} variant="contained" fullWidth disabled={imageSearching}>
              {imageSearching ? <CircularProgress size={24} color="inherit" /> : 'Analizar Imagen con CLIP'}
            </Button>
          )}

          {imageMatches.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                Coincidencias Encontradas:
              </Typography>
              {imageMatches.map((m) => (
                <Paper key={m.productoid} variant="outlined" sx={{ p: 1.5, mb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2">{m.nombre}</Typography>
                  <Chip label={`Score: ${m.score}`} color="secondary" size="small" />
                </Paper>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImageOpen(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

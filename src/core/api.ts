// Clean Architecture - API Client layer
// Communicates directly with the backend endpoints.

const BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '');

// Types definition matching the API documentation
export interface User {
  id: number;
  username: string;
  email: string;
}

export interface Product {
  productoid: number;
  nombre: string;
  descripcion?: string;
  precio: number;
  precios?: number[]; // from POST/PUT schema
  vendido_por: string;
  marca?: string;
  url_venta?: string;
  caracteristicas?: string[];
  categoria?: string;
  sub_categoria?: string;
  especificaciones?: string[];
}

export interface PaginatedProducts {
  products: Product[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface Promotion {
  id: number;
  title: string;
  description?: string;
  discount_code?: string;
  qr_code_url: string;
  created_at: string;
}

export interface Store {
  tiendaId: number;
  nombre: string;
  latitud: number;
  longitud: number;
  ancho: number;
  alto: number;
  grafo?: {
    nodes: any[];
    edges: any[];
  };
}

export interface FloorplanNode {
  id: number;
  name: string;
  type: string;
  area: number;
  centroid: [number, number];
  sqm: number;
}

export interface FloorplanEdge {
  source: number;
  target: number;
  weight: number;
  connection_type: string;
}

export interface FloorplanTaskResult {
  nodes: FloorplanNode[];
  edges: FloorplanEdge[];
  summary: {
    plan_type: string;
    total_nodes: number;
    total_edges: number;
    rooms: number;
    corridors: number;
    open_spaces: number;
  };
  visualization_url: string;
  debug_url: string;
  width: number;
  height: number;
}

export interface FloorplanTask {
  task_id: string;
  task_name: string;
  status: 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILURE';
  args: any;
  result: { status: string; message?: string; data: FloorplanTaskResult | null } | null;
  traceback: string | null;
  timestamp: string;
}

export interface SearchHistoryEntry {
  historialid: number;
  tipo_busqueda: 'voice' | 'image' | 'text';
  consulta: string;
  fecha: string;
}

export interface FCMToken {
  token_id: number;
  usuarioid: number;
  token: string;
  platform: string;
}

const KEYS = {
  USER: 'db_current_user',
  TOKEN: 'db_jwt_token',
};

// Helper for HTTP requests
const getHeaders = (withAuth = true) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (withAuth) {
    const token = localStorage.getItem(KEYS.TOKEN);
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  return headers;
};

export const api = {
  isMock: false,

  // 1. Auth Module
  auth: {
    register: async (username: string, email: string, password: string) => {
      const res = await fetch(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: getHeaders(false),
        body: JSON.stringify({ username, email, password }),
      });
      if (!res.ok) throw new Error('Error al registrar usuario');
      return res.json();
    },    login: async (username: string, password: string) => {
      const res = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: getHeaders(false),
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) throw new Error('Credenciales incorrectas');
      const resData = await res.json();
      
      const token = resData.data?.accessToken;
      const user = resData.data?.user;
      
      if (token && user) {
        const mappedUser: User = {
          id: user.userId,
          username: user.username,
          email: user.email
        };
        localStorage.setItem(KEYS.TOKEN, token);
        localStorage.setItem(KEYS.USER, JSON.stringify(mappedUser));
        return { status: 'success', token, user: mappedUser };
      }
      return resData;
    },
    logout: () => {
      localStorage.removeItem(KEYS.TOKEN);
      localStorage.removeItem(KEYS.USER);
    },

    getCurrentUser: (): User | null => {
      const u = localStorage.getItem(KEYS.USER);
      return u ? JSON.parse(u) : null;
    },

    getToken: (): string | null => {
      return localStorage.getItem(KEYS.TOKEN);
    }
  },

  // 2. Products Module
  products: {
    list: async (query?: string, page?: number, limit?: number): Promise<PaginatedProducts> => {
      const url = new URL(`${BASE_URL}/api/products/`);
      if (query) url.searchParams.append('query', query);
      if (page) url.searchParams.append('page', page.toString());
      if (limit) url.searchParams.append('limit', limit.toString());
      const res = await fetch(url.toString(), {
        headers: getHeaders(true)
      });
      if (!res.ok) throw new Error('Error al listar productos');
      const resData = await res.json();
      
      const rawProducts = resData.data?.products || [];
      const mapped = rawProducts.map((p: any) => ({
        ...p,
        productoid: p.productoId,
        precio: p.precios && p.precios.length > 0 ? p.precios[0] : (p.precio || 0)
      }));

      return {
        products: mapped,
        total: resData.data?.total || 0,
        page: resData.data?.page || 1,
        limit: resData.data?.limit || 10,
        total_pages: resData.data?.total_pages || 1,
      };
    },

    identifyImage: async (file: File): Promise<{ status: string; matches: { productoid: number; nombre: string; score: number }[] }> => {
      const token = localStorage.getItem(KEYS.TOKEN);
      const formData = new FormData();
      formData.append('file', file);
      
      const res = await fetch(`${BASE_URL}/api/products/identify`, {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: formData
      });
      if (!res.ok) throw new Error('Error al identificar producto');
      const resData = await res.json();
      return {
        status: resData.status,
        matches: (resData.data || []).map((p: any) => ({
          productoid: p.productoId || p.productoid,
          nombre: p.nombre,
          score: p.similitud
        }))
      };
    },

    voiceSearch: async (voiceQuery: string): Promise<Product[]> => {
      const res = await fetch(`${BASE_URL}/api/products/voice`, {
        method: 'POST',
        headers: getHeaders(true),
        body: JSON.stringify({ query: voiceQuery })
      });
      if (!res.ok) throw new Error('Error al buscar por voz');
      const resData = await res.json();
      const rawProducts = resData.data || [];
      return rawProducts.map((p: any) => ({
        ...p,
        productoid: p.productoId,
        precio: p.precios && p.precios.length > 0 ? p.precios[0] : (p.precio || 0)
      }));
    },


    create: async (productData: Omit<Product, 'productoid'>): Promise<{ status: string; message: string; data: Product }> => {
      const res = await fetch(`${BASE_URL}/api/products/`, {
        method: 'POST',
        headers: getHeaders(true),
        body: JSON.stringify(productData)
      });
      if (!res.ok) throw new Error('Error al crear producto');
      return res.json();
    },

    update: async (productId: number, productData: Partial<Product>): Promise<{ status: string; message: string; data: Product }> => {
      const res = await fetch(`${BASE_URL}/api/products/${productId}`, {
        method: 'PUT',
        headers: getHeaders(true),
        body: JSON.stringify(productData)
      });
      if (!res.ok) throw new Error('Error al actualizar producto');
      return res.json();
    },

    delete: async (productId: number): Promise<{ status: string; message: string }> => {
      const res = await fetch(`${BASE_URL}/api/products/${productId}`, {
        method: 'DELETE',
        headers: getHeaders(true)
      });
      if (!res.ok) throw new Error('Error al eliminar producto');
      return res.json();
    }
  },

  // 3. Stores Module
  stores: {
    list: async (sellerName?: string): Promise<Store[]> => {
      const url = new URL(`${BASE_URL}/api/stores/`);
      if (sellerName) url.searchParams.append('seller_name', sellerName);
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error('Error al obtener tiendas');
      const resData = await res.json();
      return resData.data || [];
    },

    updateLocation: async (storeId: number, latitud: number, longitud: number): Promise<{ status: string; message: string; data: Store }> => {
      const res = await fetch(`${BASE_URL}/api/stores/${storeId}/location`, {
        method: 'PATCH',
        headers: getHeaders(false),
        body: JSON.stringify({ latitud, longitud })
      });
      if (!res.ok) throw new Error('Error al actualizar ubicación de la tienda');
      return res.json();
    }
  },

  // 4. Floorplan Module
  floorplan: {
    analyze: async (file: File): Promise<{ status: string; message: string; task_id: string }> => {
      const formData = new FormData();
      formData.append('file', file);
      
      const res = await fetch(`${BASE_URL}/api/v2/floorplan/analyze`, {
        method: 'POST',
        body: formData
      });
      if (!res.ok) throw new Error('Error al enviar el plano');
      return res.json();
    },

    getResult: async (taskId: string): Promise<{ status: string; message: string; data?: FloorplanTaskResult }> => {
      const res = await fetch(`${BASE_URL}/api/v2/floorplan/result/${taskId}`);
      if (!res.ok) throw new Error('Error al obtener resultado del plano');
      const resData = await res.json();

      if (resData.status && resData.result !== undefined) {
        const celeryStatus = resData.status;
        const innerResult = resData.result;
        
        if (celeryStatus === 'SUCCESS') {
          if (innerResult && innerResult.status === 'success') {
            return {
              status: 'success',
              message: innerResult.message || 'Completado',
              data: innerResult.data
            };
          } else {
            return {
              status: 'failed',
              message: innerResult?.message || 'Error en procesamiento interno',
            };
          }
        } else if (celeryStatus === 'FAILURE') {
          return {
            status: 'failed',
            message: resData.traceback || 'Fallo en la tarea de Celery',
          };
        } else {
          return {
            status: 'processing',
            message: 'Procesando plano...',
          };
        }
      }
      return resData;
    },

    allTasks: async (): Promise<{ tasks: FloorplanTask[]; total: number }> => {
      const res = await fetch(`${BASE_URL}/api/v2/floorplan/all_tasks`);
      if (!res.ok) throw new Error('Error al obtener la lista de tareas');
      return res.json();
    }
  },

  // 5. History Module
  history: {
    list: async (): Promise<SearchHistoryEntry[]> => {
      const res = await fetch(`${BASE_URL}/api/history`, {
        headers: getHeaders(true)
      });
      if (!res.ok) throw new Error('Error al recuperar historial');
      return res.json();
    },

    clear: async (): Promise<{ status: string; message: string }> => {
      const res = await fetch(`${BASE_URL}/api/history`, {
        method: 'DELETE',
        headers: getHeaders(true)
      });
      if (!res.ok) throw new Error('Error al borrar historial');
      return res.json();
    }
  },

  // 6. Notifications Module
  notifications: {
    registerToken: async (token: string, platform: string): Promise<{ status: string; message: string }> => {
      const res = await fetch(`${BASE_URL}/api/notifications/register-token`, {
        method: 'POST',
        headers: getHeaders(true),
        body: JSON.stringify({ token, platform })
      });
      if (!res.ok) throw new Error('Error al registrar token de notificaciones');
      return res.json();
    },

    listTokens: async (): Promise<{ status: string; message: string; data: FCMToken[] }> => {
      const res = await fetch(`${BASE_URL}/api/notifications/tokens`, {
        headers: getHeaders(true)
      });
      if (!res.ok) throw new Error('Error al listar tokens de notificaciones');
      return res.json();
    },

    send: async (title: string, body: string, token: string | null = null): Promise<{ status: string; message: string; data: any }> => {
      const res = await fetch(`${BASE_URL}/api/notifications/send`, {
        method: 'POST',
        headers: getHeaders(true),
        body: JSON.stringify({ title, body, token })
      });
      if (!res.ok) throw new Error('Error al simular envío de notificación push');
      return res.json();
    }
  },

  // 7. Promotions Module
  promotions: {
    list: async (): Promise<Promotion[]> => {
      const res = await fetch(`${BASE_URL}/api/promotions/`, {
        headers: getHeaders(true)
      });
      if (!res.ok) throw new Error('Error al listar promociones');
      const resData = await res.json();
      return resData.data || [];
    },

    createWithQrData: async (title: string, description?: string, discountCode?: string, qrData?: string, surprises?: { title: string; description: string }[]): Promise<{ status: string; message: string; data: Promotion }> => {
      const res = await fetch(`${BASE_URL}/api/promotions/`, {
        method: 'POST',
        headers: getHeaders(true),
        body: JSON.stringify({ title, description, discount_code: discountCode, qr_data: qrData, surprises })
      });
      if (!res.ok) throw new Error('Error al crear promoción');
      return res.json();
    },

    createWithUpload: async (title: string, description?: string, discountCode?: string, file?: File): Promise<{ status: string; message: string; data: Promotion }> => {
      const token = localStorage.getItem(KEYS.TOKEN);
      const formData = new FormData();
      formData.append('title', title);
      if (description) formData.append('description', description);
      if (discountCode) formData.append('discount_code', discountCode);
      if (file) formData.append('file', file);

      const res = await fetch(`${BASE_URL}/api/promotions/upload`, {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: formData
      });
      if (!res.ok) throw new Error('Error al subir promoción');
      return res.json();
    },

    delete: async (id: number): Promise<{ status: string; message: string }> => {
      const res = await fetch(`${BASE_URL}/api/promotions/${id}`, {
        method: 'DELETE',
        headers: getHeaders(true)
      });
      if (!res.ok) throw new Error('Error al eliminar promoción');
      return res.json();
    },

    redeem: async (code: string): Promise<{ status: string; message: string; data: Promotion }> => {
      const res = await fetch(`${BASE_URL}/api/promotions/redeem/${code}`, {
        headers: getHeaders(true)
      });
      if (!res.ok) throw new Error('Error al validar cupón');
      return res.json();
    },

    listSurprises: async (): Promise<Promotion[]> => {
      const res = await fetch(`${BASE_URL}/api/promotions/surprises`, {
        headers: getHeaders(true)
      });
      if (!res.ok) throw new Error('Error al listar sorpresas');
      const resData = await res.json();
      return resData.data || [];
    },

    createSurpriseWithQrData: async (title: string, description?: string, qrData?: string): Promise<{ status: string; message: string; data: Promotion }> => {
      const res = await fetch(`${BASE_URL}/api/promotions/surprises`, {
        method: 'POST',
        headers: getHeaders(true),
        body: JSON.stringify({ title, description, qr_data: qrData })
      });
      if (!res.ok) throw new Error('Error al crear sorpresa');
      return res.json();
    },

    createSurpriseWithUpload: async (title: string, description?: string, file?: File): Promise<{ status: string; message: string; data: Promotion }> => {
      const token = localStorage.getItem(KEYS.TOKEN);
      const formData = new FormData();
      formData.append('title', title);
      if (description) formData.append('description', description);
      if (file) formData.append('file', file);

      const res = await fetch(`${BASE_URL}/api/promotions/surprises/upload`, {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: formData
      });
      if (!res.ok) throw new Error('Error al subir sorpresa');
      return res.json();
    },

    deleteSurprise: async (id: number): Promise<{ status: string; message: string }> => {
      const res = await fetch(`${BASE_URL}/api/promotions/surprises/${id}`, {
        method: 'DELETE',
        headers: getHeaders(true)
      });
      if (!res.ok) throw new Error('Error al eliminar sorpresa');
      return res.json();
    }
  }
};




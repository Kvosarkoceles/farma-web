// API Service for Farma Backend
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api2';
//export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL2 || 'http://localhost:3000/api';
console.log(API_BASE_URL);

// Generic fetch wrapper with error handling
async function fetchAPI(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
            ...options,
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Unknown error' }));
            throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Products API
export const productsAPI = {
    getAll: () => fetchAPI('/products'),
    getById: (id) => fetchAPI(`/products/${id}`),
    create: (product) => fetchAPI('/products', {
        method: 'POST',
        body: JSON.stringify(product),
    }),
    update: (id, product) => fetchAPI(`/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(product),
    }),
    delete: (id) => fetchAPI(`/products/${id}`, {
        method: 'DELETE',
    }),
};

export const clientsAPI = {
    getAll: () => fetchAPI('/clients'),
    getById: (id) => fetchAPI(`/clients/${id}`),
    getSales: (id) => fetchAPI(`/clients/${id}/sales`),
    create: (client) => fetchAPI('/clients', {
        method: 'POST',
        body: JSON.stringify(client),
    }),
    update: (id, client) => fetchAPI(`/clients/${id}`, {
        method: 'PUT',
        body: JSON.stringify(client),
    }),
    delete: (id) => fetchAPI(`/clients/${id}`, {
        method: 'DELETE',
    }),
};

export const suppliersAPI = {
    getAll: () => fetchAPI('/suppliers'),
    getById: (id) => fetchAPI(`/suppliers/${id}`),
    create: (supplier) => fetchAPI('/suppliers', {
        method: 'POST',
        body: JSON.stringify(supplier),
    }),
    update: (id, supplier) => fetchAPI(`/suppliers/${id}`, {
        method: 'PUT',
        body: JSON.stringify(supplier),
    }),
    toggleStatus: (id) => fetchAPI(`/suppliers/${id}/toggle-status`, {
        method: 'PUT',
    }),
    delete: (id) => fetchAPI(`/suppliers/${id}`, {
        method: 'DELETE',
    }),
};

export const salesAPI = {
    getAll: () => fetchAPI('/sales'),
    getById: (id) => fetchAPI(`/sales/${id}`),
    create: (sale) => fetchAPI('/sales', {
        method: 'POST',
        body: JSON.stringify(sale),
    }),
};

export const purchasesAPI = {
    getAll: () => fetchAPI('/purchases'),
    /**
     * Obtiene compras detalladas con filtros opcionales y paginación.
     *
     * Respuesta esperada:
     * {
     *   data: Array<{
     *     id: number,
     *     supplier_id: number,
     *     total: string,
     *     payment_method: string,
     *     status: string,
     *     timestamp: string,
     *     supplier_name: string,
     *     total_quantity: string,
     *     purchase_items: Array<{
     *       id: number,
     *       purchase_id: number,
     *       quantity: number,
     *       cost_price: string,
     *       name: string,
     *       category: string
     *     }>
     *   }>,
     *   pagination: {
     *     page: number,
     *     limit: number,
     *     totalItems: number,
     *     totalPages: number
     *   },
     *   filters: {
     *     status: string | null,
     *     supplier_id: number | null,
     *     payment_method: string | null,
     *     search: string | null,
     *     date_from: string | null,
     *     date_to: string | null,
     *     min_total: number | null,
     *     max_total: number | null
     *   }
     * }
     */
    getDetailAll: (params = {}) => {
        const {
            page = 1,
            limit = 5,
            status,
            supplier_id,
            payment_method,
            search,
            date_from,
            date_to,
            min_total,
            max_total,
        } = params;

        const query = new URLSearchParams();

        query.set('page', String(page));
        query.set('limit', String(limit));

        const normalizedStatus = status ?? 'received';

        if (normalizedStatus !== '' && normalizedStatus !== null && normalizedStatus !== undefined) {
            query.set('status', String(normalizedStatus));
        }
        if (supplier_id !== '' && supplier_id !== null && supplier_id !== undefined) {
            query.set('supplier_id', String(supplier_id));
        }
        if (payment_method !== '' && payment_method !== null && payment_method !== undefined) {
            query.set('payment_method', String(payment_method));
        }
        if (search !== '' && search !== null && search !== undefined) {
            query.set('search', String(search));
        }
        if (date_from !== '' && date_from !== null && date_from !== undefined) {
            query.set('date_from', String(date_from));
        }
        if (date_to !== '' && date_to !== null && date_to !== undefined) {
            query.set('date_to', String(date_to));
        }
        if (min_total !== '' && min_total !== null && min_total !== undefined) {
            query.set('min_total', String(min_total));
        }
        if (max_total !== '' && max_total !== null && max_total !== undefined) {
            query.set('max_total', String(max_total));
        }

        return fetchAPI(`/purchases/allDetails?${query.toString()}`);
    },
    create: (purchase) => fetchAPI('/purchases', {
        method: 'POST',
        body: JSON.stringify(purchase),
    }),
    receive: (id) => fetchAPI(`/purchases/${id}/receive`, {
        method: 'PUT',
    }),
};

export const authAPI = {
    login: (credentials) => fetchAPI('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
    }),
};

export const usersAPI = {
    getAll: () => fetchAPI('/users'),
    create: (user) => fetchAPI('/users', {
        method: 'POST',
        body: JSON.stringify(user),
    }),
    update: (id, user) => fetchAPI(`/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(user),
    }),
    delete: (id) => fetchAPI(`/users/${id}`, {
        method: 'DELETE',
    }),
};

export const patientsAPI = {
    getAll: () => fetchAPI('/patients'),
    getById: (id) => fetchAPI(`/patients/${id}`),
    getMedicalHistory: (id) => fetchAPI(`/patients/${id}/medical-history`),
    create: (payload) => fetchAPI('/patients', {
        method: 'POST',
        body: JSON.stringify(payload),
    }),
    update: (id, payload) => fetchAPI(`/patients/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
    }),
    delete: (id) => fetchAPI(`/patients/${id}`, {
        method: 'DELETE',
    }),
};

export const doctorsAPI = {
    getAll: () => fetchAPI('/doctors'),
    getById: (id) => fetchAPI(`/doctors/${id}`),
    create: (payload) => fetchAPI('/doctors', {
        method: 'POST',
        body: JSON.stringify(payload),
    }),
    update: (id, payload) => fetchAPI(`/doctors/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
    }),
    delete: (id) => fetchAPI(`/doctors/${id}`, {
        method: 'DELETE',
    }),
};

export const appointmentsAPI = {
    getAll: (params = {}) => {
        const query = new URLSearchParams();
        if (params.status) query.set('status', params.status);
        if (params.doctor_id) query.set('doctor_id', String(params.doctor_id));
        if (params.patient_id) query.set('patient_id', String(params.patient_id));
        const suffix = query.toString() ? `?${query.toString()}` : '';
        return fetchAPI(`/appointments${suffix}`);
    },
    getById: (id) => fetchAPI(`/appointments/${id}`),
    create: (payload) => fetchAPI('/appointments', {
        method: 'POST',
        body: JSON.stringify(payload),
    }),
    update: (id, payload) => fetchAPI(`/appointments/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
    }),
    updateStatus: (id, payload) => fetchAPI(`/appointments/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify(payload),
    }),
    delete: (id) => fetchAPI(`/appointments/${id}`, {
        method: 'DELETE',
    }),
};

export const consultationsAPI = {
    getAll: (params = {}) => {
        const query = new URLSearchParams();
        if (params.patient_id) query.set('patient_id', String(params.patient_id));
        if (params.doctor_id) query.set('doctor_id', String(params.doctor_id));
        const suffix = query.toString() ? `?${query.toString()}` : '';
        return fetchAPI(`/consultations${suffix}`);
    },
    getById: (id) => fetchAPI(`/consultations/${id}`),
    create: (payload) => fetchAPI('/consultations', {
        method: 'POST',
        body: JSON.stringify(payload),
    }),
    update: (id, payload) => fetchAPI(`/consultations/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
    }),
    delete: (id) => fetchAPI(`/consultations/${id}`, {
        method: 'DELETE',
    }),
};

export const prescriptionsAPI = {
    getAll: (params = {}) => {
        const query = new URLSearchParams();
        if (params.patient_id) query.set('patient_id', String(params.patient_id));
        if (params.doctor_id) query.set('doctor_id', String(params.doctor_id));
        if (params.status) query.set('status', params.status);
        const suffix = query.toString() ? `?${query.toString()}` : '';
        return fetchAPI(`/prescriptions${suffix}`);
    },
    getById: (id) => fetchAPI(`/prescriptions/${id}`),
    getAlerts: (params = {}) => {
        const query = new URLSearchParams();
        if (params.status) query.set('status', params.status);
        const suffix = query.toString() ? `?${query.toString()}` : '';
        return fetchAPI(`/prescriptions/alerts${suffix}`);
    },
    getOrders: (id) => fetchAPI(`/prescriptions/${id}/orders`),
    create: (payload) => fetchAPI('/prescriptions', {
        method: 'POST',
        body: JSON.stringify(payload),
    }),
    update: (id, payload) => fetchAPI(`/prescriptions/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
    }),
    updateStatus: (id, payload) => fetchAPI(`/prescriptions/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify(payload),
    }),
    dispenseItem: (id, itemId, payload) => fetchAPI(`/prescriptions/${id}/items/${itemId}/dispense`, {
        method: 'PUT',
        body: JSON.stringify(payload),
    }),
    updateOrderStatus: (id, orderId, payload) => fetchAPI(`/prescriptions/${id}/orders/${orderId}/status`, {
        method: 'PUT',
        body: JSON.stringify(payload),
    }),
    receiveOrder: (id, orderId, payload = {}) => fetchAPI(`/prescriptions/${id}/orders/${orderId}/receive`, {
        method: 'PUT',
        body: JSON.stringify(payload),
    }),
    dispense: (id, payload = {}) => fetchAPI(`/prescriptions/${id}/dispense`, {
        method: 'PUT',
        body: JSON.stringify(payload),
    }),
    delete: (id) => fetchAPI(`/prescriptions/${id}`, {
        method: 'DELETE',
    }),
};

export default {
    auth: authAPI,
    products: productsAPI,
    clients: clientsAPI,
    suppliers: suppliersAPI,
    sales: salesAPI,
    purchases: purchasesAPI,
    users: usersAPI,
    patients: patientsAPI,
    doctors: doctorsAPI,
    appointments: appointmentsAPI,
    consultations: consultationsAPI,
    prescriptions: prescriptionsAPI,
};

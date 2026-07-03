let VITE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// If VITE_URL is a Render internal hostname (e.g. "churn-backend-ml4y"), convert it to the public URL
if (VITE_URL && !VITE_URL.startsWith('http://') && !VITE_URL.startsWith('https://')) {
  if (VITE_URL.includes('.')) {
    VITE_URL = `https://${VITE_URL}`;
  } else {
    VITE_URL = `https://${VITE_URL}.onrender.com`;
  }
}

const API_BASE_URL = VITE_URL.includes('/api')
  ? VITE_URL
  : `${VITE_URL.replace(/\/$/, '')}/api`;

class ApiClient {
  private getHeaders(): HeadersInit {
    const token = localStorage.getItem('token');
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  private async handleResponse(response: Response) {
    if (response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Redirect to login if on the client
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
      throw new Error('Unauthorized');
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      let errorMessage = `API request failed with status ${response.status}`;
      if (errorData.detail) {
        if (typeof errorData.detail === 'string') {
          errorMessage = errorData.detail;
        } else if (Array.isArray(errorData.detail)) {
          errorMessage = errorData.detail.map((err: any) => err.msg || JSON.stringify(err)).join(', ');
        } else if (typeof errorData.detail === 'object') {
          errorMessage = errorData.detail.message || JSON.stringify(errorData.detail);
        }
      }
      throw new Error(errorMessage);
    }

    // Return null on 204 No Content
    if (response.status === 204) {
      return null;
    }

    return response.json();
  }

  async get<T>(path: string): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }

  async post<T>(path: string, body: any): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    });
    return this.handleResponse(response);
  }

  async put<T>(path: string, body: any): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    });
    return this.handleResponse(response);
  }

  async delete<T>(path: string): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }

  async uploadFile<T>(path: string, file: File): Promise<T> {
    const token = localStorage.getItem('token');
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      headers: headers,
      body: formData,
    });
    return this.handleResponse(response);
  }

  getDownloadUrl(path: string): string {
    const token = localStorage.getItem('token');
    return `${API_BASE_URL}${path}${path.includes('?') ? '&' : '?'}token=${token || ''}`;
  }
}

export const api = new ApiClient();

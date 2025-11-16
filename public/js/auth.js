const API_URL = '/api';

export const auth = {
  async login(username, password) {
    try {
      console.log('Attempting login for:', username);

      const response = await fetch(`${API_URL}/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username: username.trim(), 
          password 
        })
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Login failed:', data.error);
        throw new Error(data.error || 'Login failed');
      }

      console.log('Login successful:', data.user.username);
      
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      return data.user;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  async register(username, email, password, initials) {
    try {
      console.log('Attempting registration for:', username);

      const response = await fetch(`${API_URL}/users/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username: username.trim(), 
          email: email.trim(), 
          password, 
          initials: initials?.trim() 
        })
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Registration failed:', data.error);
        throw new Error(data.error || 'Registration failed');
      }

      console.log('Registration successful:', data.user.username);
      
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      return data.user;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },

  async checkSession() {
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('No token found in localStorage');
      return null;
    }

    try {
      console.log('Checking session...');
      
      const response = await fetch(`${API_URL}/users/check-session`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        console.log('Session invalid, clearing auth');
        this.logout();
        return null;
      }

      const data = await response.json();
      localStorage.setItem('user', JSON.stringify(data.user));
      
      console.log('Session valid:', data.user.username);
      return data.user;
    } catch (error) {
      console.error('Session check error:', error);
      this.logout();
      return null;
    }
  },

  logout() {
    console.log('Logging out...');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  },

  getToken() {
    return localStorage.getItem('token');
  },

  getUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }
};

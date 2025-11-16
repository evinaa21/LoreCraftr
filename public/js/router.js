import { LoginPage } from './pages/login.js';
import { DashboardPage } from './pages/dashboard.js';
import { LobbyPage } from './pages/lobby.js';
import { GamePage } from './pages/game.js';

class Router {
  constructor() {
    this.routes = {
      '/': LoginPage,
      '/dashboard': DashboardPage,
      '/lobby/:roomId': LobbyPage,
      '/game/:roomId': GamePage
    };
    this.currentUser = null;
  }

  init(user) {
    this.currentUser = user;
    
    // Handle navigation
    window.addEventListener('popstate', () => this.handleRoute());
    
    // Handle initial route
    this.handleRoute();
  }
  
  updateUser(user) {
    this.currentUser = user;
    this.handleRoute();
  }

  async handleRoute() {
    const path = window.location.pathname;
    const app = document.getElementById('app');

    // Redirect to login if not authenticated
    if (!this.currentUser && path !== '/') {
      this.navigate('/');
      return;
    }

    // Redirect to dashboard if authenticated and on login page
    if (this.currentUser && path === '/') {
      this.navigate('/dashboard');
      return;
    }

    // Match route
    let matchedRoute = null;
    let params = {};

    for (const [route, PageClass] of Object.entries(this.routes)) {
      const match = this.matchRoute(route, path);
      if (match) {
        matchedRoute = PageClass;
        params = match;
        break;
      }
    }

    // Render page
    if (matchedRoute) {
      app.innerHTML = '';
      const page = new matchedRoute(params);
      app.appendChild(page.render());
    } else {
      app.innerHTML = '<div class="error-page"><h1>404</h1><p>Page not found</p></div>';
    }
  }

  matchRoute(route, path) {
    const routeParts = route.split('/').filter(p => p);
    const pathParts = path.split('/').filter(p => p);

    if (routeParts.length !== pathParts.length) {
      return null;
    }

    const params = {};

    for (let i = 0; i < routeParts.length; i++) {
      if (routeParts[i].startsWith(':')) {
        const paramName = routeParts[i].substring(1);
        params[paramName] = pathParts[i];
      } else if (routeParts[i] !== pathParts[i]) {
        return null;
      }
    }

    return params;
  }

  navigate(path) {
    window.history.pushState({}, '', path);
    this.handleRoute();
  }
}

export const router = new Router();

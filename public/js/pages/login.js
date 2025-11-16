import { auth } from '../auth.js';
import { router } from '../router.js';

export class LoginPage {
  constructor() {
    this.isLogin = true;
  }

  render() {
    const container = document.createElement('div');
    container.className = 'login-page';
    container.innerHTML = `
      <div class="login-container">
        <div class="logo">
          <h1>LORECRAFTR</h1>
          <p class="tagline">Collaborative Storytelling</p>
        </div>

        <form id="auth-form" class="auth-form">
          <div class="form-group" id="email-group" style="display: none;">
            <input 
              type="email" 
              id="email" 
              class="input-field" 
              placeholder="Email"
            />
          </div>

          <div class="form-group">
            <input 
              type="text" 
              id="username" 
              class="input-field" 
              placeholder="Username"
              required
              autocomplete="username"
            />
          </div>

          <div class="form-group">
            <input 
              type="password" 
              id="password" 
              class="input-field" 
              placeholder="Password"
              required
              autocomplete="current-password"
            />
          </div>

          <div class="form-group" id="initials-group" style="display: none;">
            <input 
              type="text" 
              id="initials" 
              class="input-field" 
              placeholder="Initials (2 chars)"
              maxlength="2"
              style="text-transform: uppercase;"
            />
          </div>

          <div class="error-message" id="error-message"></div>

          <button type="submit" class="btn-primary" id="submit-btn">
            <span id="submit-text">LOGIN</span>
          </button>

          <div class="toggle-auth">
            <a href="#" id="toggle-mode">Create an account</a>
          </div>
        </form>
      </div>
    `;

    this.attachEventListeners(container);
    return container;
  }

  attachEventListeners(container) {
    const form = container.querySelector('#auth-form');
    const toggleLink = container.querySelector('#toggle-mode');
    const emailGroup = container.querySelector('#email-group');
    const initialsGroup = container.querySelector('#initials-group');
    const submitText = container.querySelector('#submit-text');
    const submitBtn = container.querySelector('#submit-btn');
    const errorMessage = container.querySelector('#error-message');
    const emailInput = container.querySelector('#email');
    const initialsInput = container.querySelector('#initials');

    toggleLink.addEventListener('click', (e) => {
      e.preventDefault();
      this.isLogin = !this.isLogin;
      errorMessage.textContent = '';

      if (this.isLogin) {
        emailGroup.style.display = 'none';
        initialsGroup.style.display = 'none';
        emailInput.removeAttribute('required');
        submitText.textContent = 'LOGIN';
        toggleLink.textContent = 'Create an account';
      } else {
        emailGroup.style.display = 'block';
        initialsGroup.style.display = 'block';
        emailInput.setAttribute('required', 'required');
        submitText.textContent = 'REGISTER';
        toggleLink.textContent = 'Already have an account?';
      }
    });

    // Auto-uppercase initials
    const initialsField = container.querySelector('#initials');
    initialsField.addEventListener('input', (e) => {
      e.target.value = e.target.value.toUpperCase();
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      errorMessage.textContent = '';
      
      // Disable button during submission
      submitBtn.disabled = true;
      submitText.textContent = this.isLogin ? 'LOGGING IN...' : 'REGISTERING...';

      const username = container.querySelector('#username').value.trim();
      const password = container.querySelector('#password').value;

      if (!username || !password) {
        errorMessage.textContent = 'Please fill in all required fields';
        submitBtn.disabled = false;
        submitText.textContent = this.isLogin ? 'LOGIN' : 'REGISTER';
        return;
      }

      try {
        if (this.isLogin) {
          console.log('Logging in with username:', username);
          await auth.login(username, password);
        } else {
          const email = container.querySelector('#email').value.trim();
          const initials = container.querySelector('#initials').value.trim();
          
          if (!email) {
            throw new Error('Email is required');
          }

          console.log('Registering with username:', username);
          await auth.register(username, email, password, initials);
        }

        console.log('Auth successful, navigating to dashboard');
        router.navigate('/dashboard');
        window.location.reload(); // Force reload to initialize socket
      } catch (error) {
        console.error('Auth error:', error);
        errorMessage.textContent = error.message;
        submitBtn.disabled = false;
        submitText.textContent = this.isLogin ? 'LOGIN' : 'REGISTER';
      }
    });
  }
}

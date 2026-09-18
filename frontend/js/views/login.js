/**
 * @fileoverview Vue de connexion / inscription.
 */

import { loginUser, registerUser } from '../api.js';

let isLoginMode = true;

/**
 * Rend le squelette HTML de la vue Login.
 * @return {string} HTML de la vue.
 */
export function render() {
  return `
    <div class="login-page">
      <div class="login-card">
        <h1 class="login-logo">LifeInvader</h1>
        <p class="login-subtitle">SAÉ 5.02 — BUT R&T</p>

        <form id="auth-form" class="auth-form">
          <div class="form-field" id="field-name" hidden>
            <label for="input-name">Nom complet</label>
            <input type="text" id="input-name" placeholder="Eren" autocomplete="name">
          </div>

          <div class="form-field" id="field-email" >
            <label for="input-email" id="label-identifiant">Nom d'utilisateur ou email</label>
            <input type="text" id="input-email" placeholder="eren_rt" autocomplete="username" required>
          </div>

          <div class="form-field" id="field-email-register" hidden>
            <label for="input-email-register">Email</label>
            <input type="email" id="input-email-register" placeholder="eren@exemple.fr" autocomplete="email">
          </div>

          <div class="form-field">
            <label for="input-password">Mot de passe</label>
            <input type="password" id="input-password" placeholder="••••••••" autocomplete="current-password" required>
          </div>

          <p id="auth-error" class="auth-error" hidden></p>

          <button type="submit" id="btn-auth-submit" class="btn-auth-submit">
            Se connecter
          </button>
        </form>

        <div class="auth-switch">
          <span id="auth-switch-text">Pas de compte ?</span>
          <button type="button" id="btn-auth-switch" class="btn-auth-switch">
            S'inscrire
          </button>
        </div>
      </div>
    </div>
  `;
}

/**
 * Bascule entre le mode connexion et inscription.
 */
function toggleAuthMode() {
  isLoginMode = !isLoginMode;

  const fieldName = document.getElementById('field-name');
  const fieldEmailRegister = document.getElementById('field-email-register');
  const labelIdentifiant = document.getElementById('label-identifiant');
  const submitBtn = document.getElementById('btn-auth-submit');
  const switchText = document.getElementById('auth-switch-text');
  const switchBtn = document.getElementById('btn-auth-switch');

  if (isLoginMode) {
    fieldName.hidden = true;
    fieldEmailRegister.hidden = true;
    labelIdentifiant.textContent = "Nom d'utilisateur ou email";
    submitBtn.textContent = 'Se connecter';
    switchText.textContent = 'Pas de compte ?';
    switchBtn.textContent = "S'inscrire";
  } else {
    fieldName.hidden = false;
    fieldEmailRegister.hidden = false;
    labelIdentifiant.textContent = "Nom d'utilisateur";
    submitBtn.textContent = 'Créer un compte';
    switchText.textContent = 'Déjà inscrit ?';
    switchBtn.textContent = 'Se connecter';
  }
}

/**
 * Gère la soumission du formulaire d'authentification.
 * @param {Event} event Événement de soumission.
 */
async function handleAuthSubmit(event) {
  event.preventDefault();

  const identifiant = document.getElementById('input-email').value.trim();
  const password = document.getElementById('input-password').value;
  const name = document.getElementById('input-name').value.trim();
  const emailRegister = document.getElementById('input-email-register').value.trim();
  const errorEl = document.getElementById('auth-error');
  const submitBtn = document.getElementById('btn-auth-submit');

  errorEl.hidden = true;
  submitBtn.disabled = true;
  submitBtn.textContent = 'Chargement...';

  try {
    if (isLoginMode) {
      await loginUser(identifiant, password);
    } else {
      if (!name) throw new Error('Veuillez saisir votre nom');
      if (!emailRegister) throw new Error('Veuillez saisir votre email');
      await registerUser(identifiant, name, password, emailRegister);
    }

    window.location.hash = '#/feed';
  } catch (error) {
    errorEl.textContent = error.message || 'Une erreur est survenue';
    errorEl.hidden = false;
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = isLoginMode ? 'Se connecter' : 'Créer un compte';
  }
}

/**
 * Monte la vue : installe les event listeners.
 */
export function mount() {
  document.getElementById('btn-auth-switch').addEventListener('click', toggleAuthMode);
  document.getElementById('auth-form').addEventListener('submit', handleAuthSubmit);
}
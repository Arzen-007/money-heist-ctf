"""
Internationalization (i18n) support for the CTF platform.
Provides multi-language support with translation management.
"""
import json
import os
from typing import Dict, Optional, Any
from pathlib import Path


class I18nManager:
    """Manages internationalization and translations"""

    def __init__(self, locales_dir: str = "locales"):
        self.locales_dir = Path(__file__).parent.parent / locales_dir
        self.locales_dir.mkdir(exist_ok=True)
        self.translations: Dict[str, Dict[str, Any]] = {}
        self.default_locale = "en"
        self.supported_locales = ["en", "es", "fr", "de", "zh", "ja", "hi"]
        self.load_translations()

    def load_translations(self):
        """Load all translation files"""
        for locale in self.supported_locales:
            locale_file = self.locales_dir / f"{locale}.json"
            if locale_file.exists():
                try:
                    with open(locale_file, 'r', encoding='utf-8') as f:
                        self.translations[locale] = json.load(f)
                except Exception as e:
                    print(f"Error loading {locale} translations: {e}")
                    self.translations[locale] = {}
            else:
                self.translations[locale] = {}

    def get_translation(self, key: str, locale: str = None, **kwargs) -> str:
        """Get translation for a key"""
        if not locale:
            locale = self.default_locale

        # Navigate through nested keys (e.g., "auth.login.title")
        keys = key.split('.')
        value = self.translations.get(locale, {})

        for k in keys:
            if isinstance(value, dict):
                value = value.get(k, {})
            else:
                break

        # If translation not found, try default locale
        if not isinstance(value, str):
            if locale != self.default_locale:
                return self.get_translation(key, self.default_locale, **kwargs)
            return key  # Return key if no translation found

        # Format with kwargs if provided
        if kwargs:
            try:
                return value.format(**kwargs)
            except (KeyError, ValueError):
                pass

        return value

    def add_translation(self, locale: str, key: str, value: str):
        """Add or update a translation"""
        if locale not in self.translations:
            self.translations[locale] = {}

        keys = key.split('.')
        current = self.translations[locale]

        # Navigate to the correct nested location
        for k in keys[:-1]:
            if k not in current:
                current[k] = {}
            current = current[k]

        current[keys[-1]] = value
        self.save_translations(locale)

    def save_translations(self, locale: str):
        """Save translations for a locale to file"""
        locale_file = self.locales_dir / f"{locale}.json"
        try:
            with open(locale_file, 'w', encoding='utf-8') as f:
                json.dump(self.translations[locale], f, indent=2, ensure_ascii=False)
        except Exception as e:
            print(f"Error saving {locale} translations: {e}")

    def get_supported_locales(self) -> list:
        """Get list of supported locales"""
        return self.supported_locales.copy()

    def set_default_locale(self, locale: str):
        """Set the default locale"""
        if locale in self.supported_locales:
            self.default_locale = locale

    def get_locale_info(self, locale: str) -> Dict[str, Any]:
        """Get information about a locale"""
        locale_names = {
            "en": {"name": "English", "native": "English", "flag": "🇺🇸"},
            "es": {"name": "Spanish", "native": "Español", "flag": "🇪🇸"},
            "fr": {"name": "French", "native": "Français", "flag": "🇫🇷"},
            "de": {"name": "German", "native": "Deutsch", "flag": "🇩🇪"},
            "zh": {"name": "Chinese", "native": "中文", "flag": "🇨🇳"},
            "ja": {"name": "Japanese", "native": "日本語", "flag": "🇯🇵"},
            "hi": {"name": "Hindi", "native": "हिन्दी", "flag": "🇮🇳"}
        }

        return locale_names.get(locale, {
            "name": locale.upper(),
            "native": locale.upper(),
            "flag": "🏳️"
        })


# Global i18n manager instance
i18n = I18nManager()


def t(key: str, locale: str = None, **kwargs) -> str:
    """Translation helper function"""
    return i18n.get_translation(key, locale, **kwargs)


def create_default_translations():
    """Create default translation files for all supported locales"""
    default_translations = {
        "en": {
            "common": {
                "save": "Save",
                "cancel": "Cancel",
                "delete": "Delete",
                "edit": "Edit",
                "create": "Create",
                "submit": "Submit",
                "loading": "Loading...",
                "error": "Error",
                "success": "Success",
                "warning": "Warning",
                "info": "Information"
            },
            "auth": {
                "login": {
                    "title": "Login",
                    "username": "Username",
                    "password": "Password",
                    "submit": "Sign In",
                    "forgot_password": "Forgot Password?",
                    "register": "Don't have an account? Register"
                },
                "register": {
                    "title": "Register",
                    "username": "Username",
                    "email": "Email",
                    "password": "Password",
                    "confirm_password": "Confirm Password",
                    "submit": "Create Account",
                    "login": "Already have an account? Login"
                },
                "errors": {
                    "invalid_credentials": "Invalid username or password",
                    "user_exists": "User already exists",
                    "weak_password": "Password is too weak"
                }
            },
            "challenges": {
                "title": "Challenges",
                "categories": {
                    "web": "Web Security",
                    "crypto": "Cryptography",
                    "forensics": "Digital Forensics",
                    "misc": "Miscellaneous",
                    "pwn": "Binary Exploitation",
                    "reverse": "Reverse Engineering"
                },
                "difficulty": {
                    "easy": "Easy",
                    "medium": "Medium",
                    "hard": "Hard",
                    "expert": "Expert"
                },
                "status": {
                    "unsolved": "Unsolved",
                    "solved": "Solved",
                    "attempted": "Attempted"
                }
            },
            "scoreboard": {
                "title": "Scoreboard",
                "rank": "Rank",
                "team": "Team",
                "score": "Score",
                "challenges_solved": "Challenges Solved",
                "last_solve": "Last Solve"
            },
            "messages": {
                "title": "Messages",
                "send": "Send Message",
                "placeholder": "Type your message...",
                "no_messages": "No messages yet"
            }
        },
        "es": {
            "common": {
                "save": "Guardar",
                "cancel": "Cancelar",
                "delete": "Eliminar",
                "edit": "Editar",
                "create": "Crear",
                "submit": "Enviar",
                "loading": "Cargando...",
                "error": "Error",
                "success": "Éxito",
                "warning": "Advertencia",
                "info": "Información"
            },
            "auth": {
                "login": {
                    "title": "Iniciar Sesión",
                    "username": "Usuario",
                    "password": "Contraseña",
                    "submit": "Iniciar Sesión",
                    "forgot_password": "¿Olvidaste tu contraseña?",
                    "register": "¿No tienes cuenta? Regístrate"
                },
                "register": {
                    "title": "Registrarse",
                    "username": "Usuario",
                    "email": "Correo Electrónico",
                    "password": "Contraseña",
                    "confirm_password": "Confirmar Contraseña",
                    "submit": "Crear Cuenta",
                    "login": "¿Ya tienes cuenta? Inicia Sesión"
                }
            },
            "challenges": {
                "title": "Desafíos",
                "categories": {
                    "web": "Seguridad Web",
                    "crypto": "Criptografía",
                    "forensics": "Forense Digital",
                    "misc": "Misceláneo",
                    "pwn": "Explotación Binaria",
                    "reverse": "Ingeniería Inversa"
                }
            }
        },
        "fr": {
            "common": {
                "save": "Sauvegarder",
                "cancel": "Annuler",
                "delete": "Supprimer",
                "edit": "Modifier",
                "create": "Créer",
                "submit": "Soumettre",
                "loading": "Chargement...",
                "error": "Erreur",
                "success": "Succès",
                "warning": "Avertissement",
                "info": "Information"
            },
            "auth": {
                "login": {
                    "title": "Connexion",
                    "username": "Nom d'utilisateur",
                    "password": "Mot de passe",
                    "submit": "Se connecter",
                    "forgot_password": "Mot de passe oublié ?",
                    "register": "Pas de compte ? S'inscrire"
                }
            }
        }
    }

    # Save default translations
    for locale, translations in default_translations.items():
        locale_file = i18n.locales_dir / f"{locale}.json"
        try:
            with open(locale_file, 'w', encoding='utf-8') as f:
                json.dump(translations, f, indent=2, ensure_ascii=False)
        except Exception as e:
            print(f"Error creating {locale} translations: {e}")


# Initialize default translations if they don't exist
if not any((i18n.locales_dir / f"{locale}.json").exists() for locale in i18n.supported_locales):
    create_default_translations()
    i18n.load_translations()

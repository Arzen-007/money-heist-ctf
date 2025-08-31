"""
Theme and customization system for the CTF platform.
Provides configurable themes, colors, and UI customization options.
"""
from typing import Dict, List, Optional
from pydantic import BaseModel, Field
from enum import Enum


class ThemeMode(str, Enum):
    LIGHT = "light"
    DARK = "dark"
    AUTO = "auto"


class ColorScheme(BaseModel):
    primary: str = Field(default="#2563eb", description="Primary brand color")
    secondary: str = Field(default="#64748b", description="Secondary color")
    accent: str = Field(default="#f59e0b", description="Accent color")
    success: str = Field(default="#10b981", description="Success color")
    warning: str = Field(default="#f59e0b", description="Warning color")
    error: str = Field(default="#ef4444", description="Error color")
    background: str = Field(default="#ffffff", description="Background color")
    surface: str = Field(default="#f8fafc", description="Surface/card color")
    text_primary: str = Field(default="#1e293b", description="Primary text color")
    text_secondary: str = Field(default="#64748b", description="Secondary text color")


class Typography(BaseModel):
    font_family: str = Field(default="'Inter', sans-serif", description="Primary font family")
    font_size_base: str = Field(default="16px", description="Base font size")
    font_weight_normal: int = Field(default=400, description="Normal font weight")
    font_weight_bold: int = Field(default=600, description="Bold font weight")
    line_height: float = Field(default=1.5, description="Line height")


class Spacing(BaseModel):
    xs: str = Field(default="0.25rem", description="Extra small spacing")
    sm: str = Field(default="0.5rem", description="Small spacing")
    md: str = Field(default="1rem", description="Medium spacing")
    lg: str = Field(default="1.5rem", description="Large spacing")
    xl: str = Field(default="2rem", description="Extra large spacing")
    xxl: str = Field(default="3rem", description="Extra extra large spacing")


class BorderRadius(BaseModel):
    none: str = Field(default="0", description="No border radius")
    sm: str = Field(default="0.125rem", description="Small border radius")
    md: str = Field(default="0.375rem", description="Medium border radius")
    lg: str = Field(default="0.5rem", description="Large border radius")
    xl: str = Field(default="0.75rem", description="Extra large border radius")
    full: str = Field(default="9999px", description="Full border radius")


class CTFTheme(BaseModel):
    name: str = Field(..., description="Theme name")
    mode: ThemeMode = Field(default=ThemeMode.LIGHT, description="Theme mode")
    colors: ColorScheme = Field(default_factory=ColorScheme, description="Color scheme")
    typography: Typography = Field(default_factory=Typography, description="Typography settings")
    spacing: Spacing = Field(default_factory=Spacing, description="Spacing system")
    border_radius: BorderRadius = Field(default_factory=BorderRadius, description="Border radius system")
    custom_css: Optional[str] = Field(default=None, description="Custom CSS overrides")


# Predefined themes
DEFAULT_LIGHT_THEME = CTFTheme(
    name="Default Light",
    mode=ThemeMode.LIGHT,
    colors=ColorScheme(
        primary="#2563eb",
        secondary="#64748b",
        accent="#f59e0b",
        success="#10b981",
        warning="#f59e0b",
        error="#ef4444",
        background="#ffffff",
        surface="#f8fafc",
        text_primary="#1e293b",
        text_secondary="#64748b"
    )
)

DEFAULT_DARK_THEME = CTFTheme(
    name="Default Dark",
    mode=ThemeMode.DARK,
    colors=ColorScheme(
        primary="#3b82f6",
        secondary="#94a3b8",
        accent="#fbbf24",
        success="#34d399",
        warning="#fbbf24",
        error="#f87171",
        background="#0f172a",
        surface="#1e293b",
        text_primary="#f8fafc",
        text_secondary="#cbd5e1"
    )
)

HACKER_THEME = CTFTheme(
    name="Hacker",
    mode=ThemeMode.DARK,
    colors=ColorScheme(
        primary="#00ff41",
        secondary="#008f11",
        accent="#ff073a",
        success="#00ff41",
        warning="#ffff00",
        error="#ff073a",
        background="#000000",
        surface="#111111",
        text_primary="#00ff41",
        text_secondary="#008f11"
    )
)

CYBERPUNK_THEME = CTFTheme(
    name="Cyberpunk",
    mode=ThemeMode.DARK,
    colors=ColorScheme(
        primary="#ff0080",
        secondary="#00ffff",
        accent="#ffff00",
        success="#00ff00",
        warning="#ff8000",
        error="#ff0040",
        background="#0a0a0a",
        surface="#1a1a1a",
        text_primary="#ffffff",
        text_secondary="#cccccc"
    )
)


class ThemeManager:
    """Manages themes and customization options"""

    def __init__(self):
        self.themes: Dict[str, CTFTheme] = {
            "default_light": DEFAULT_LIGHT_THEME,
            "default_dark": DEFAULT_DARK_THEME,
            "hacker": HACKER_THEME,
            "cyberpunk": CYBERPUNK_THEME
        }

    def get_theme(self, theme_name: str) -> Optional[CTFTheme]:
        """Get a theme by name"""
        return self.themes.get(theme_name)

    def get_available_themes(self) -> List[str]:
        """Get list of available theme names"""
        return list(self.themes.keys())

    def add_custom_theme(self, theme: CTFTheme) -> None:
        """Add a custom theme"""
        self.themes[theme.name.lower().replace(" ", "_")] = theme

    def generate_css_variables(self, theme: CTFTheme) -> str:
        """Generate CSS custom properties from theme"""
        css_vars = []

        # Colors
        for key, value in theme.colors.dict().items():
            css_vars.append(f"  --color-{key.replace('_', '-')}: {value};")

        # Typography
        for key, value in theme.typography.dict().items():
            css_vars.append(f"  --typography-{key.replace('_', '-')}: {value};")

        # Spacing
        for key, value in theme.spacing.dict().items():
            css_vars.append(f"  --spacing-{key}: {value};")

        # Border radius
        for key, value in theme.border_radius.dict().items():
            css_vars.append(f"  --border-radius-{key}: {value};")

        return ":root {\n" + "\n".join(css_vars) + "\n}"

    def generate_theme_css(self, theme: CTFTheme) -> str:
        """Generate complete CSS for a theme"""
        base_css = self.generate_css_variables(theme)

        # Add custom CSS if provided
        if theme.custom_css:
            base_css += "\n\n" + theme.custom_css

        return base_css


# Global theme manager instance
theme_manager = ThemeManager()


def get_theme_css(theme_name: str = "default_light") -> str:
    """Get CSS for a specific theme"""
    theme = theme_manager.get_theme(theme_name)
    if not theme:
        theme = DEFAULT_LIGHT_THEME
    return theme_manager.generate_theme_css(theme)


def get_available_themes() -> List[str]:
    """Get list of available themes"""
    return theme_manager.get_available_themes()

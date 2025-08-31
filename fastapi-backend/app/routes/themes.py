"""
Theme and customization API endpoints.
Provides endpoints for theme management and customization.
"""
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import Response
from typing import List, Optional
from ..core.themes import (
    theme_manager,
    get_theme_css,
    get_available_themes,
    CTFTheme,
    ThemeMode
)

router = APIRouter(prefix="/themes", tags=["themes"])


@router.get("/available")
async def get_available_themes_endpoint():
    """Get list of available themes"""
    return {
        "themes": get_available_themes(),
        "default": "default_light"
    }


@router.get("/css/{theme_name}")
async def get_theme_css_endpoint(
    theme_name: str,
    download: bool = Query(False, description="Download as CSS file")
):
    """Get CSS for a specific theme"""
    try:
        css_content = get_theme_css(theme_name)

        if download:
            return Response(
                content=css_content,
                media_type="text/css",
                headers={
                    "Content-Disposition": f"attachment; filename={theme_name}.css"
                }
            )

        return Response(content=css_content, media_type="text/css")

    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Theme '{theme_name}' not found")


@router.get("/preview/{theme_name}")
async def preview_theme(theme_name: str):
    """Get theme preview information"""
    theme = theme_manager.get_theme(theme_name)
    if not theme:
        raise HTTPException(status_code=404, detail=f"Theme '{theme_name}' not found")

    return {
        "name": theme.name,
        "mode": theme.mode.value,
        "colors": theme.colors.dict(),
        "typography": theme.typography.dict(),
        "preview_css": theme_manager.generate_css_variables(theme)
    }


@router.post("/custom")
async def create_custom_theme(theme: CTFTheme):
    """Create a custom theme"""
    try:
        theme_manager.add_custom_theme(theme)
        return {
            "message": f"Custom theme '{theme.name}' created successfully",
            "theme_id": theme.name.lower().replace(" ", "_")
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to create theme: {str(e)}")


@router.get("/variables/{theme_name}")
async def get_theme_variables(theme_name: str):
    """Get CSS custom properties for a theme"""
    theme = theme_manager.get_theme(theme_name)
    if not theme:
        raise HTTPException(status_code=404, detail=f"Theme '{theme_name}' not found")

    return {
        "theme": theme_name,
        "variables": theme_manager.generate_css_variables(theme)
    }


@router.get("/all")
async def get_all_themes():
    """Get all available themes with their configurations"""
    themes = {}
    for theme_name in get_available_themes():
        theme = theme_manager.get_theme(theme_name)
        if theme:
            themes[theme_name] = {
                "name": theme.name,
                "mode": theme.mode.value,
                "colors": theme.colors.dict(),
                "has_custom_css": theme.custom_css is not None
            }

    return {"themes": themes}


# HTML template for theme preview
THEME_PREVIEW_HTML = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CTF Theme Preview - {theme_name}</title>
    <style>
        {theme_css}
        body {{
            font-family: var(--typography-font-family);
            background-color: var(--color-background);
            color: var(--color-text-primary);
            margin: 0;
            padding: var(--spacing-xl);
            line-height: var(--typography-line-height);
        }}

        .preview-container {{
            max-width: 1200px;
            margin: 0 auto;
        }}

        .theme-header {{
            background: var(--color-surface);
            padding: var(--spacing-xl);
            border-radius: var(--border-radius-lg);
            margin-bottom: var(--spacing-xl);
            border: 1px solid var(--color-secondary);
        }}

        .color-palette {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: var(--spacing-md);
            margin: var(--spacing-xl) 0;
        }}

        .color-item {{
            padding: var(--spacing-md);
            border-radius: var(--border-radius-md);
            text-align: center;
            color: white;
            font-weight: var(--typography-font-weight-bold);
        }}

        .component-showcase {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: var(--spacing-xl);
        }}

        .component-card {{
            background: var(--color-surface);
            padding: var(--spacing-xl);
            border-radius: var(--border-radius-lg);
            border: 1px solid var(--color-secondary);
        }}

        .btn-primary {{
            background: var(--color-primary);
            color: white;
            border: none;
            padding: var(--spacing-md) var(--spacing-xl);
            border-radius: var(--border-radius-md);
            cursor: pointer;
            font-weight: var(--typography-font-weight-bold);
            transition: opacity 0.2s;
        }}

        .btn-primary:hover {{
            opacity: 0.8;
        }}

        .btn-secondary {{
            background: var(--color-secondary);
            color: white;
            border: none;
            padding: var(--spacing-md) var(--spacing-xl);
            border-radius: var(--border-radius-md);
            cursor: pointer;
            font-weight: var(--typography-font-weight-bold);
        }}

        .input-field {{
            width: 100%;
            padding: var(--spacing-md);
            border: 1px solid var(--color-secondary);
            border-radius: var(--border-radius-md);
            background: var(--color-background);
            color: var(--color-text-primary);
            margin-bottom: var(--spacing-md);
        }}

        .status-success {{
            color: var(--color-success);
            font-weight: var(--typography-font-weight-bold);
        }}

        .status-error {{
            color: var(--color-error);
            font-weight: var(--typography-font-weight-bold);
        }}
    </style>
</head>
<body>
    <div class="preview-container">
        <div class="theme-header">
            <h1>{theme_name} Theme Preview</h1>
            <p>This preview shows how the {theme_name} theme will look in the CTF platform.</p>
        </div>

        <div class="component-card">
            <h2>Color Palette</h2>
            <div class="color-palette">
                <div class="color-item" style="background: var(--color-primary);">Primary</div>
                <div class="color-item" style="background: var(--color-secondary);">Secondary</div>
                <div class="color-item" style="background: var(--color-accent);">Accent</div>
                <div class="color-item" style="background: var(--color-success);">Success</div>
                <div class="color-item" style="background: var(--color-warning);">Warning</div>
                <div class="color-item" style="background: var(--color-error);">Error</div>
            </div>
        </div>

        <div class="component-showcase">
            <div class="component-card">
                <h3>Buttons</h3>
                <button class="btn-primary">Primary Button</button>
                <br><br>
                <button class="btn-secondary">Secondary Button</button>
            </div>

            <div class="component-card">
                <h3>Form Elements</h3>
                <input type="text" class="input-field" placeholder="Username" value="test_user">
                <input type="password" class="input-field" placeholder="Password" value="••••••••">
                <input type="email" class="input-field" placeholder="Email" value="user@example.com">
            </div>

            <div class="component-card">
                <h3>Status Messages</h3>
                <p class="status-success">✓ Challenge solved successfully!</p>
                <p class="status-error">✗ Incorrect flag submitted</p>
                <p>Regular text for comparison</p>
            </div>
        </div>

        <div class="component-card">
            <h3>Typography</h3>
            <h1>Heading 1 - Main Title</h1>
            <h2>Heading 2 - Section Title</h2>
            <h3>Heading 3 - Component Title</h3>
            <p>This is regular paragraph text. It should be easily readable with good contrast against the background. The line height should provide comfortable reading spacing.</p>
            <p><strong>This is bold text</strong> for emphasis and <em>this is italic text</em> for subtle emphasis.</p>
        </div>
    </div>
</body>
</html>
"""


@router.get("/preview-page/{theme_name}")
async def get_theme_preview_page(theme_name: str):
    """Get HTML preview page for a theme"""
    theme = theme_manager.get_theme(theme_name)
    if not theme:
        raise HTTPException(status_code=404, detail=f"Theme '{theme_name}' not found")

    css_content = theme_manager.generate_theme_css(theme)
    html_content = THEME_PREVIEW_HTML.format(
        theme_name=theme.name,
        theme_css=css_content
    )

    return Response(content=html_content, media_type="text/html")

"""
Internationalization API endpoints.
Provides translation management and locale support.
"""
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import JSONResponse
from typing import List, Optional, Dict, Any
from ..core.i18n import i18n, t

router = APIRouter(prefix="/i18n", tags=["i18n"])


@router.get("/locales")
async def get_supported_locales():
    """Get list of supported locales with metadata"""
    locales = []
    for locale_code in i18n.get_supported_locales():
        locale_info = i18n.get_locale_info(locale_code)
        locales.append({
            "code": locale_code,
            **locale_info
        })

    return {"locales": locales, "default": i18n.default_locale}


@router.get("/translations/{locale}")
async def get_translations(
    locale: str,
    namespace: Optional[str] = Query(None, description="Specific namespace to retrieve")
):
    """Get translations for a specific locale"""
    if locale not in i18n.supported_locales:
        raise HTTPException(status_code=404, detail=f"Locale '{locale}' not supported")

    translations = i18n.translations.get(locale, {})

    if namespace:
        # Return only specific namespace
        keys = namespace.split('.')
        result = translations
        for key in keys:
            if isinstance(result, dict):
                result = result.get(key, {})
            else:
                result = {}
                break
        return {namespace: result}

    return {"locale": locale, "translations": translations}


@router.get("/translate")
async def translate_key(
    key: str = Query(..., description="Translation key"),
    locale: Optional[str] = Query(None, description="Locale code"),
    **kwargs
):
    """Translate a specific key with optional parameters"""
    try:
        translation = t(key, locale, **kwargs)
        return {"key": key, "translation": translation, "locale": locale or i18n.default_locale}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Translation error: {str(e)}")


@router.post("/translations/{locale}")
async def add_translation(
    locale: str,
    key: str = Query(..., description="Translation key"),
    value: str = Query(..., description="Translation value")
):
    """Add or update a translation (admin only)"""
    if locale not in i18n.supported_locales:
        raise HTTPException(status_code=400, detail=f"Locale '{locale}' not supported")

    try:
        i18n.add_translation(locale, key, value)
        return {
            "message": f"Translation added successfully",
            "locale": locale,
            "key": key,
            "value": value
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to add translation: {str(e)}")


@router.get("/bulk/{locale}")
async def get_bulk_translations(
    locale: str,
    keys: List[str] = Query(..., description="List of translation keys")
):
    """Get multiple translations at once"""
    if locale not in i18n.supported_locales:
        raise HTTPException(status_code=404, detail=f"Locale '{locale}' not supported")

    translations = {}
    for key in keys:
        translations[key] = t(key, locale)

    return {
        "locale": locale,
        "translations": translations
    }


@router.get("/info/{locale}")
async def get_locale_info(locale: str):
    """Get detailed information about a locale"""
    if locale not in i18n.supported_locales:
        raise HTTPException(status_code=404, detail=f"Locale '{locale}' not supported")

    info = i18n.get_locale_info(locale)
    translation_count = len(i18n.translations.get(locale, {}))

    return {
        "code": locale,
        **info,
        "translation_count": translation_count,
        "is_default": locale == i18n.default_locale
    }


@router.get("/health")
async def i18n_health_check():
    """Health check for i18n system"""
    supported_count = len(i18n.supported_locales)
    loaded_count = len([l for l in i18n.supported_locales if i18n.translations.get(l)])

    return {
        "status": "healthy" if loaded_count > 0 else "degraded",
        "supported_locales": supported_count,
        "loaded_locales": loaded_count,
        "default_locale": i18n.default_locale
    }


# Frontend integration helper
@router.get("/frontend-config/{locale}")
async def get_frontend_config(locale: str):
    """Get frontend configuration with translations"""
    if locale not in i18n.supported_locales:
        # Fallback to default locale
        locale = i18n.default_locale

    # Get essential translations for frontend
    essential_keys = [
        "common.save",
        "common.cancel",
        "common.delete",
        "common.edit",
        "common.loading",
        "common.error",
        "common.success",
        "auth.login.title",
        "auth.login.submit",
        "auth.register.title",
        "auth.register.submit",
        "challenges.title",
        "scoreboard.title",
        "messages.title"
    ]

    translations = {}
    for key in essential_keys:
        translations[key] = t(key, locale)

    return {
        "locale": locale,
        "locale_info": i18n.get_locale_info(locale),
        "translations": translations,
        "supported_locales": i18n.get_supported_locales()
    }

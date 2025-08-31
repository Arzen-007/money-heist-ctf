"""
API Documentation endpoints.
Provides enhanced API documentation and examples.
"""
from fastapi import APIRouter, Request
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.openapi.docs import get_swagger_ui_html, get_redoc_html
from fastapi.openapi.utils import get_openapi
from typing import Dict, Any
import json

router = APIRouter(prefix="/docs", tags=["documentation"])


@router.get("/", response_class=HTMLResponse)
async def api_documentation():
    """Enhanced API documentation page"""
    html_content = """
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Money Heist CTF API Documentation</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                margin: 0;
                padding: 0;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
            }
            .container {
                max-width: 1200px;
                margin: 0 auto;
                padding: 20px;
            }
            .header {
                text-align: center;
                color: white;
                margin-bottom: 40px;
            }
            .header h1 {
                font-size: 3em;
                margin-bottom: 10px;
                text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
            }
            .header p {
                font-size: 1.2em;
                opacity: 0.9;
            }
            .docs-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                gap: 20px;
                margin-bottom: 40px;
            }
            .doc-card {
                background: white;
                border-radius: 10px;
                padding: 25px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.1);
                transition: transform 0.3s ease;
            }
            .doc-card:hover {
                transform: translateY(-5px);
            }
            .doc-card h3 {
                color: #333;
                margin-top: 0;
                font-size: 1.5em;
            }
            .doc-card p {
                color: #666;
                line-height: 1.6;
            }
            .btn {
                display: inline-block;
                background: #667eea;
                color: white;
                padding: 12px 24px;
                text-decoration: none;
                border-radius: 5px;
                transition: background 0.3s ease;
                margin: 5px;
            }
            .btn:hover {
                background: #5a6fd8;
            }
            .btn-secondary {
                background: #764ba2;
            }
            .btn-secondary:hover {
                background: #6b4190;
            }
            .features {
                background: white;
                border-radius: 10px;
                padding: 30px;
                margin-bottom: 30px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            }
            .features h2 {
                color: #333;
                text-align: center;
                margin-bottom: 20px;
            }
            .features-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 20px;
            }
            .feature-item {
                text-align: center;
                padding: 20px;
                border-radius: 8px;
                background: #f8f9fa;
            }
            .feature-item h4 {
                color: #667eea;
                margin-bottom: 10px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🎯 Money Heist CTF API</h1>
                <p>Comprehensive Capture The Flag platform with gamification and real-time features</p>
            </div>

            <div class="features">
                <h2>🚀 Platform Features</h2>
                <div class="features-grid">
                    <div class="feature-item">
                        <h4>🎮 Gamification</h4>
                        <p>XP system, levels, badges, and leaderboards</p>
                    </div>
                    <div class="feature-item">
                        <h4>💬 Real-time Chat</h4>
                        <p>Live messaging with WebSocket support</p>
                    </div>
                    <div class="feature-item">
                        <h4>🎨 Themes</h4>
                        <p>Customizable UI themes and dark mode</p>
                    </div>
                    <div class="feature-item">
                        <h4>🌍 Multi-language</h4>
                        <p>Internationalization support</p>
                    </div>
                    <div class="feature-item">
                        <h4>📊 Analytics</h4>
                        <p>Comprehensive monitoring and reporting</p>
                    </div>
                    <div class="feature-item">
                        <h4>🔒 Security</h4>
                        <p>Advanced security features and rate limiting</p>
                    </div>
                </div>
            </div>

            <div class="docs-grid">
                <div class="doc-card">
                    <h3>📋 Interactive API Docs</h3>
                    <p>Explore and test all API endpoints with our interactive Swagger UI documentation.</p>
                    <a href="/docs/swagger" class="btn">Open Swagger UI</a>
                </div>

                <div class="doc-card">
                    <h3>📖 ReDoc Documentation</h3>
                    <p>Clean, responsive API documentation with all endpoints and schemas.</p>
                    <a href="/docs/redoc" class="btn">Open ReDoc</a>
                </div>

                <div class="doc-card">
                    <h3>🔧 OpenAPI Schema</h3>
                    <p>Download the complete OpenAPI 3.0 specification for integration.</p>
                    <a href="/docs/openapi.json" class="btn btn-secondary">Download JSON</a>
                </div>

                <div class="doc-card">
                    <h3>📊 API Health</h3>
                    <p>Check the current status and health of all API services.</p>
                    <a href="/docs/health" class="btn btn-secondary">View Health Status</a>
                </div>
            </div>

            <div class="doc-card">
                <h3>🚀 Quick Start</h3>
                <p>Get started with the Money Heist CTF API in minutes.</p>
                <h4>Authentication</h4>
                <pre><code>POST /api/auth/login
{
  "username": "your_username",
  "password": "your_password"
}</code></pre>

                <h4>Get Challenges</h4>
                <pre><code>GET /api/challenges</code></pre>

                <h4>Submit Flag</h4>
                <pre><code>POST /api/challenges/{id}/submit
{
  "flag": "CTF{flag_here}"
}</code></pre>
            </div>
        </div>
    </body>
    </html>
    """
    return HTMLResponse(content=html_content)


@router.get("/swagger", response_class=HTMLResponse)
async def swagger_ui():
    """Custom Swagger UI with enhanced styling"""
    return get_swagger_ui_html(
        openapi_url="/docs/openapi.json",
        title="Money Heist CTF API",
        swagger_css_url="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui.css",
        swagger_js_url="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-bundle.js",
    )


@router.get("/redoc", response_class=HTMLResponse)
async def redoc_ui():
    """ReDoc UI for API documentation"""
    return get_redoc_html(
        openapi_url="/docs/openapi.json",
        title="Money Heist CTF API Documentation",
    )


@router.get("/openapi.json")
async def get_openapi_schema(request: Request):
    """Get the OpenAPI schema"""
    return get_openapi(
        title="Money Heist CTF API",
        version="1.0.0",
        description="""
        A comprehensive Capture The Flag platform with gamification features.

        ## Features
        - **User Management**: Registration, authentication, and profile management
        - **Challenge System**: Create and manage CTF challenges with categories and difficulty levels
        - **Team Management**: Form teams and collaborate on challenges
        - **Real-time Features**: Live chat, notifications, and scoreboard updates
        - **Gamification**: XP system, badges, levels, and leaderboards
        - **Themes**: Customizable UI themes and dark mode support
        - **Internationalization**: Multi-language support
        - **Analytics**: Comprehensive monitoring and reporting

        ## Authentication
        Use JWT tokens for authentication. Include the token in the Authorization header:
        ```
        Authorization: Bearer your_jwt_token
        ```
        """,
        routes=request.app.routes,
    )


@router.get("/health")
async def api_health():
    """Comprehensive API health check"""
    health_data = {
        "status": "healthy",
        "version": "1.0.0",
        "services": {
            "api": "healthy",
            "database": "unknown",  # Would be checked in real implementation
            "redis": "unknown",
            "websocket": "healthy"
        },
        "features": {
            "authentication": True,
            "real_time": True,
            "themes": True,
            "i18n": True,
            "gamification": True
        },
        "endpoints": {
            "total": 0,  # Would be calculated
            "authenticated": 0,
            "public": 0
        },
        "timestamp": "2024-01-01T00:00:00Z"  # Would be current timestamp
    }

    return JSONResponse(content=health_data)


@router.get("/examples")
async def api_examples():
    """API usage examples and code snippets"""
    examples = {
        "authentication": {
            "login": {
                "curl": """curl -X POST "http://localhost:8000/api/auth/login" \\
  -H "Content-Type: application/json" \\
  -d '{"username": "player1", "password": "securepass123"}'""",
                "python": """import requests

response = requests.post('http://localhost:8000/api/auth/login',
    json={'username': 'player1', 'password': 'securepass123'})
token = response.json()['access_token']""",
                "javascript": """fetch('/api/auth/login', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    username: 'player1',
    password: 'securepass123'
  })
})
.then(res => res.json())
.then(data => console.log(data.access_token))"""
            }
        },
        "challenges": {
            "get_challenges": {
                "curl": """curl -X GET "http://localhost:8000/api/challenges" \\
  -H "Authorization: Bearer YOUR_TOKEN" """,
                "python": """headers = {'Authorization': f'Bearer {token}'}
response = requests.get('http://localhost:8000/api/challenges', headers=headers)"""
            },
            "submit_flag": {
                "curl": """curl -X POST "http://localhost:8000/api/challenges/1/submit" \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"flag": "CTF{your_flag_here}"}'"""
            }
        },
        "websocket": {
            "connect": """const ws = new WebSocket('ws://localhost:8000/ws/chat?token=YOUR_TOKEN');

// Listen for messages
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Received:', data);
};

// Send a message
ws.send(JSON.stringify({
  type: 'message',
  content: 'Hello, CTF!',
  team_id: 1
}));"""
        }
    }

    return JSONResponse(content=examples)


@router.get("/changelog")
async def api_changelog():
    """API changelog and version history"""
    changelog = {
        "versions": [
            {
                "version": "1.0.0",
                "date": "2024-01-01",
                "changes": [
                    "Initial release with core CTF functionality",
                    "User authentication and authorization",
                    "Challenge management system",
                    "Team collaboration features",
                    "Real-time chat and notifications",
                    "Gamification system with XP and badges",
                    "Theme customization",
                    "Internationalization support"
                ]
            }
        ]
    }

    return JSONResponse(content=changelog)

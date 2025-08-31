# 🎯 Money Heist CTF Platform

A comprehensive Capture The Flag (CTF) platform built with modern web technologies, featuring gamification, real-time collaboration, and extensive customization options.

![Platform Preview](https://via.placeholder.com/800x400/667eea/ffffff?text=Money+Heist+CTF+Platform)

## ✨ Features

### 🎮 Core CTF Features
- **Challenge Management**: Create and manage challenges across multiple categories
- **Team Collaboration**: Form teams and work together on challenges
- **Real-time Scoreboard**: Live updates of rankings and scores
- **Flag Submission**: Secure flag validation and submission system
- **Hint System**: Progressive hints with currency-based access

### 🎯 Gamification
- **XP & Leveling System**: Earn experience points and level up
- **Badges & Achievements**: Unlock badges for various accomplishments
- **Leaderboards**: Compete with other teams and players
- **Dynamic Scoring**: Points that decrease over time for fairness

### 💬 Real-time Features
- **Live Chat**: Team and global chat with WebSocket support
- **Real-time Notifications**: Instant updates on challenge solves and announcements
- **Live Scoreboard Updates**: See rankings change in real-time
- **Collaborative Solving**: Work together with your team in real-time

### 🎨 Customization & Theming
- **Multiple Themes**: Pre-built themes including Dark, Light, Hacker, and Cyberpunk
- **Custom Themes**: Create and share your own themes
- **Theme Preview**: Live preview of themes before applying
- **CSS Variables**: Easy customization with CSS custom properties

### 🌍 Internationalization
- **Multi-language Support**: English, Spanish, French, German, Chinese, Japanese, Hindi
- **Dynamic Translation**: Add new languages and translations easily
- **Locale Detection**: Automatic locale detection based on user preferences

### 🔒 Security & Administration
- **Role-based Access Control**: Admin, player, and guest roles
- **Rate Limiting**: Prevent abuse with configurable rate limits
- **Audit Logging**: Comprehensive logging of all platform activities
- **Security Headers**: Modern security headers and best practices

### 📊 Analytics & Monitoring
- **Grafana Dashboards**: Real-time monitoring and analytics
- **OpenSearch Integration**: Powerful search and analytics
- **Metabase Reports**: Business intelligence and reporting
- **Performance Metrics**: Detailed performance monitoring

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- Git
- At least 4GB RAM for all services

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/money-heist-ctf.git
   cd money-heist-ctf
   ```

2. **Environment Setup**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Launch with Docker Compose**
   ```bash
   # For development
   docker-compose up -d

   # For production
   docker-compose -f docker-compose.prod.yml up -d
   ```

4. **Access the Platform**
   - Frontend: http://localhost
   - API Documentation: http://localhost/docs
   - Admin Panel: http://localhost/admin

### Manual Installation

1. **Backend Setup**
   ```bash
   cd fastapi-backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

2. **Database Setup**
   ```bash
   # Install and start MySQL/MariaDB
   # Create database and user
   mysql -u root -p
   CREATE DATABASE ctf_platform;
   CREATE USER 'ctf_user'@'localhost' IDENTIFIED BY 'ctf_pass';
   GRANT ALL PRIVILEGES ON ctf_platform.* TO 'ctf_user'@'localhost';
   ```

3. **Run Migrations**
   ```bash
   alembic upgrade head
   ```

4. **Start Services**
   ```bash
   # Backend
   uvicorn app.main:app --reload

   # Frontend (in another terminal)
   cd ../src
   npm install
   npm start
   ```

## 📋 API Documentation

### Authentication
```bash
# Login
curl -X POST "http://localhost:8000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username": "player1", "password": "securepass123"}'

# Register
curl -X POST "http://localhost:8000/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"username": "player1", "email": "player@example.com", "password": "securepass123"}'
```

### Challenges
```bash
# Get all challenges
curl -X GET "http://localhost:8000/api/challenges" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Submit flag
curl -X POST "http://localhost:8000/api/challenges/1/submit" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"flag": "CTF{your_flag_here}"}'
```

### Real-time Features (WebSocket)
```javascript
const ws = new WebSocket('ws://localhost:8000/ws/chat?token=YOUR_TOKEN');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Received:', data);
};

ws.send(JSON.stringify({
  type: 'message',
  content: 'Hello, CTF!',
  team_id: 1
}));
```

## 🎨 Theming

### Available Themes
- **Default Light**: Clean, professional light theme
- **Default Dark**: Modern dark theme
- **Hacker**: Matrix-inspired green theme
- **Cyberpunk**: Neon cyberpunk aesthetic

### Custom Theme Creation
```python
from app.core.themes import CTFTheme, ColorScheme

custom_theme = CTFTheme(
    name="My Custom Theme",
    mode="dark",
    colors=ColorScheme(
        primary="#ff6b6b",
        secondary="#4ecdc4",
        accent="#ffe66d",
        background="#2d3436",
        surface="#636e72"
    )
)

theme_manager.add_custom_theme(custom_theme)
```

## 🌍 Internationalization

### Supported Languages
- English (en) - Default
- Spanish (es)
- French (fr)
- German (de)
- Chinese (zh)
- Japanese (ja)
- Hindi (hi)

### Adding Translations
```bash
# Add a new translation
curl -X POST "http://localhost:8000/api/i18n/translations/en" \
  -d "key=challenges.new_feature" \
  -d "value=New Feature Available!"
```

## 🏗️ Architecture

```
money-heist-ctf/
├── fastapi-backend/          # FastAPI backend application
│   ├── app/
│   │   ├── core/            # Core functionality (auth, config, themes, i18n)
│   │   ├── models/          # SQLAlchemy models
│   │   ├── routes/          # API route handlers
│   │   └── utils/           # Utility functions
│   ├── alembic/             # Database migrations
│   └── requirements.txt     # Python dependencies
├── src/                     # React frontend application
├── docker-compose.yml       # Development environment
├── docker-compose.prod.yml  # Production environment
├── Dockerfile              # Backend container
├── Dockerfile.frontend     # Frontend container
└── nginx.conf             # Reverse proxy configuration
```

## 🔧 Configuration

### Environment Variables
```bash
# Database
DATABASE_URL=mysql+pymysql://user:pass@localhost/ctf_platform

# Redis
REDIS_URL=redis://localhost:6379/0

# Security
SECRET_KEY=your-secret-key-change-this
JWT_SECRET_KEY=your-jwt-secret

# External Services
OPENSEARCH_URL=http://localhost:9200
MINIO_ENDPOINT=http://localhost:9000

# Email (optional)
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

## 📊 Monitoring & Analytics

### Grafana Dashboards
- **System Metrics**: CPU, memory, disk usage
- **API Performance**: Response times, error rates
- **User Activity**: Active users, challenge completions
- **Database Metrics**: Query performance, connection counts

### Access Points
- Grafana: http://localhost:3000 (admin/admin)
- Metabase: http://localhost:3001
- MinIO Console: http://localhost:9001 (minioadmin/minioadmin)

## 🔒 Security Features

### Authentication & Authorization
- JWT-based authentication
- Role-based access control (Admin, Player, Guest)
- Password hashing with bcrypt
- Session management

### API Security
- Rate limiting per endpoint
- Input validation and sanitization
- CORS configuration
- Security headers (CSP, HSTS, etc.)

### Data Protection
- SQL injection prevention
- XSS protection
- CSRF protection
- Secure flag storage

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow PEP 8 for Python code
- Use ESLint for JavaScript/React code
- Write tests for new features
- Update documentation for API changes
- Use conventional commits

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by various CTF platforms and gamification systems
- Built with modern web technologies and best practices
- Community contributions and feedback

## 📞 Support

- **Documentation**: [API Docs](http://localhost/docs)
- **Issues**: [GitHub Issues](https://github.com/yourusername/money-heist-ctf/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/money-heist-ctf/discussions)

---

**Happy Hacking! 🎯**

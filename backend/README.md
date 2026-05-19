# Plane & Prop Backend API

A Node.js + TypeScript + PostgreSQL + Drizzle ORM backend for the Plane & Prop community platform.

## Tech Stack

- **Runtime**: Node.js 18+
- **Language**: TypeScript 5
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM
- **Authentication**: JWT + bcrypt
- **Validation**: Zod

## Project Structure

```
backend/
├── src/
│   ├── api/
│   │   ├── routes/        # Express route handlers
│   │   └── services/      # Business logic
│   ├── db/
│   │   ├── index.ts       # Database connection
│   │   └── schema.ts      # Drizzle ORM schema
│   ├── middleware/        # Express middleware
│   ├── utils/             # Utility functions
│   └── index.ts           # App entry point
├── migrations/            # Drizzle migrations
├── drizzle.config.ts      # Drizzle configuration
├── tsconfig.json          # TypeScript config
├── package.json           # Dependencies
└── .env.example           # Environment variables template
```

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Setup Database

Create a PostgreSQL database:

```bash
createdb plane_prop
```

Or use Docker:

```bash
docker run --name plane-prop-db \
  -e POSTGRES_DB=plane_prop \
  -e POSTGRES_PASSWORD=password \
  -p 5432:5432 \
  -d postgres:15
```

### 3. Environment Setup

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Update the `DATABASE_URL` in `.env`:

```
DATABASE_URL=postgresql://postgres:password@localhost:5432/plane_prop
JWT_SECRET=your-secret-key-min-32-chars
```

### 4. Database Migration

Generate Drizzle migrations from schema:

```bash
npm run db:generate
```

Apply migrations:

```bash
npm run db:migrate
```

### 5. Initialize Database with Seed Data

The database is now ready. The schema includes:
- Enum types for user roles, post status, etc.
- All tables with proper indexes and relationships
- Foreign key constraints

## Development

Start the development server:

```bash
npm run dev
```

The server will start on `http://localhost:5000`

### Health Check

```bash
curl http://localhost:5000/health
```

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build TypeScript to JavaScript |
| `npm start` | Run built application |
| `npm run db:generate` | Generate Drizzle migrations |
| `npm run db:migrate` | Apply migrations to database |
| `npm run db:studio` | Open Drizzle Studio UI |
| `npm run lint` | Run ESLint |
| `npm run type-check` | Type check TypeScript |

## API Endpoints

### Authentication

- `POST /api/auth/signup` - Register new user
- `POST /api/auth/signin` - Login user
- `POST /api/auth/verify-email` - Verify email with OTP

### Response Format

All responses follow this format:

```json
{
  "success": true,
  "data": {...},
  "error": null,
  "timestamp": "2026-05-15T10:30:45Z"
}
```

Error responses:

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Email is required",
    "details": {}
  },
  "timestamp": "2026-05-15T10:30:45Z"
}
```

## Database Schema

The database schema includes:

1. **Authentication**
   - users
   - auth_tokens
   - roles
   - permissions

2. **User Management**
   - user_profiles
   - media_files

3. **Community**
   - community_posts
   - community_comments
   - community_categories
   - post_likes
   - comment_likes

4. **Content**
   - student_letters
   - letter_acknowledgements

5. **Moderation**
   - community_feedback
   - flagged_content
   - banned_users
   - community_rules

6. **System**
   - audit_logs
   - api_logs
   - system_settings

## Drizzle Studio

View and manage your database with Drizzle Studio:

```bash
npm run db:studio
```

This opens a web UI for database management at `http://localhost:3000`

## Environment Variables

```
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/plane_prop

# Server
PORT=5000
NODE_ENV=development

# JWT
JWT_SECRET=your_secret_key_here
ACCESS_TOKEN_EXPIRY=1m
REFRESH_TOKEN_EXPIRY=7d

# Frontend
FRONTEND_URL=http://localhost:5173
```

## Progress

- ✅ Project setup with TypeScript and Express
- ✅ Drizzle ORM configuration and schema
- ✅ Database connection pooling
- ✅ Authentication utilities (JWT, bcrypt, OTP)
- ✅ Validation with Zod
- ✅ Error handling middleware
- ✅ Auth middleware
- ✅ Sign up endpoint
- ✅ Sign in endpoint
- ✅ Email verification endpoint
- ⏳ User profile endpoints
- ⏳ Community posts endpoints
- ⏳ Comments endpoints
- ⏳ Admin endpoints

## Next Steps

1. Set up PostgreSQL database
2. Configure `.env` with database connection
3. Run migrations
4. Start development server
5. Test authentication endpoints with cURL or Postman
6. Implement remaining API endpoints

## Troubleshooting

### Database Connection Error

Check that PostgreSQL is running and the `DATABASE_URL` is correct:

```bash
psql $DATABASE_URL
```

### Migration Issues

If migrations fail, check the Drizzle config and schema:

```bash
npm run db:generate -- --clean
```

### Port Already in Use

Change the PORT in `.env` or kill the process using port 5000:

```bash
lsof -i :5000
kill -9 <PID>
```

## Resources

- [Express.js Documentation](https://expressjs.com/)
- [Drizzle ORM Docs](https://orm.drizzle.team/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [JWT Authentication](https://jwt.io/)
- [Zod Validation](https://zod.dev/)

## License

MIT

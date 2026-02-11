# How to Connect to MySQL Database

## Your Project Uses MySQL (Not PostgreSQL)

Your Prisma schema shows:
```prisma
datasource db {
  provider = "mysql"  // ← MySQL, not PostgreSQL
  url      = env("DATABASE_URL")
}
```

## Connection Methods

### Option 1: MySQL Command Line Client

```bash
# Connect to MySQL
mysql -h localhost -u your_username -p your_database

# Or with full connection string
mysql -h localhost -P 3306 -u root -p localperks
```

**Note**: You need MySQL installed. If you don't have it:
- **Windows**: Install MySQL Server or use XAMPP/WAMP
- **Mac**: `brew install mysql`
- **Linux**: `sudo apt-get install mysql-client`

### Option 2: Prisma Studio (Recommended)

```bash
# Make sure .env.local has your local database URL
npm run db:studio:local

# Or for production
npm run db:studio:prod
```

This opens a GUI in your browser at `http://localhost:5555`

### Option 3: MySQL Workbench (GUI Tool)

1. Download: https://dev.mysql.com/downloads/workbench/
2. Create new connection:
   - Host: `localhost`
   - Port: `3306`
   - Username: `root` (or your MySQL user)
   - Password: Your MySQL password
   - Database: `localperks`

### Option 4: VS Code Extension

Install "MySQL" extension in VS Code:
1. Open VS Code
2. Install extension: "MySQL" by cweijan
3. Add connection using your `.env.local` DATABASE_URL

### Option 5: DBeaver (Universal Database Tool)

1. Download: https://dbeaver.io/download/
2. Create new MySQL connection
3. Use connection details from your `.env.local`

## Check Your Database Connection

### Get Connection String from .env.local

```bash
# View your local database URL
cat .env.local | grep DATABASE_URL

# Or on Windows PowerShell
Get-Content .env.local | Select-String "DATABASE_URL"
```

### Test Connection with Prisma

```bash
# Test local connection
npx prisma db pull --schema=./prisma/schema.prisma

# Or use Prisma Studio
npx prisma studio
```

## Common MySQL Connection Strings

### Local MySQL
```
mysql://root:password@localhost:3306/localperks
```

### PlanetScale (Production)
```
mysql://user:password@host.planetscale.com:3306/database?sslaccept=strict
```

## Troubleshooting

### "Command not found: mysql"

**Windows:**
- Install MySQL Server: https://dev.mysql.com/downloads/mysql/
- Or add MySQL to PATH

**Mac:**
```bash
brew install mysql
```

**Linux:**
```bash
sudo apt-get install mysql-client
```

### "Access denied for user"

Check your `.env.local`:
```env
DATABASE_URL="mysql://username:password@localhost:3306/database"
```

Make sure:
- Username is correct
- Password is correct
- User has access to the database

### "Can't connect to MySQL server"

1. **Check if MySQL is running:**
   ```bash
   # Windows
   net start MySQL80
   
   # Mac/Linux
   sudo systemctl start mysql
   # or
   brew services start mysql
   ```

2. **Check port:**
   - MySQL default: `3306`
   - PostgreSQL default: `5432` (you were trying this)

3. **Check firewall:**
   - Make sure port 3306 is not blocked

## Quick Setup

### 1. Create .env.local

```bash
# Copy template
cp .env.local.example .env.local

# Edit with your MySQL credentials
# DATABASE_URL="mysql://root:password@localhost:3306/localperks"
```

### 2. Test Connection

```bash
# Using Prisma (easiest)
npx prisma studio

# Or using MySQL client
mysql -h localhost -u root -p localperks
```

### 3. View Database

```bash
# Open Prisma Studio (GUI)
npm run db:studio:local
```

## Summary

- ✅ Use **MySQL** client, not PostgreSQL (`psql`)
- ✅ Default port: **3306** (not 5432)
- ✅ Use **Prisma Studio** for easiest access: `npx prisma studio`
- ✅ Check `.env.local` for your connection string







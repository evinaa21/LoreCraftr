#!/usr/bin/env pwsh
# LoreCraftr Setup Script for Windows

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor White
Write-Host "  🖤 LoreCraftr Setup" -ForegroundColor White
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor White
Write-Host ""

# Check Node.js
Write-Host "Checking Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js $nodeVersion found" -ForegroundColor Green
} catch {
    Write-Host "✗ Node.js not found!" -ForegroundColor Red
    Write-Host "  Please install Node.js from https://nodejs.org/" -ForegroundColor Red
    exit 1
}

# Check MongoDB
Write-Host "Checking MongoDB..." -ForegroundColor Yellow
try {
    $mongoStatus = Get-Service MongoDB -ErrorAction SilentlyContinue
    if ($mongoStatus) {
        if ($mongoStatus.Status -eq 'Running') {
            Write-Host "✓ MongoDB is running" -ForegroundColor Green
        } else {
            Write-Host "⚠ MongoDB service found but not running" -ForegroundColor Yellow
            Write-Host "  Starting MongoDB..." -ForegroundColor Yellow
            Start-Service MongoDB
            Write-Host "✓ MongoDB started" -ForegroundColor Green
        }
    } else {
        Write-Host "⚠ MongoDB service not found" -ForegroundColor Yellow
        Write-Host "  Attempting to start MongoDB manually..." -ForegroundColor Yellow
        # Try to start mongod
        Start-Process mongod -ArgumentList "--dbpath=C:\data\db" -WindowStyle Hidden -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 2
        Write-Host "✓ MongoDB started (check manually if issues occur)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠ Could not verify MongoDB status" -ForegroundColor Yellow
    Write-Host "  Please ensure MongoDB is installed and running" -ForegroundColor Yellow
}

# Install dependencies
Write-Host ""
Write-Host "Installing dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Failed to install dependencies" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Dependencies installed" -ForegroundColor Green

# Create .env if not exists
Write-Host ""
Write-Host "Checking environment configuration..." -ForegroundColor Yellow
if (!(Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "✓ Created .env file" -ForegroundColor Green
} else {
    Write-Host "✓ .env file already exists" -ForegroundColor Green
}

# Seed database
Write-Host ""
Write-Host "Seeding database..." -ForegroundColor Yellow
npm run seed
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠ Database seeding had issues (may be already seeded)" -ForegroundColor Yellow
} else {
    Write-Host "✓ Database seeded successfully" -ForegroundColor Green
}

# Complete
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor White
Write-Host "  ✓ Setup Complete!" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor White
Write-Host ""
Write-Host "To start the server:" -ForegroundColor Cyan
Write-Host "  npm start          (production)" -ForegroundColor White
Write-Host "  npm run dev        (development)" -ForegroundColor White
Write-Host ""
Write-Host "Then open: http://localhost:5000" -ForegroundColor Cyan
Write-Host ""

# Ask if user wants to start now
$start = Read-Host "Start the server now? (y/n)"
if ($start -eq "y" -or $start -eq "Y") {
    Write-Host ""
    Write-Host "Starting LoreCraftr server..." -ForegroundColor Green
    npm start
}

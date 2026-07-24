@echo off
REM Test Lintara Backend Connection (Windows)

echo.
echo 0x1a Lintara Backend Connection Test
echo ===================================
echo.

REM Test 1: Check if backend is running
echo Test 1: Checking backend...
timeout /t 1 /nobreak > nul

curl -s http://localhost:5000/ > nul 2>&1
if %ERRORLEVEL% EQU 0 (
  echo [OK] Backend is running on port 5000
  set BACKEND_OK=1
) else (
  echo [FAIL] Backend is NOT running on port 5000
  echo Run: cd backend ^&^& npm run dev
  set BACKEND_OK=0
)
echo.

REM Test 2: Check MySQL connection
if %BACKEND_OK% EQU 1 (
  echo Test 2: Checking MySQL connection...
  
  mysql -u root -e "SELECT 1;" > nul 2>&1
  if %ERRORLEVEL% EQU 0 (
    echo [OK] MySQL is running
    
    mysql -u root -e "USE lintara; SHOW TABLES;" > nul 2>&1
    if %ERRORLEVEL% EQU 0 (
      echo [OK] Database 'lintara' exists and has tables
    ) else (
      echo [FAIL] Database 'lintara' not found or no tables
      echo Run: mysql -u root -p lintara less "lintara (2).sql"
    )
  ) else (
    echo [FAIL] MySQL is NOT running or password is wrong
    echo Check .env DB_PASSWORD setting
  )
)
echo.

REM Test 3: Test API endpoints
if %BACKEND_OK% EQU 1 (
  echo Test 3: Testing API endpoints...
  
  curl -s http://localhost:5000/api/travels | find "success" > nul
  if %ERRORLEVEL% EQU 0 (
    echo [OK] GET /api/travels is working
  ) else (
    echo [FAIL] GET /api/travels failed
  )
)
echo.

echo ===================================
echo [DONE] Test complete!
echo.
echo Next steps:
echo 1. If all tests pass, run frontend: npx expo start
echo 2. Update API_BASE_URL in constants/api.ts if needed
echo 3. Try login/register in the app
echo.
pause

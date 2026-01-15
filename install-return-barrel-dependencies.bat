@echo off
echo 📦 Installing Return Barrel Management System Dependencies...
echo.

cd server

echo 🔧 Installing server dependencies...
call npm install qrcode uuid

echo.
echo ✅ Server dependencies installed!
echo.

cd ..

echo 🎉 All dependencies installed successfully!
echo.
echo 📝 Installed packages:
echo    - qrcode (QR code generation)
echo    - uuid (Unique ID generation)
echo.
echo ✨ Next steps:
echo    1. Run: node setup-return-barrel-system.js
echo    2. Add route to server/server.js:
echo       app.use('/api/return-barrels', require('./routes/returnBarrelRoutes'));
echo    3. Start your server and test the system!
echo.
pause

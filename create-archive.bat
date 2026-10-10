@echo off
echo ========================================
echo   TG Parser - Создание архива проекта
echo ========================================
echo.

REM Создаем временную папку для архива
if exist "tg-parser-archive" rmdir /s /q "tg-parser-archive"
mkdir "tg-parser-archive"
mkdir "tg-parser-archive\src"
mkdir "tg-parser-archive\src\components"

REM Копируем корневые файлы
copy "index.html" "tg-parser-archive\" >nul
copy "package.json" "tg-parser-archive\" >nul
copy "tsconfig.json" "tg-parser-archive\" >nul
copy "vite.config.js" "tg-parser-archive\" >nul
copy ".gitignore" "tg-parser-archive\" >nul
copy "README.md" "tg-parser-archive\" >nul

REM Копируем src файлы
copy "src\main.tsx" "tg-parser-archive\src\" >nul
copy "src\App.tsx" "tg-parser-archive\src\" >nul
copy "src\index.css" "tg-parser-archive\src\" >nul
copy "src\types.ts" "tg-parser-archive\src\" >nul
copy "src\store.ts" "tg-parser-archive\src\" >nul
copy "src\webStore.ts" "tg-parser-archive\src\" >nul

REM Копируем компоненты
copy "src\components\Dashboard.tsx" "tg-parser-archive\src\components\" >nul
copy "src\components\ChannelsList.tsx" "tg-parser-archive\src\components\" >nul
copy "src\components\PostsList.tsx" "tg-parser-archive\src\components\" >nul
copy "src\components\PublishQueue.tsx" "tg-parser-archive\src\components\" >nul
copy "src\components\Settings.tsx" "tg-parser-archive\src\components\" >nul
copy "src\components\SitesManager.tsx" "tg-parser-archive\src\components\" >nul

REM Создаем ZIP архив
powershell -Command "Compress-Archive -Path '.\tg-parser-archive\*' -DestinationPath '.\tg-parser-latest.zip' -Force"

REM Удаляем временную папку
rmdir /s /q "tg-parser-archive"

echo.
echo ========================================
echo   Архив создан: tg-parser-latest.zip
echo ========================================
echo.
echo Файлы в архиве:
echo   - index.html
echo   - package.json
echo   - tsconfig.json
echo   - vite.config.js
echo   - .gitignore
echo   - README.md
echo   - src/main.tsx
echo   - src/App.tsx
echo   - src/index.css
echo   - src/types.ts
echo   - src/store.ts
echo   - src/webStore.ts
echo   - src/components/Dashboard.tsx
echo   - src/components/ChannelsList.tsx
echo   - src/components/PostsList.tsx
echo   - src/components/PublishQueue.tsx
echo   - src/components/Settings.tsx
echo   - src/components/SitesManager.tsx
echo.
echo Загрузите архив на GitHub:
echo   1. Откройте https://github.com/vovavolodarsky000-netizen/parss
echo   2. Нажмите "Add file" -^> "Upload files"
echo   3. Распакуйте архив и перетащите все файлы
echo   4. Нажмите "Commit changes"
echo.
pause

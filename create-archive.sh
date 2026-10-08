#!/bin/bash

echo "========================================"
echo "  TG Parser - Создание архива проекта"
echo "========================================"
echo ""

# Создаем временную папку
rm -rf tg-parser-archive
mkdir -p tg-parser-archive/src/components

# Копируем файлы
cp index.html package.json tsconfig.json vite.config.js .gitignore README.md tg-parser-archive/
cp src/main.tsx src/App.tsx src/index.css src/types.ts src/store.ts src/webStore.ts tg-parser-archive/src/
cp src/components/*.tsx tg-parser-archive/src/components/

# Создаем ZIP
cd tg-parser-archive
zip -r ../tg-parser-latest.zip .
cd ..

# Удаляем временную папку
rm -rf tg-parser-archive

echo ""
echo "========================================"
echo "  Архив создан: tg-parser-latest.zip"
echo "========================================"
echo ""
echo "Загрузите архив на GitHub:"
echo "  1. Откройте https://github.com/vovavolodarsky000-netizen/parss"
echo "  2. Нажмите 'Add file' -> 'Upload files'"
echo "  3. Распакуйте архив и перетащите все файлы"
echo "  4. Нажмите 'Commit changes'"
echo ""

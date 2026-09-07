#!/usr/bin/env bash
set -e

# Fallback giải nén nếu chưa được giải nén trước trong build
if [ -f "data/fialda_profiles.zip" ] && [ ! -f "data/fialda_profiles/AAA.json" ]; then
    echo "📦 Unzipping data/fialda_profiles.zip..."
    unzip -q -o data/fialda_profiles.zip -d data/
fi

if [ -f "static/shareholder_data.zip" ] && [ ! -d "static/shareholder_data" ]; then
    echo "📦 Unzipping static/shareholder_data.zip..."
    unzip -q -o static/shareholder_data.zip -d static/
fi

PORT="${PORT:-10000}"
echo "========================================================"
echo "🚀 Starting Vnstock Quant Pro Server on port ${PORT}..."
echo "========================================================"
exec uvicorn main:app --host 0.0.0.0 --port "$PORT" --workers 1

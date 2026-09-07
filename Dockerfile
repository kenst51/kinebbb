FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

WORKDIR /app

# Cài đặt các công cụ hệ thống tối thiểu
RUN apt-get update && apt-get install -y --no-install-recommends \
    wget \
    curl \
    unzip \
    && rm -rf /var/lib/apt/lists/*

# Cài đặt Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy toàn bộ mã nguồn và dữ liệu
COPY . .

# Giải nén sẵn bộ dữ liệu lớn trong giai đoạn build để container khởi động tức thì trên Render
RUN if [ -f "data/fialda_profiles.zip" ]; then \
        echo "Pre-extracting data/fialda_profiles.zip..." && \
        unzip -q -o data/fialda_profiles.zip -d data/ && \
        rm -f data/fialda_profiles.zip; \
    fi && \
    if [ -f "static/shareholder_data.zip" ]; then \
        echo "Pre-extracting static/shareholder_data.zip..." && \
        unzip -q -o static/shareholder_data.zip -d static/ && \
        rm -f static/shareholder_data.zip; \
    fi

# Chuẩn hóa quyền và line-ending cho start.sh
RUN chmod +x start.sh && sed -i 's/\r$//' start.sh

EXPOSE 10000

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:${PORT:-10000}/api/health || exit 1

CMD ["./start.sh"]

# Step 1: Use an official light version of Python
FROM python:3.10-slim

# Step 2: Install updated system dependencies, Google Chrome, and clean up cache
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    unzip \
    curl \
    libglib2.0-0 \
    libnss3 \
    libfontconfig1 \
    chromium \
    chromium-driver \
    && rm -rf /var/lib/apt/lists/*

# Step 3: Set up the working folder inside the container
WORKDIR /app

# Step 4: Copy packages list first and install them
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Step 5: Copy all remaining backend source files into the container
COPY . .

# Step 6: Create the screenshots directory explicitly
RUN mkdir -p /app/screenshots

# Step 7: Expose Render's default communication port
EXPOSE 10000

# Step 8: Fire up the FastAPI production app using Uvicorn
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "10000"]
# Stage 1: Build Rust Backend
FROM rust:1.89-slim-bookworm AS builder-rust
WORKDIR /usr/src/app
RUN apt-get update && apt-get install -y \
    pkg-config \
    libssl-dev \
    build-essential \
    curl \
    python3 \
    git \
    && rm -rf /var/lib/apt/lists/*
COPY rust-lib ./rust-lib
COPY src-tauri ./src-tauri
COPY src ./src
COPY Cargo.toml Cargo.lock ./
COPY tuono.config.ts ./
RUN cargo build --release --bin tuono

# Stage 2: Build React Frontend
FROM node:20 AS builder-web
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm
RUN pnpm install
COPY . .
RUN pnpm run build:web

# Stage 3: Create Production Image
FROM ubuntu:24.04
WORKDIR /app
# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    ca-certificates \
    libssl3 \
    && rm -rf /var/lib/apt/lists/*
COPY --from=builder-rust /usr/src/app/target/release/tuono /app/
COPY --from=builder-web /app/dist /app/dist
# Copy configuration files needed at runtime
COPY tuono.config.ts ./
EXPOSE 3001
CMD ["/app/tuono"]

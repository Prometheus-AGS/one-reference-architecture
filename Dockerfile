# Stage 1: Build Rust Backend
FROM rust:1.89-alpine AS builder-rust
WORKDIR /usr/src/app
RUN apk --no-cache add musl-dev
COPY rust-lib ./rust-lib
COPY src-tauri ./src-tauri
COPY Cargo.toml Cargo.lock ./
RUN cargo build --release --bin tuono_server

# Stage 2: Build React Frontend
FROM node:20-alpine AS builder-web
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm
RUN pnpm install
COPY . .
RUN pnpm run build:web

# Stage 3: Create Production Image
FROM alpine:latest
WORKDIR /app
COPY --from=builder-rust /usr/src/app/target/release/tuono_server /app/
COPY --from=builder-web /app/dist /app/dist
EXPOSE 3001
CMD ["/app/tuono_server"]
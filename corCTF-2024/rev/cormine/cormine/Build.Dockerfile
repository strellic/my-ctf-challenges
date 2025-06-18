FROM ubuntu:20.04 AS builder
ARG DEBIAN_FRONTEND=noninteractive
RUN apt-get update && \
    apt-get install -y g++ pkg-config libx11-dev libasound2-dev libudev-dev libxkbcommon-x11-0 curl && \
    rm -rf /var/lib/apt/lists/*
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --default-toolchain nightly
RUN mkdir -p /build

COPY assets/ /build/assets/
COPY cormine_shared/ /build/cormine_shared/
COPY cormine_generate/ /build/cormine_generate/
COPY src/ /build/src/
COPY Cargo.toml Cargo.lock /build/

WORKDIR /build

RUN . $HOME/.cargo/env && cargo build --release

FROM scratch
COPY --from=builder /build/target/release/cormine /cormine

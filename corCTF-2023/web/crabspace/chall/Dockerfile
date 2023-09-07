# build phase
FROM rust:slim AS builder

WORKDIR /app
COPY . .
RUN cargo build --release

# final image
FROM debian:bullseye-slim

COPY flag.txt /flag.txt

WORKDIR /app
COPY --from=builder /app/target/release/crabspace ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/templates ./templates

RUN useradd -ms /bin/bash user
USER user

ENV SECRET bhtfvrbya2el1aj9j9yc1khanujw5sy2cnsfnixv7pe9b0ayuyki6o3ckvzzpe6m

CMD ["/app/crabspace"]
# build stage
FROM golang:1.25-alpine AS builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .

# build từ main.go
RUN go build -o migrate .

# run stage
FROM alpine:latest

WORKDIR /app

COPY --from=builder /app/migrate .
COPY --from=builder /app/migrations ./migrations

CMD ["./migrate", "up"]

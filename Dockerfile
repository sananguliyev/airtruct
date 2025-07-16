FROM golang:1.24 AS deps

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

FROM golang:1.24 AS build

ENV CGO_ENABLED=1
ENV GOOS=linux

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends libzmq3-dev

COPY --from=deps /go/pkg /go/pkg
COPY . .

RUN mkdir build

RUN go build -ldflags="-s -w -X main.Version=docker -X main.DateBuilt=$(date -u +%Y-%m-%dT%H:%M:%SZ)" -o build ./cmd/...

FROM debian:latest AS runtime

RUN apt-get update && apt-get install -y --no-install-recommends \
    libzmq3-dev \
    ca-certificates \
    tzdata \
    && rm -rf /var/lib/apt/lists/*

COPY --from=build /app/build .

CMD ["/airtruct", "run"]

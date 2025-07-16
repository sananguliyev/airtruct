FROM golang:1.24-alpine@sha256:7772cb5322baa875edd74705556d08f0eeca7b9c4b5367754ce3f2f00041ccee as deps

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

FROM golang:1.24-alpine@sha256:7772cb5322baa875edd74705556d08f0eeca7b9c4b5367754ce3f2f00041ccee as build

WORKDIR /app

RUN apk add build-base gcc

COPY --from=deps /go/pkg /go/pkg
COPY . .

RUN mkdir build

RUN CGO_ENABLED=1 go build -ldflags="-s -w -X main.Version=docker -X main.DateBuilt=$(date -u +%Y-%m-%dT%H:%M:%SZ)" -o build ./cmd/...

FROM alpine:3.21@sha256:a8560b36e8b8210634f77d9f7f9efd7ffa463e380b75e2e74aff4511df3ef88c

COPY --from=build /app/build .

CMD ["/airtruct", "run"]

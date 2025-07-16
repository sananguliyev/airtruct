FROM golang:1.24 as deps

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

FROM golang:1.24 as build

WORKDIR /app

COPY --from=deps /go/pkg /go/pkg
COPY . .

RUN mkdir build

RUN CGO_ENABLED=1 go build -ldflags="-s -w -X main.Version=docker -X main.DateBuilt=$(date -u +%Y-%m-%dT%H:%M:%SZ)" -o build ./cmd/...

FROM busybox

COPY --from=build /app/build .

CMD ["/airtruct", "run"]

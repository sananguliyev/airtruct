FROM golang:1.23-alpine3.20 as deps

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

FROM golang:1.23-alpine3.20 as build

WORKDIR /app

RUN apk add build-base gcc

COPY --from=deps /go/pkg /go/pkg
COPY . .

RUN mkdir build

RUN CGO_ENABLED=1 go build -o build ./cmd/...

FROM alpine:3.20

COPY --from=build /app/build .

CMD ["/airtruct", "run"]

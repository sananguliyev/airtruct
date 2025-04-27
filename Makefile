protoc:
	protoc --proto_path=proto \
       --go_out=internal/protogen --go_opt=paths=source_relative \
       --go-grpc_out=internal/protogen --go-grpc_opt=paths=source_relative \
       --grpc-gateway_out=internal/protogen --grpc-gateway_opt=paths=source_relative \
       --validate_out=lang=go:internal/protogen --validate_opt=paths=source_relative \
       proto/*.proto

statik:
	statik -src=ui/dist -dest=internal/. 

build:
	go build -o dist/airtruct ./cmd/... 

run-coordinator:
	export DATABASE_URI="file:./airtruct.sqlite?_foreign_keys=1&mode=rwc" 
	./dist/./dist/airtruct -gp 50000

run-worker:
	./dist/airtruct -gp 50001 -role worker

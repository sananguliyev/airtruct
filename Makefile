protoc:
	protoc --proto_path=proto \
       --go_out=internal/protogen --go_opt=paths=source_relative \
       --go-grpc_out=internal/protogen --go-grpc_opt=paths=source_relative \
       --grpc-gateway_out=internal/protogen --grpc-gateway_opt=paths=source_relative \
       --validate_out=lang=go:internal/protogen --validate_opt=paths=source_relative \
       proto/*.proto
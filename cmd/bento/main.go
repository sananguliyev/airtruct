package main

import (
	"context"

	_ "github.com/warpstreamlabs/bento/public/components/aws"
	_ "github.com/warpstreamlabs/bento/public/components/io"
	_ "github.com/warpstreamlabs/bento/public/components/kafka"
	_ "github.com/warpstreamlabs/bento/public/components/prometheus"
	_ "github.com/warpstreamlabs/bento/public/components/pure"
	"github.com/warpstreamlabs/bento/public/service"

	_ "github.com/sananguliyev/airtruct/internal/components/all"
)

func main() {
	service.RunCLI(context.Background())
}

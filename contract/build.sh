#!/bin/sh

echo ">> Building contract"

near-sdk-js build src/contract.ts build/blog-platform.wasm

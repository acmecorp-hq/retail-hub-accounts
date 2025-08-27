.PHONY: deps build run

deps:
	npm install

build: deps
	npm run build

run:
	npm run dev

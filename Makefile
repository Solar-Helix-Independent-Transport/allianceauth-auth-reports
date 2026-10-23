.PHONY: help clean dev docs package test testjs buildjs devui

help:
	@echo "This project assumes that an active Python virtualenv is present."
	@echo "The following make targets are available:"
	@echo "  dev        install all deps for dev environment"
	@echo "  clean      remove all old packages"
	@echo "  test       run tests"
	@echo "  testjs     run the React Project's tests"
	@echo "  deploy     Configure the PyPi config file in CI"
	@echo "  buildjs    Build the React Project"
	@echo "  package    Build the React Project and the PyPi package"
	@echo "  devui      Run the React Dev server"

clean:
	rm -rf dist/*
	rm -rf frontend-bs5/build/*

dev:
	pip install --upgrade pip
	pip install wheel -U
	pip install tox -U
	pip install -e .

test:
	tox

deploy:
	pip install twine
	twine upload dist/*

testjs:
	cd frontend-bs5;npm ci;npm test

buildjs:
	cd frontend-bs5;npm ci;npm run build;

package:
	cd frontend-bs5;npm ci;npm run build;
	pip install -U hatch
	hatch build

devui:
	cd frontend-bs5;npm install;npm run dev

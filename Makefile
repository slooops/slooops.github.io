
# codectl version : 1.5.2

.PHONY: default
default: all


dev:
	@mkdir -p config
	@codectl template . -x templates/dev.yaml --namespace rev-accruals-monitoring-alln-nprd --env dev --cluster cae-np-alln > config/cae-np-alln-rev-accruals-monitoring-alln-nprd-dev.yaml
 


all: dev 

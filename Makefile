
# codectl version : 1.5.5

.PHONY: default
default: all


dev:
	@mkdir -p config
	@codectl template . -x templates/dev.yaml --namespace rev-accruals-monitoring-alln-nprd --env dev --cluster cae-np-alln > config/cae-np-alln-rev-accruals-monitoring-alln-nprd-dev.yaml

dev-ui:
	@mkdir -p config
	@codectl template . -x templates/dev-ui.yaml --namespace rev-accruals-monitoring-alln-nprd --env dev-ui --cluster cae-np-alln > config/cae-np-alln-rev-accruals-monitoring-alln-nprd-dev-ui.yaml

stage:
	@mkdir -p config
	@codectl template . -x templates/stage.yaml --namespace rev-accruals-monitoring-stg --env stage --cluster cae-np-alln > config/cae-np-alln-rev-accruals-monitoring-stg-stage.yaml

stage-ui:
	@mkdir -p config
	@codectl template . -x templates/stage-ui.yaml --namespace rev-accruals-monitoring-stg --env stage-ui --cluster cae-np-alln > config/cae-np-alln-rev-accruals-monitoring-stg-stage-ui.yaml
 


all: dev dev-ui stage stage-ui 

all-dev: dev dev-ui

all-stage: stage stage-ui

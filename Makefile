
# codectl version : 1.5.6

.PHONY: default
default: all


dev:
	@mkdir -p config
	@codectl template . -x templates/dev.yaml --namespace rev-operations-dashboard-rtp2 --env dev --cluster cae-np-rtp2 > config/cae-np-rtp2-rev-operations-dashboard-rtp2-dev.yaml
 
dev-ui:
	@mkdir -p config
	@codectl template . -x templates/dev-ui.yaml --namespace rev-operations-dashboard-rtp2 --env dev-ui --cluster cae-np-rtp2 > config/cae-np-rtp2-rev-operations-dashboard-rtp2-dev-ui.yaml

all: dev dev-ui



stage:
	@mkdir -p config
	@codectl template . -x templates/stage.yaml --namespace rev-operations-dashboard-stg-rtp2 --env stage --cluster cae-np-rtp2 > config/cae-np-rtp2-rev-operations-dashboard-stg-rtp2-stage.yaml
 
stage-ui:
	@mkdir -p config
	@codectl template . -x templates/stage-ui.yaml --namespace rev-operations-dashboard-stg-rtp2 --env stage-ui --cluster cae-np-rtp2 > config/cae-np-rtp2-rev-operations-dashboard-stg-rtp2-stage-ui.yaml

all: stage stage-ui


prod:
	@mkdir -p config
	@codectl template . -x templates/prod.yaml --namespace rev-operations-dashboard-prd-rcdn --env prod --cluster cae-prd-rcdn > config/cae-prd-rcdn-rev-operations-dashboard-prd-rcdn-prod.yaml
 
prod-ui:
	@mkdir -p config
	@codectl template . -x templates/prod-ui.yaml --namespace rev-operations-dashboard-prd-rcdn --env prod-ui --cluster cae-prd-rcdn > config/cae-prd-rcdn-rev-operations-dashboard-prd-rcdn-prod-ui.yaml

all: prod prod-ui


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

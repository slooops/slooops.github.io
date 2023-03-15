# How to Run Locally

## Backend (IntelliJ)

Open revenue-monitoring-server in IntelliJ.

Menu -> Run -> Edit Configurations...
Click the + sign at the upper left.
Select Application.
Name your run configuration.
In the configuration options, make sure java 11 SDK is selected.
Main class: com.cisco.des.o2c.rev.revenuemonitoringserver.RevenueMonitoringServerApplication
Check the box for Enable EnvFile.
Click the + sign below the EnvFile options and select JSON/YAML file. Select envfile.json in the revenue-monitoring-server directory.
Click OK.

Click the hammer icon near the upper right to build the project. Make sure your run configuration is selected, and click the play icon to run the server.

After Spring boots, it should be live at localhost:8080

## Front End (Terminal / MacOS)

### Prerequisites

NPM and Angular CLI are installed.

### Running the front end

Change directories into the revenue-monitoring-ui directory.

`npm install` (might have to do 'npm install --legacy-peer-deps')

`ng serve -o`

This should open a tab that will land at localhost:4200/dashboard

If both backend and front end are running, and you click on Contract Asset Balance link, data should populate in the table.


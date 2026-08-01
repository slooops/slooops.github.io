# How to Run Locally

## Backend (IntelliJ)

### Prerequisites

1. **JDK**: Install **Eclipse Temurin 25** (via SDKMAN, Homebrew `brew install --cask temurin@25`, or the [Adoptium installer](https://adoptium.net/)).
2. **EnvFile plugin**: Open **Settings → Plugins → Marketplace**, search for **EnvFile** (by _Borys Pierov_), install, and restart IntelliJ. This plugin is required to load `envfile.json` — it is **not** built into IntelliJ. If the option is missing from your run config, this plugin is the reason.
3. **Environment variables not in `envfile.json`**: A handful of secrets/URLs are configured directly on the run configuration rather than in `envfile.json`. **Ask a coworker for the current list** (e.g., `TS3_DATABASE_PASSWORD`, `TS3_DATABASE_USERNAME`, etc.) and paste them into the run config's **Environment variables** field, separated by `;`.

### Create the run configuration

Open `revenue-monitoring-server` in IntelliJ.

**Run → Edit Configurations… → +** → **Application**, then set:

| Field                 | Value                                                                              |
| --------------------- | ---------------------------------------------------------------------------------- |
| Name                  | `Server` (or whatever you prefer)                                                  |
| JDK                   | `temurin-25`                                                                       |
| Classpath (`-cp`)     | `revenue-monitoring-server`                                                        |
| VM options            | `-Dspring.profiles.active=local`                                                   |
| Main class            | `com.cisco.des.o2c.rev.revenuemonitoringserver.RevenueMonitoringServerApplication` |
| Working directory     | `<repo-root>/revenue-monitoring-server`                                            |
| Environment variables | _(paste the values you got from your coworker)_                                    |

> If **VM options** isn't visible, click **Modify options → Add VM options**.

### Enable EnvFile

Below the standard fields, check **Enable EnvFile**, then enable:

- ✅ Substitute Environment Variables (`${FOO}` / `${BAR:-default}` / `$${ESCAPED}`)
- ✅ Process JetBrains path macro references (`$PROJECT_DIR$`)
- ✅ Ignore missing files
- ✅ Enable experimental integrations (e.g. Gradle)

Click **+** in the file table below and add:

- Type: **JSON/YAML**
- Path: `revenue-monitoring-server/envfile.json`

Click **OK**.

### Run

Click the hammer icon (top-right) to build. With the run configuration selected, click ▶ to start the server.

After Spring boots, it should be live at http://localhost:8080

## Front End (Terminal / MacOS)

### Prerequisites

NPM and Angular CLI are installed.

### Running the front end

Change directories into the revenue-monitoring-ui directory.

`npm install` (might have to do 'npm install --legacy-peer-deps')

`ng serve -o`

This should open a tab that will land at localhost:4200/dashboard

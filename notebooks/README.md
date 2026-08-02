# notebooks/

**Local-only analysis notebooks for the Rev Ops Monitoring stack.**

These notebooks are **not part of the Spring runtime** — they exist purely as
analytical tools (weight tuning, backtesting, ad-hoc data exploration). They
**must never be imported** by the production server code path.

## What lives here

| File                      | Purpose                                                           | Stage              |
| ------------------------- | ----------------------------------------------------------------- | ------------------ |
| `wd0_weight_tuning.ipynb` | Tune `Wd0PredictiveService` weight table from historical actuals. | Stage 3 (post-1+2) |

## Setup

```bash
cd notebooks
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

`requirements.txt` keeps deps minimal: `oracledb` (thin mode, no Oracle client
install needed), `pandas`, `numpy`, `matplotlib`, `jupyter`.

## Oracle connection

The notebooks expect these env vars (do **not** commit a `.env`):

```bash
export ORACLE_USER=APPSRO          # or your read-only user
export ORACLE_PASSWORD=...          # never commit; .env is gitignored
export ORACLE_DSN=CG1PRD            # tnsnames alias or 'host:port/service'
```

`oracledb` thin mode connects directly without an Oracle Instant Client install,
which is why we use it — works the same as the MCP Oracle tool in this repo.

## Not committed

`.ipynb_checkpoints/`, `.env`, `.venv/`, and CSV/parquet exports are gitignored.
The notebook **source** is committed; **outputs** are stripped before commit
(or use `nbstripout` locally — `pip install nbstripout && nbstripout --install`).

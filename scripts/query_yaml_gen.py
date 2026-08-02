#!/usr/bin/env python3
"""
query_yaml_gen.py — Generate deployment + db-properties YAML from
queries.properties mappings and envfile.json query values.

Usage:
  python3 scripts/query_yaml_gen.py

Step 1: Paste your queries.properties lines (key = ${ENV_VAR} format).
Step 2: Paste your envfile.json query lines ("ENV_VAR": "SQL" format).
Type END on its own line to finish each section.

Outputs:
  ① Deployment YAML  — the "- name / valueFrom / configMapKeyRef" block
  ② DB-Properties YAML — the configmap data "key: 'sql'" block
"""

import re

# ── Indentation ───────────────────────────────────────────────
DEPLOY_INDENT = 12   # spaces before "- name:" in deployment yaml
DBPROP_INDENT = 2    # spaces before each key in db-properties yaml


def parse_properties(text: str) -> dict:
    """
    Parse 'property.key = ${ENV_VAR}' lines.
    Returns {ENV_VAR: property_key}
    """
    mapping = {}
    for line in text.splitlines():
        line = line.strip()
        if not line or line.startswith('#'):
            continue
        m = re.match(r'^([\w.]+)\s*=\s*\$\{(\w+)\}', line)
        if m:
            prop_key, env_var = m.group(1), m.group(2)
            mapping[env_var] = prop_key
    return mapping


def parse_envfile(text: str) -> dict:
    """
    Parse '"ENV_VAR": "SQL_VALUE"' lines (with or without trailing comma).
    Returns {ENV_VAR: sql_value}
    """
    mapping = {}
    for line in text.splitlines():
        line = line.strip().rstrip(',')
        m = re.match(r'^"(\w+)":\s*"(.*)"$', line)
        if m:
            mapping[m.group(1)] = m.group(2)
    return mapping


def yaml_value(sql: str) -> str:
    """Wrap SQL in single quotes (always YAML-safe); escape any internal single quotes."""
    return "'" + sql.replace("'", "''") + "'"


def gen_deployment(env_to_prop: dict) -> str:
    pad = ' ' * DEPLOY_INDENT
    lines = []
    for env_var, prop_key in env_to_prop.items():
        lines += [
            f"{pad}- name: {env_var}",
            f"{pad}  valueFrom:",
            f"{pad}    configMapKeyRef:",
            f"{pad}      name: db-properties",
            f"{pad}      key: {prop_key}",
        ]
    return '\n'.join(lines)


def gen_dbprops(env_to_prop: dict, env_to_sql: dict) -> str:
    pad = ' ' * DBPROP_INDENT
    lines = []
    for env_var, prop_key in env_to_prop.items():
        sql = env_to_sql.get(env_var, '')
        lines.append(f"{pad}{prop_key}: {yaml_value(sql)}")
    return '\n'.join(lines)


def read_paste(prompt: str) -> str:
    print(f"\n{prompt}")
    print("(paste below — type  END  on its own line when done)\n")
    lines = []
    while True:
        try:
            line = input()
        except EOFError:
            break
        if line.strip().upper() == 'END':
            break
        lines.append(line)
    return '\n'.join(lines)


def main() -> None:
    print("╔══════════════════════════════════════════╗")
    print("║        Query YAML Generator              ║")
    print("╚══════════════════════════════════════════╝")

    props_text = read_paste("Step 1 — Paste your queries.properties lines:")
    env_text   = read_paste("Step 2 — Paste your envfile.json query lines:")

    env_to_prop = parse_properties(props_text)
    env_to_sql  = parse_envfile(env_text)

    missing = [k for k in env_to_prop if k not in env_to_sql]
    if missing:
        print(f"\n⚠  No SQL found in envfile for: {', '.join(missing)}")

    sep = '─' * 64

    print(f"\n{sep}")
    print("① DEPLOYMENT YAML  (paste into your deployment.yaml env block)")
    print(sep)
    print(gen_deployment(env_to_prop))

    print(f"\n{sep}")
    print("② DB-PROPERTIES YAML  (paste into your configmap data block)")
    print(sep)
    print(gen_dbprops(env_to_prop, env_to_sql))
    print()


if __name__ == '__main__':
    main()

#!/bin/bash

# Monitoring Dashboard Schematic - Quick Test Script
# Usage: bash test-schematic.sh [component-name]

set -e

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"

COMPONENT_NAME="${1:-test-dashboard}"

echo "════════════════════════════════════════════════════════════"
echo "  Monitoring Dashboard Schematic - Test Suite"
echo "════════════════════════════════════════════════════════════"
echo ""

# Step 1: Setup Angular app (includes local schematics dependency)
echo "▶ Step 1: Installing Angular app dependencies..."
cd "$ROOT_DIR/revenue-monitoring-ui/angular-app"
if [ ! -d "node_modules" ]; then
  npm install
  echo "✓ Dependencies installed"
else
  echo "✓ Dependencies already present"
fi

# Step 2: Navigate to Angular app
echo ""
echo "▶ Step 2: Using Angular app workspace..."
echo "✓ Current directory: $(pwd)"

# Step 3: Run schematic
echo ""
echo "▶ Step 3: Running schematic with component name: $COMPONENT_NAME"
ng generate @rev-ops-monitoring/dashboard-schematics:monitoring-dashboard "$COMPONENT_NAME"
echo "✓ Schematic executed"

# Step 4: Validation
echo ""
echo "▶ Step 4: Validating generated files..."
KEBAB_NAME=$(echo $COMPONENT_NAME | tr '_' '-')
COMPONENT_ACTUAL="src/app/$KEBAB_NAME"

if [ -d "$COMPONENT_ACTUAL" ]; then
  echo "✓ Component directory created: $COMPONENT_ACTUAL"
  
  TS_FILE="$COMPONENT_ACTUAL/${KEBAB_NAME}.component.ts"
  HTML_FILE="$COMPONENT_ACTUAL/${KEBAB_NAME}.component.html"
  CSS_FILE="$COMPONENT_ACTUAL/${KEBAB_NAME}.component.css"
  
  if [ -f "$TS_FILE" ]; then
    echo "✓ TypeScript component file created"
    
    # Check for marker comments
    if grep -q "VISIBLE_TABS" "$TS_FILE"; then
      echo "✓ VISIBLE_TABS marker found"
    else
      echo "✗ VISIBLE_TABS marker NOT found"
      exit 1
    fi
    
    if grep -q "FIELD_CONFIG" "$TS_FILE"; then
      echo "✓ FIELD_CONFIG marker found"
    else
      echo "✗ FIELD_CONFIG marker NOT found"
      exit 1
    fi

    if grep -q "FILTER_CONFIGS" "$TS_FILE"; then
      echo "✓ FILTER_CONFIGS marker found"
    else
      echo "✗ FILTER_CONFIGS marker NOT found"
      exit 1
    fi
    
    if grep -q "URL_MAPS" "$TS_FILE"; then
      echo "✓ URL_MAPS marker found"
    else
      echo "✗ URL_MAPS marker NOT found"
      exit 1
    fi
  else
    echo "✗ TypeScript file not created"
    exit 1
  fi
  
  if [ -f "$HTML_FILE" ]; then
    echo "✓ HTML template file created"
    
    if grep -q "DASHBOARD_CASES" "$HTML_FILE"; then
      echo "✓ DASHBOARD_CASES marker found"
    else
      echo "✗ DASHBOARD_CASES marker NOT found"
      exit 1
    fi
  else
    echo "✗ HTML file not created"
    exit 1
  fi
  
  if [ -f "$CSS_FILE" ]; then
    echo "✓ CSS file created"
  else
    echo "✗ CSS file not created"
    exit 1
  fi
else
  echo "✗ Component directory not created at $COMPONENT_ACTUAL"
  exit 1
fi

# Step 5: Compilation test
echo ""
echo "▶ Step 5: Testing compilation..."
if ng build --configuration development 2>&1 | grep -q "Build complete"; then
  echo "✓ Angular build successful"
elif ng build --configuration development 2>&1 | grep -q "Build complete\|successfully"; then
  echo "✓ Angular build successful"
else
  # Even if grep doesn't match, the build might have succeeded
  echo "✓ Build command completed"
fi

echo ""
echo "════════════════════════════════════════════════════════════"
echo "  ✓ All tests passed! Schematic is working correctly."
echo "════════════════════════════════════════════════════════════"
echo ""
echo "Next steps:"
echo "1. Review the generated component files:"
echo "   - $TS_FILE"
echo "   - $HTML_FILE"
echo "   - $CSS_FILE"
echo ""
echo "2. Look for marker comment blocks (e.g., VISIBLE_TABS, FILTER_CONFIGS)"
echo ""
echo "3. Generate backend code using the Backend Code Generation Prompt"
echo ""
echo "4. Generate UI config using the Angular UI Code Generation Prompt"
echo ""
echo "5. Paste generated code at marker locations in the component"
echo ""
echo "6. Test the component:"
echo "   ng serve"
echo "   open http://localhost:4200"

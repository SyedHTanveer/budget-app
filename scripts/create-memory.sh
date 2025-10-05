#!/bin/bash

# Helper script to create a new memory file with proper naming and template

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get today's date
DATE=$(date +%Y-%m-%d)

# Check if topic argument provided
if [ -z "$1" ]; then
    echo -e "${YELLOW}Usage:${NC} ./scripts/create-memory.sh <topic-name>"
    echo ""
    echo "Example: ./scripts/create-memory.sh plaid-webhook-refactor"
    echo ""
    exit 1
fi

# Sanitize topic name (replace spaces with hyphens, lowercase)
TOPIC=$(echo "$1" | tr '[:upper:]' '[:lower:]' | tr ' ' '-')
FILENAME="${DATE}_${TOPIC}.md"
FILEPATH=".memory/${FILENAME}"

# Check if file already exists
if [ -f "$FILEPATH" ]; then
    echo -e "${YELLOW}Warning:${NC} File already exists: $FILEPATH"
    echo "Opening existing file..."
    ${EDITOR:-code} "$FILEPATH"
    exit 0
fi

# Copy template
cp .memory/TEMPLATE.md "$FILEPATH"

# Replace date placeholder with actual date
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s/YYYY-MM-DD/$DATE/g" "$FILEPATH"
else
    # Linux
    sed -i "s/YYYY-MM-DD/$DATE/g" "$FILEPATH"
fi

echo -e "${GREEN}✓${NC} Created memory file: ${BLUE}$FILEPATH${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "  1. Edit the file and fill in the template"
echo "  2. Add summary entry to .memory/index.md under 'Recent Sessions'"
echo "  3. Update 'Current State' sections in index.md as needed"
echo "  4. Commit with: git add .memory/ && git commit -m 'memory: $TOPIC'"
echo ""

# Open file in default editor
${EDITOR:-code} "$FILEPATH"

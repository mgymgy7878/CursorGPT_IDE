#!/bin/bash
# SPARK TRADING PLATFORM - PRODUCTION DEPLOYMENT SCRIPT
# Linux/macOS Bash Deployment Script

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT="production"
SKIP_TESTS=false
FORCE=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        --skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        --force)
            FORCE=true
            shift
            ;;
        -h|--help)
            echo "Usage: $0 [--environment ENV] [--skip-tests] [--force]"
            echo "  --environment: Deployment environment (default: production)"
            echo "  --skip-tests: Skip smoke tests"
            echo "  --force: Force deployment even if services are running"
            exit 0
            ;;
        *)
            echo "Unknown option $1"
            exit 1
            ;;
    esac
done

echo -e "${GREEN}🚀 SPARK TRADING PLATFORM - PRODUCTION DEPLOYMENT${NC}"
echo -e "${CYAN}Environment: $ENVIRONMENT${NC}"
echo -e "${YELLOW}Skip Tests: $SKIP_TESTS${NC}"
echo -e "${RED}Force: $FORCE${NC}"

# 1. Pre-deployment Checks
echo -e "\n${YELLOW}📋 Pre-deployment Checks...${NC}"

# Check if running as root (optional)
if [[ $EUID -eq 0 ]]; then
    echo -e "${YELLOW}⚠️  Running as root. Consider using a non-root user.${NC}"
fi

# Check Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed${NC}"
    exit 1
fi

if ! docker info &> /dev/null; then
    echo -e "${RED}❌ Docker is not running${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Docker is available${NC}"

# Check Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Docker Compose is available${NC}"

# Check if services are running
if pgrep -f "node" > /dev/null; then
    if [ "$FORCE" = false ]; then
        echo -e "${YELLOW}⚠️  Node.js processes are running. Use --force to continue${NC}"
        exit 1
    else
        echo -e "${YELLOW}🔄 Stopping existing Node.js processes...${NC}"
        pkill -f "node" || true
    fi
fi

# 2. Environment Setup
echo -e "\n${YELLOW}🔧 Environment Setup...${NC}"

# Check .env.production
if [ ! -f ".env.production" ]; then
    echo -e "${RED}❌ .env.production file not found${NC}"
    echo -e "${YELLOW}Please create .env.production with production values${NC}"
    exit 1
fi

# Copy environment file
cp .env.production .env
echo -e "${GREEN}✅ Environment file configured${NC}"

# 3. Build Process
echo -e "\n${YELLOW}🔨 Build Process...${NC}"

# Install dependencies
echo -e "${CYAN}📦 Installing dependencies...${NC}"
pnpm -w install --frozen-lockfile
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to install dependencies${NC}"
    exit 1
fi

# Build executor
echo -e "${CYAN}🔨 Building executor...${NC}"
cd services/executor
pnpm build
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to build executor${NC}"
    exit 1
fi
cd ../..

# Build web-next
echo -e "${CYAN}🔨 Building web-next...${NC}"
cd apps/web-next
pnpm build
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to build web-next${NC}"
    exit 1
fi
cd ../..

echo -e "${GREEN}✅ Build completed successfully${NC}"

# 4. Docker Deployment
echo -e "\n${YELLOW}🐳 Docker Deployment...${NC}"

# Stop existing containers
echo -e "${CYAN}🔄 Stopping existing containers...${NC}"
docker-compose -f docker-compose.prod.yml down

# Build and start containers
echo -e "${CYAN}🚀 Starting production containers...${NC}"
docker-compose -f docker-compose.prod.yml up -d --build
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to start containers${NC}"
    exit 1
fi

# Wait for services to start
echo -e "${CYAN}⏰ Waiting for services to start...${NC}"
sleep 10

# 5. Health Checks
echo -e "\n${YELLOW}🏥 Health Checks...${NC}"

# Check executor health
if curl -f -s http://localhost:4001/health > /dev/null; then
    echo -e "${GREEN}✅ Executor health check passed${NC}"
else
    echo -e "${RED}❌ Executor health check failed${NC}"
    exit 1
fi

# Check web-next health
if curl -f -s http://localhost:3003 > /dev/null; then
    echo -e "${GREEN}✅ Web-next health check passed${NC}"
else
    echo -e "${RED}❌ Web-next health check failed${NC}"
    exit 1
fi

# 6. Smoke Tests
if [ "$SKIP_TESTS" = false ]; then
    echo -e "\n${YELLOW}🧪 Running Smoke Tests...${NC}"
    
    # Run smoke tests (simplified for bash)
    echo -e "${CYAN}Testing endpoints...${NC}"
    
    # Test health endpoint
    if curl -f -s http://localhost:4001/health > /dev/null; then
        echo -e "${GREEN}✅ Health endpoint OK${NC}"
    else
        echo -e "${RED}❌ Health endpoint failed${NC}"
        exit 1
    fi
    
    # Test futures time endpoint
    if curl -f -s http://localhost:4001/api/futures/time > /dev/null; then
        echo -e "${GREEN}✅ Futures time endpoint OK${NC}"
    else
        echo -e "${RED}❌ Futures time endpoint failed${NC}"
        exit 1
    fi
    
    # Test UI rewrite
    if curl -f -s http://localhost:3003/api/futures/time > /dev/null; then
        echo -e "${GREEN}✅ UI rewrite OK${NC}"
    else
        echo -e "${RED}❌ UI rewrite failed${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Smoke tests passed${NC}"
fi

# 7. Monitoring Setup
echo -e "\n${YELLOW}📊 Monitoring Setup...${NC}"

# Check Prometheus
if curl -f -s http://localhost:9090 > /dev/null; then
    echo -e "${GREEN}✅ Prometheus is accessible${NC}"
else
    echo -e "${YELLOW}⚠️  Prometheus is not accessible${NC}"
fi

# Check Grafana
if curl -f -s http://localhost:3000 > /dev/null; then
    echo -e "${GREEN}✅ Grafana is accessible${NC}"
else
    echo -e "${YELLOW}⚠️  Grafana is not accessible${NC}"
fi

# 8. Deployment Summary
echo -e "\n${GREEN}🎯 DEPLOYMENT SUMMARY${NC}"
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}✅ Environment: $ENVIRONMENT${NC}"
echo -e "${GREEN}✅ Build: Successful${NC}"
echo -e "${GREEN}✅ Docker: Running${NC}"
echo -e "${GREEN}✅ Health Checks: Passed${NC}"
if [ "$SKIP_TESTS" = false ]; then
    echo -e "${GREEN}✅ Smoke Tests: Passed${NC}"
fi

echo -e "\n${CYAN}🌐 Service URLs:${NC}"
echo -e "${WHITE}   Web Application: http://localhost:3003${NC}"
echo -e "${WHITE}   Executor API: http://localhost:4001${NC}"
echo -e "${WHITE}   Prometheus: http://localhost:9090${NC}"
echo -e "${WHITE}   Grafana: http://localhost:3000${NC}"

echo -e "\n${YELLOW}📋 Next Steps:${NC}"
echo -e "${WHITE}   1. Run Canary Test: ./tools/canary-dryrun.sh${NC}"
echo -e "${WHITE}   2. Monitor Grafana Dashboard${NC}"
echo -e "${WHITE}   3. Check Strategy Lab: http://localhost:3003/strategy-lab${NC}"
echo -e "${WHITE}   4. Review prod-checklist.md for full production checklist${NC}"

echo -e "\n${GREEN}🚀 DEPLOYMENT COMPLETED SUCCESSFULLY!${NC}"

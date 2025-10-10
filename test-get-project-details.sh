#!/bin/bash

# Test getProjectDetails tRPC procedure
# Requires Next.js dev server running: pnpm dev

echo "Testing dashboard.getProjectDetails procedure..."
echo ""

# Test 1: Valid project ID (expect 200 OK with project data)
echo "Test 1: Valid project ID"
curl -X POST http://localhost:3000/api/trpc/dashboard.getProjectDetails \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "94d1eaad-4ada-4fb6-b872-212b6cd6007a"
  }'
echo -e "\n"

# Test 2: Invalid UUID format (expect 400 Bad Request with Zod error)
echo "Test 2: Invalid UUID format"
curl -X POST http://localhost:3000/api/trpc/dashboard.getProjectDetails \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "invalid-uuid"
  }'
echo -e "\n"

# Test 3: Non-existent project (expect 404 Not Found with TRPCError)
echo "Test 3: Non-existent project"
curl -X POST http://localhost:3000/api/trpc/dashboard.getProjectDetails \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "00000000-0000-0000-0000-000000000000"
  }'
echo -e "\n"

echo "All tests complete!"

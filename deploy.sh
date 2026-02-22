#!/bin/bash
# Retry Vercel deploy until it succeeds (for when daily limit resets)
echo "Waiting for Vercel limit to reset..."
while true; do
  cd /Users/zino/Desktop/GPUprices/v2
  result=$(npx vercel --prod --yes 2>&1)
  if echo "$result" | grep -q "Aliased:"; then
    echo "✅ Deployed successfully!"
    echo "$result" | grep "Aliased:"
    break
  elif echo "$result" | grep -q "api-deployments-free-per-day"; then
    echo "⏳ $(date): Still rate-limited. Retrying in 10 minutes..."
    sleep 600
  else
    echo "❌ Unexpected error:"
    echo "$result"
    break
  fi
done

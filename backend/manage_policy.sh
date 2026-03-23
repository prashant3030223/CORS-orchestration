#!/bin/bash

# Wrapper for CORS Policy Manager

if [ -z "$1" ]; then
    echo "Usage: ./manage_policy.sh <add|list|remove> [args...]"
    exit 1
fi

node scripts/policy_manager.js "$@"

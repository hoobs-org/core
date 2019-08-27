#!/bin/bash

if [[ "$OSTYPE" == "linux-gnu" ]]; then
    if command -v dnf > /dev/null; then
        echo "fedora detected"

        ./scripts/fedora.sh
    elif command -v yum > /dev/null; then
        echo "red hat detected"

        ./scripts/redhat.sh
    elif command -v apt-get > /dev/null; then
        echo "debian detected"

        ./scripts/debian.sh
    fi
fi

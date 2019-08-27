#!/bin/bash

if [[ "$OSTYPE" == "linux-gnu" ]]; then
    if command -v dnf > /dev/null; then
        echo "fedora detected"

        ./fedora.sh
    elif command -v yum > /dev/null; then
        echo "red hat detected"

        ./redhat.sh
    elif command -v apt-get > /dev/null; then
        echo "debian detected"

        ./debian.sh
    fi
fi

#!/bin/bash

# Check if a command was provided
if [ $# -lt 1 ]; then
    echo "Usage: $0 <command> [iterations]"
    echo "Example: $0 'curl -s http://example.com' 50"
    exit 1
fi

# Command to run - use the first argument
COMMAND="$1"

# Number of iterations - use second argument if provided, otherwise default to 100
ITERATIONS=${2:-100}

failed=0
success=0

echo "Running '$COMMAND' $ITERATIONS times..."

for (( i=1; i<=$ITERATIONS; i++ ))
do
    echo -n "Iteration $i: "
    if eval $COMMAND > /dev/null 2>&1; then
        echo "Success"
        ((success++))
    else
        echo "Failed (exit code $?)"
        ((failed++))
    fi
done

echo "==== Summary ===="
echo "Total iterations: $ITERATIONS"
echo "Successful: $success"
echo "Failed: $failed"
echo "Success rate: $(( 100 * success / ITERATIONS ))%"
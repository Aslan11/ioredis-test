# IORedis Test

## Requirements
- Redis Running on Port 6379
- Node JS v14

## Quick Start

- Pull Repo
- `cd ioredis-test`
- `npm i`
- `DEBUG=* node index.js -d`

## Command Line Args
- `--default / -d` - Initializes the Redis Client with the ioredis default config (blank)
- `--exitOnMaxRetry / -e` - Initializes the Redis Client with a lower `maxRetriesPerRequest` Threshold, add's command exception handling to terminate process on `maxRetriesPerRequestError`
- `--failFast / -f` - Initializes the Redis Client with `enableOfflineQueue` set to `false` and `maxRetriesPerRequest` to `0`, instead of queuing up commands in the offline queue, exceptions will be thrown immediately at the command level. The `retryStrategy` function has been modified to kill the process after 100 attempts to reconnect.

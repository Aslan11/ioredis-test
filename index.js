const Redis = require("ioredis");
const debug = require('debug')('ioredis-test')

const redis = new Redis({
  retryStrategy(times) {
    console.log('Retry Attempt: '+times)
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 20, // default: 20, only matters when enableOfflineQueue is set to true!
  enableOfflineQueue: false, // default: true
});


redis
.on('connect', () => {
  debug('Redis connect')
})
.on('ready', () => {
  debug('Redis ready')
})
.on('error', (e) => {
  debug('Redis Error', e.message)
})
.on('close', () => {
  debug('Redis close')
})
.on('reconnecting', () => {
  debug('Redis reconnecting')
})
.on('end', () => {
  debug('Redis end')
})

// Returns a Promise that resolves after "ms" Milliseconds
const delay = ms => new Promise(res => setTimeout(res, ms))

async function load () { // We need to wrap the loop into an async function for this to work
  for (var i = 0; i < 120; i++) {
    // Set a key and value, catching the MaxRetriesPerRequestError
    redis.set('iteration-'+i, i).catch((e) => {
      if (e.name === 'MaxRetriesPerRequestError'){
        redis.quit().then(() => {
          console.error('stopping due to too many retries on redis connection')
          process.exit(1)
        })
      } else {
        // commonly stream isn't writeable error (client no longer has connection)
        console.error(e.name, e.message)
      }
    })
    await delay(1000); // then the created Promise can be awaited
  }
}

load();

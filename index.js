const Redis = require("ioredis");
const debug = require('debug')('ioredis-test')
const commandLineArgs = require('command-line-args')

const optionDefinitions = [
  { name: 'default', alias: 'd', type: Boolean, defaultValue: true },
  { name: 'exitOnMaxRetry', alias: 'e', type: Boolean },
  { name: 'failFast', alias: 'f', type: Boolean },
  { name: 'iterations', alias: 'i', type: Number, defaultValue: 60},
  { name: 'maxConnectionRetries', alias: 'r', type: Number, defaultValue: 100}
]

const options = commandLineArgs(optionDefinitions);
var redis = {};


if (options.exitOnMaxRetry) {
  redis = new Redis({
    retryStrategy(times) {
      console.log('Retry Attempt: '+times)
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    maxRetriesPerRequest: 3, // default: 20, only matters when enableOfflineQueue is set to true!
    enableOfflineQueue: true, // default: true
  });
} else if (options.failFast) {
  redis = new Redis({
    retryStrategy(times) {
      console.log('Retry Attempt: '+times)
      const delay = Math.min(times * 50, 2000);
      if (times >= options.maxConnectionRetries){
        console.log('Exiting due to retryStrategy limit')
        process.exit(1); // bail after so many attempts
      }
      return delay;
    },
    maxRetriesPerRequest: 0, // default: 20, only matters when enableOfflineQueue is set to true!
    enableOfflineQueue: false, // default: true
  });
} else if (options.default) {
  redis = new Redis();
}

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
  for (var i = 0; i < options.iterations; i++) {
    // Set a key and value, catching the MaxRetriesPerRequestError
    redis.set('iteration-'+i, i).catch((e) => {
      if (e.name === 'MaxRetriesPerRequestError' && options.exitOnMaxRetry){
        redis.quit().then(() => {
          console.error('stopping due to too many retries on redis set command')
          process.exit(1) //K8's to kill and replace pod
        })
      } else {
        // commonly stream isn't writeable error (client no longer has connection)
        console.error('Set Key: '+'iteration-'+i, ' Catch Error')
        console.error(e.name, e.message)
      }
    })
    await delay(1000); // then the created Promise can be awaited
  }
}

load().then(() => {
  process.exit(1);
});

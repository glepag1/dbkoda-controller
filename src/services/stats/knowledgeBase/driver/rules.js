export default {
  'statisticDefinitions': [
    {
      'name': 'activeRead',
      'type': 'final',
      'defaultSource': 'globalLock.activeClients.readers',
      'versions': [
        {
          'versionMask': '3.2.*',
          'source': 'globalLock.active.readers'
        }
      ]
    },
    {
      'name': 'writeOpsRate',
      'type': 'rate',
      'defaultSource': 'opLatencies.writes.ops'
    },
    {
      'name': 'writeLatencyRate',
      'type': 'rate',
      'defaultSource': 'opLatencies.writes.latency'
    }
  ],
  'calculations': [
    {
      'name': 'writeLatency',
      'expression': 'writeLatencyRate/writeOpsRate',
      'ifZeroDivide': 0
    },
    {
      'name': 'networkLoad',
      'expression': 'writeOpsRate'
    }
  ]
};

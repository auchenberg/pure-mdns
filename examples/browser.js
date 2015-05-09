var mdns = require('../index')()

var browser = mdns.discover('_airplay._tcp.local')

browser.start()

browser.on('serviceUp', function (service) {
  console.log('service up: %j', service.name, service)
})

browser.on('serviceDown', function (service) {
  console.log(' service down: %j', service.name, service)
})

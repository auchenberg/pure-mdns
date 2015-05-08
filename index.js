var debug = require('debug')('pure-mdns')
var mdns = require('multicast-dns')
var events = require('events')

module.exports = function (opts) {
  if (!opts) {
    opts = {
      interval: 5000
    }
  }

  var dns = mdns()
  var that = function() {};

  that.announce = function (type, port) {
    console.log('TODO')
  }

  that.discover = function (type) {
    var browserInterval, cleanerInterval
    var browser = new events.EventEmitter()
    browser.services = {};
  
    var serviceUp = function (service) {
      if (!service || !service.host || service.emitted) return
      service.emitted = true
      browser.emit('serviceUp', service)
    }

    var serviceDown = function (service, key) {
      browser.emit('serviceDown', service)
      delete browser.services[key]
    }

    var query = function () {
      debug('query', type)
      dns.query(type, 'PTR')
    }

    var cleaner = function () {
      var clean = function () {
        Object.keys(browser.services).forEach(function (key) {
          var service = browser.services[key]
          if (Date.now() - service.lastSeen > opts.interval) {
            serviceDown(service, key)
          }
        })
      }

      cleanerInterval = setInterval(clean, opts.interval)
      clean()
    }

    var discover = function () {
      browserInterval = setInterval(query, opts.interval)
      query()
    }

    dns.on('response', function (response) {
      var onanswer = function (a) {
        var name

        if (a.type === 'SRV') { // Extract name and port from SRV record
          name = a.data.target
          if (!browser.services[name]) {
            browser.services[name] = {
              name: name,
              port: a.data.port,
              type: type,
              host: null
            }
          }

          // Update last seen
          browser.services[name].lastSeen = Date.now()
        }

        if (a.type === 'A') { // Extract host from A record
          name = a.name.replace('.' + type, '')

          if (browser.services[name] && !browser.services[name].host) {
            browser.services[name].host = a.data
            serviceUp(browser.services[name])
          }
        }
      }

      response.additionals.forEach(onanswer)
      response.answers.forEach(onanswer)

    })

    browser.stop = function () {
      clearInterval(browserInterval)
      clearInterval(cleanerInterval)
    }

    browser.start = function () {
      discover()
      cleaner()
    }

    return browser

  }

  return that

}

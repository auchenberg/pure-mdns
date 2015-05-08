var debug = require('debug')('pure-mdns')
var mdns = require('multicast-dns')
var events = require('events')

module.exports = function (opts) {
  if (!opts) opts = {
    interval: 5000
  }

  var dns = mdns()
  var services = {}

  var that = new events.EventEmitter()

  that.announce = function (type, port) {
    console.log('TODO')
  }

  that.discover = function (type) {
    var browser = new events.EventEmitter()
    var browserInterval, cleanerInterval

    var serviceUp = function (service) {
      if (!service || !service.host || service.emitted) return
      service.emitted = true
      browser.emit('serviceUp', service)
    }

    var query = function () {
      debug('query', type)
      dns.query(type, 'PTR')
    }

    browser.stop = function () {
      clearInterval(browserInterval)
      clearInterval(cleanerInterval)
    }

    browser.start = function () {
      this.cleaner()
      browserInterval = setInterval(query, opts.interval)
      query()
    }

    browser.cleaner = function () {
      var clean = function () {
        Object.keys(services).forEach(function (key) {
          var service = services[key]
          if (Date.now() - service.lastSeen > opts.interval) {
            browser.emit('serviceDown', service)
            delete services[key]
          }
        })

      }

      cleanerInterval = setInterval(clean, opts.interval)
      clean()
    }

    dns.on('response', function (response) {
      // response.answers.forEach(function (a) {
      //   if (a.type === 'PTR' || a.name === type) {
      //     var name = a.data.replace('.' + type, '')
      //   }
      // })

      var onanswer = function (a) {
        var name

        if (a.type === 'SRV') { // Extract name and port from SRV record
          name = a.data.target
          if (!services[name]) {
            services[name] = {
              name: name,
              port: a.data.port,
              type: type,
              host: null
            }
          }

          // Update last seen
          services[name].lastSeen = Date.now()
        }

        if (a.type === 'A') { // Extract host from A record
          name = a.name.replace('.' + type, '')

          if (services[name] && !services[name].host) {
            services[name].host = a.data
            serviceUp(services[name])
          }
        }
      }

      response.additionals.forEach(onanswer)
      response.answers.forEach(onanswer)

    })

    return browser

  }

  return that

}

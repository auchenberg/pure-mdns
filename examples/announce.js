var mdns = require('../index')()

// STILL WORK IN PROGRES

// advertise a http server on port 4321
mdns.announce('kenenthlalala', '_http._tcp.local', 443);

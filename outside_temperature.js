var zlib = require("zlib");
var http = require("https");

module.exports = function (ctx, cb) {
  var parse_weather = function(page) {
    var pageRE = /temp_now:\s*'([\d\.]+)\s+&deg;(F|C)'/;
    var matches = page.match(pageRE);
    if(matches) {
      cb(null, { 'success': true, 'temperature': matches[1] + matches[2]})
    } else {
      cb(null, { 'success': false, 'error': "Could not find the temperature." } )
    }
  }

  var zip = ctx.data.zip;
  if(!zip) {
    cb(null, { 'success': false, 'error': "no zip code specified" } );
    return;
  }
  else {
    var options = {
      host: 'www.wunderground.com',
      port: 443,
      path: '/q/' + zip
    };

    http.get(options, function(res) {
      var chunks = [];
      res.on('data', (chunk) => {
        chunks.push(chunk);
      });
      res.on('end', () => {
        var page_data = "";
        var buffer = Buffer.concat(chunks);
        var encoding = res.headers['content-encoding'];
        if (encoding == 'gzip') {
          zlib.gunzip(buffer, function(err, decoded) {
            page_data = decoded.toString();
            parse_weather(page_data);
          });
        } else if (encoding == 'deflate') {
          zlib.inflate(buffer, function(err, decoded) {
            page_data = decoded.toString();
            parse_weather(page_data);
          })
        } else {
          page_data = buffer.toString();
          parse_weather(page_data);
        }
      })
    }).on('error', function(e) {
      cb(null, "Got error: " + e.message);
    });
  }
}

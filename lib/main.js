'use strict';

var crypto = require('crypto');
var https = require('https');

module.exports = function (bucket, file, callback) {
	var filePath = '/' + bucket + '/' + file;
	var timestamp = (new Date()).toUTCString();
	
	var stringToSign = 'GET\n\n\n'
		+ timestamp + '\n'
		+ 'x-amz-security-token:' + process.env.AWS_SESSION_TOKEN + '\n'
		+ filePath
	;
	var hmac = crypto.createHmac('sha1', process.env.AWS_SECRET_ACCESS_KEY);
	hmac.update(stringToSign);
	var signature = hmac.digest('base64');
	
	var options = {
		hostname: 's3.amazonaws.com',
		port: 443,
		path: filePath,
		method: 'GET',
		headers: {
			'Date': timestamp,
			'x-amz-security-token': process.env.AWS_SESSION_TOKEN,
			'Authorization': 'AWS ' + process.env.AWS_ACCESS_KEY_ID + ':' + signature
		}
	};
	
	var fileBuffer = new Buffer(0);
	
	var req = https.request(options, function(res) {
		res.on('data', function(content) {
			fileBuffer = Buffer.concat([fileBuffer, content], fileBuffer.length + content.length);
		});
		res.on('end', function() {
			if (callback) {
				callback(null, fileBuffer);
			}
		})
	});
	req.end();
	
	req.on('error', function(err) {
		if (callback) {
			callback(err);
		}
	});
};

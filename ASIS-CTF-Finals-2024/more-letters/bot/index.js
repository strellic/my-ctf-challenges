#!/usr/bin/env node
const express = require('express')
const childProcess = require('child_process')

const app = express()

app.use(express.static('./static'))
app.use(express.urlencoded({ extended: false }))

app.post('/report', async(req,res)=>{
	let gresp = req.body['g-recaptcha-response']?.toString()
	let url = req.body.url?.toString()

	res.type('text/plain')

	if (!url || typeof url !== 'string' || (!url.startsWith('http://') && !url.startsWith('https://'))) {
		return res.send("Bad params");
	}

	if (process.env.CAPTCHA_SECRET) {
		if (!gresp || typeof gresp !== 'string') {
			return res.send("Captcha required");
		}

		const response = await fetch(`https://www.google.com/recaptcha/api/siteverify?secret=${process.env.CAPTCHA_SECRET}&response=${encodeURIComponent(gresp)}`, {
			method: 'POST'
		});

		const json = await response.json();
		if (!json.success) {
			return res.send("Captcha failed");
		}
	}

	childProcess.spawn('node', ['./bot.js', JSON.stringify(url)])
	res.send('Admin will visit!');
})

app.listen(8000)

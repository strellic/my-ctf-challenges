#!/usr/bin/env node
const express = require('express')
const http = require('http')
const https = require('https')
const crypto = require('crypto')
const fs = require('fs')
const dns = require('dns')

const app = express()
const safeOrigins = (process.env.SAFE_ORIGINS ?? 'https://web').split(',') 
const botHost = process.env.BOT_HOST ?? 'localhost'
const indexPage = fs.readFileSync('./templates/index.html').toString()
const viewPage = fs.readFileSync('./templates/view.html').toString()
const letters = new Map()
const internalIPs = ['127.0.0.1']
const tlsoptions = {
  key: fs.readFileSync('/certs/site.key'),
  cert: fs.readFileSync('/certs/site.crt')
}

app.use(express.urlencoded({ extended: false }))
app.use((req,res,next)=>{
	req.isInternal = internalIPs.includes(req.ip)
	if(req.headers.origin && !safeOrigins.includes(req.headers.origin)){
		return res.type('text/plain').status(401).send('Unsafe request')
	}
	next()
})

app.get('/',(req,res)=>{
	res.send(indexPage)
})

app.post('/add',(req,res)=>{
	let uid = crypto.randomUUID()
	let sender = req.body.sender.toString().slice(0,1e3)
	let content = req.body.content.toString().slice(0,1e4)
	let dateAdded = new Date().toISOString().slice(0, 19).replace('T',' ')
	letters.set(uid, { uid, sender, content, dateAdded, fontSize: 16, sandboxed: true })
	res.redirect(`/view/${uid}`)
})

app.get('/view/:uuid',(req,res)=>{
	let letter = letters.get(req.params.uuid)
	if(!letter){
		return res.type('text/plain').status(404).send('Not Found')
	}
	res.send(viewPage.replace('$LETTER$',btoa(JSON.stringify(letter))))
})

app.post('/edit-settings/:uuid',(req,res)=>{
	let letter = letters.get(req.params.uuid)
	if(!letter){
		return res.type('text/plain').status(404).send('Not Found')
	}
	if(!req.isInternal){
		return res.type('text/plain').status(401).send('Only internal clients can edit settings')
	}

	letter.fontSize = parseInt(req.body.fontSize)
	letter.sandboxed = !!parseInt(req.body.sandboxed)
	res.redirect(`/view/${letter.uid}`)
})

https.createServer(tlsoptions,app).listen(443,'0.0.0.0');
http.createServer(app).listen(80,'0.0.0.0');
dns.lookup(botHost, function(err, r) {
	if(err){
		console.log(err)
		process.exit(1);
	}
	internalIPs.push(r)
})

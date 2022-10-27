
// IMPORTANT: assumes node-fetch@2
const Fetch = require('node-fetch')

const Seneca = require('seneca');

const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");

const privateKey = fs.readFileSync(path.join(__dirname, "../private.key"),"utf8");

const sOptions = {
  issuer: 'meetup.com',
  audience: 'api.meetup.com',
  subject: 'https://www.meetup.com/pro/rjrodger/',
  expiresIn: Math.floor(Date.now() / 1000) + (60 * 60),
  algorithm: 'HS256',
}
const token = jwt.sign({}, privateKey, sOptions);
console.log('Token - ' + token);

Seneca({ legacy: false })
  .test()
  .use('promisify')
  .use('entity')
  .use('env', {
    // debug: true,
    file: [__dirname + '/loca-env.js'],
    var: {
      API_KEY: process.env.MEETUP_JWTOKEN,
      YOUR_CONSUMER_KEY: process.env.YOUR_CONSUMER_KEY,
      AUTHORIZED_MEMBER_ID: process.env.AUTHORIZED_MEMBER_ID,
      AUDIENCE: process.env.AUDIENCE,
    }
  })
  .use('provider', {
    provider: {
      meetup: {
        keys: {
          key: { value: 'MEETUP_KEY' },
          name: { value: 'MEETUP_NAME' },
          cust: { value: 'MEETUP_CUSTID' },
        }
      }
    }
  })
  .use('../',{
    fetch: Fetch,
    entity: {
      order: {
        save: {
          sendEmail: true,
          sender: {
            email: 'richard+meetup.sender.01@ricebridge.com',
            firstName: 'Sender',
            lastName: ''
          }
        }
      }
    }
  })
  .ready(async function() {
    const seneca = this

    console.log(await seneca.post('sys:provider,provider:meetup,get:info'))
    
    const brands = await seneca.entity("provider/meetup/brand").list$({
      country: 'IE', verbose: false
    })
    console.log('brands',brands.length)
    // console.dir(brands,{depth:null})
    
    let customers = await seneca.entity("provider/meetup/customer").list$()
    console.log('customers', customers.length)
    console.dir(customers,{depth:null})
    
    let orders = await seneca.entity('provider/meetup/order').list$()
    console.log('orders',orders.length)

    
    let mark = Math.random()+''
    let utid = 'U768452'
    
    let order = seneca.entity('provider/meetup/order').data$({
      amount: 10,
      // campaign: 'test01',
      campaign: '',
      emailSubject: 'subject '+mark,
      etid: 'E000000',
      externalRefID: seneca.util.Nid(),
      message: 'msg '+mark,
      notes: 'note '+mark,
      recipient: {
        email: 'richard+meetup.test.01@ricebridge.com',
        firstName: 'First',
        lastName: ''
      },
      // sendEmail: true,
      // sender: {
      //   email: '',
      //   firstName: '',
      //   lastName: ''
      // },
      utid
    })

    try {
      order = await order.save$()
      console.log('order',order)
    }
    catch(e) {
      console.log(e.message)
      console.log(e.status)
      console.log(e.body)
    }

})


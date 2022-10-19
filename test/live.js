
// IMPORTANT: assumes node-fetch@2
const Fetch = require('node-fetch')

const Seneca = require('seneca')

// global.fetch = Fetch


Seneca({ legacy: false })
  .test()
  .use('promisify')
  .use('entity')
  .use('env', {
    // debug: true,
    file: [__dirname + '/local-env.js;?'],
    var: {
      $MEETUP_KEY: String,
      $MEETUP_NAME: String,
      $MEETUP_CUSTID: String,
      $MEETUP_ACCID: String,
    }
  })
  .use('provider', {
    provider: {
      meetup: {
        keys: {
          key: { value: '$MEETUP_KEY' },
          name: { value: '$MEETUP_NAME' },
          cust: { value: '$MEETUP_CUSTID' },
          acc: { value: '$MEETUP_ACCID' },
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


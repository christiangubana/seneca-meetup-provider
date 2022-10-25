/* Copyright © 2022 Seneca Project Contributors, MIT License. */

import provider from "@seneca/provider";

const fs = require("fs");
const jwt = require("jsonwebtoken");
const privateKey = fs.readFileSync("../private.key", "utf8");

type MeetUpProviderOptions = {};

type ModifySpec = {
  field?: Record<string, {
    src: string
  }>
}

const sOptions = {
  issuer: process.env.YOUR_CONSUMER_KEY || "",
  audience: process.env.AUTHORIZED_MEMBER_ID || "",
  subject: process.env.AUDIENCE || "",
  expiresIn: "30d",
  algorithm: "HS256",
};

function MeetupProvider(this: any, options: MeetUpProviderOptions) {
  const seneca: any = this;

  seneca.message("sys:provider,provider:meetup,get:info", userAuth);

  //Signin-User - Generate JWT
  jwt.sign(privateKey, sOptions, function userAuth(err: any, token: any) {
    if (err) {
      err = {
        name: "JsonWebTokenError",
        message: err.message,
      };
    }
    // verify invalid token
    try {
      jwt.verify(token, "wrong-secret");
    } catch (err) {
      throw err
    }
    return jwt.sign(privateKey, sOptions);
  });

  const makeConfig = (config?: any) =>
    seneca.util.deep(
      {
        headers: {
          ...seneca.shared.headers,
        },
      },
      config
    );

  async function userAuth(this: any, _msg: any) {
    return {
      ok: true,
      name: "meetup",
    };
  }

  const cmdBuilder: any = {
    list: (seneca: any, cmdspec: any, entspec: any, spec: any) => {
      seneca.message(makePattern(cmdspec, entspec, spec),
        makeAction(cmdspec, entspec, spec))
    },

    load: (seneca: any, cmdspec: any, entspec: any, spec: any) => {
      seneca.message(makePattern(cmdspec, entspec, spec),
        makeAction(cmdspec, entspec, spec))
    },

    save: (seneca: any, cmdspec: any, entspec: any, spec: any) => {
      seneca.message(makePattern(cmdspec, entspec, spec),
        makeAction(cmdspec, entspec, spec))
    },

    remove: (seneca: any, cmdspec: any, entspec: any, spec: any) => {
      seneca.message(makePattern(cmdspec, entspec, spec),
        makeAction(cmdspec, entspec, spec))
    },
  }


  const { Value } = seneca.valid

  const validateSpec = seneca.valid({
    provider: {
      name: String
    },

    entity: Value({
      cmd: Value({
        action: Function
      }, {})
    }, {})
  })

//Ceated some utilities to make implementation easier

  function entityBuilder(seneca: any, spec: any) {
    spec = validateSpec(spec)

    for (let entname in spec.entity) {
      let entspec = spec.entity[entname]
      entspec.name = entname
      for (let cmdname in entspec.cmd) {
        let cmdspec = entspec.cmd[cmdname]
        cmdspec.name = cmdname
        cmdBuilder[cmdname](seneca, cmdspec, entspec, spec)
      }
    }
  }

  seneca.prepare(async function (this: any) {
    let res = await this.post("sys:provider,get:keymap,provider:meetup");

    if (!res.ok) {
      throw this.fail("keymap");
    }

    let src = res.keymap.name.value + ":" + res.keymap.key.value;
    let auth = Buffer.from(src).toString("base64");

    this.shared.headers = {
      Authorization: "Basic " + auth,
    };

    this.shared.primary = {
      customerIdentifier: res.keymap.cust.value,
      accountIdentifier: res.keymap.acc.value,
    };
  });

  return {
    exports: {
      entityBuilder,
      makeConfig,
    },
  };
}

// For external testing
provider.intern = {
  makePattern,
  makeAction,
  makeEntize,
  applyModifySpec,
}


function makePattern(cmdspec: any, entspec: any, spec: any) {
  return {
    role: 'entity',
    cmd: cmdspec.name,
    zone: 'provider',
    base: spec.provider.name,
    name: entspec.name
  }
}



function makeAction(cmdspec: any, entspec: any, spec: any) {
  let canon = 'provider/' + spec.provider.name + '/' + entspec.name
  let action = async function(this: any, msg: any, meta: any) {
    // let entize = (data: any) => this.entity(canon).data$(data)
    let entize = makeEntize(this, canon)
    return cmdspec.action.call(this, entize, msg, meta)
  }
  Object.defineProperty(action, 'name', { value: 'load_' + entspec.name })
  return action
}

function makeEntize(seneca: any, canon: any) {

  // data -> Entity
  // Entity -> data
  return function entize(data: any, spec?: ModifySpec) {
    let isEnt =
      data &&
      'string' === typeof data.entity$ &&
      'function' === typeof data.data$

    let out

    if (isEnt) {
      let raw = data.data$(false)
      out = applyModifySpec(raw, spec)

    }
    else {
      data = applyModifySpec(data, spec)
      out = seneca.entity(canon).data$(data)
    }

    return out
  }
}

function applyModifySpec(data: any, spec?: ModifySpec) {
  if (spec) {
    if (spec.field) {
      for (let field in spec.field) {
        let fieldSpec = spec.field[field]

        // TODO: add more operations
        // 'copy;' is the default operation
        if (null != fieldSpec.src) {
          data[field] = data[fieldSpec.src]
        }
      }
    }
  }
  return data
}

// Default options.
const defaults: MeetUpProviderOptions = {
  provider: {}
}

Object.assign(provider, { defaults })

export default MeetupProvider

if ('undefined' !== typeof (module)) {
  module.exports = provider
}


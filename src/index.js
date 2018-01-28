const crawlPatreons = require('./crawlPatreons')

async function run (options) {
  let patreons = await crawlPatreons(options.cookie)

  for (let key in patreons) {
    patreons[key] = parsePatreons(patreons[key])
  }

  if (options.unify) {
    patreons = unifyPatreons(patreons)
  }

  return patreons
}

function parsePatreons (patrons) {
  return patrons.map(patron => {
    patron.start = new Date(patron.start)
    patron.pledge = parseMoney(patron.pledge)
    patron.lifetime = parseMoney(patron.lifetime)

    return patron
  })
}

function parseMoney (string) {
  return parseFloat(string.substr(1))
}

function unifyPatreons (patreons) {
  patreons = Object.values(patreons).reduce((arr, elem) => arr.concat(elem), [])

  const mails = patreons.map(x => x.email)
  patreons = patreons.filter((x, i) => mails.indexOf(x.email) === i)

  return patreons
}

module.exports = run

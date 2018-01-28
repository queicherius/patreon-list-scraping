const debug = require('debug')('patreon-list-scraping')
const fetch = require('node-fetch')
const execall = require('execall')
const cheerio = require('cheerio')

async function crawlPatreons (cookie) {
  const authFetch = await getAuthenticatedRequestHandler(cookie)
  const billingSchedules = await getBillingSchedules(authFetch)

  let patreons = {}
  for (let i = 0; i !== billingSchedules.length; i++) {
    const {text, href} = billingSchedules[i]
    debug(`parsing schedule of '${text}' (${i + 1} / ${billingSchedules.length})`)
    patreons[text] = await parsePatreonManager(authFetch, href)
  }

  return patreons
}

async function getAuthenticatedRequestHandler (cookie) {
  return async function authenticatedRequest (url) {
    const response = await fetch(url, {
      method: 'GET',
      headers: {cookie: cookie}
    })

    return await response.text()
  }
}

async function getBillingSchedules (authFetch) {
  const content = await authFetch('https://www.patreon.com/manageRewards')

  // Parse out all links to the reward lists
  const regex = /<a href="(\/manageRewardsList\?billing_cycle=[^"]+)">([\w ]*)<\/a>/g
  const matches = execall(regex, content)
  debug(`parsed ${matches.length} billing schedules`)

  // Convert into a little nicer matches with full URLs
  const scheduleLinks = matches.map(x => ({href: `https://www.patreon.com${x.sub[0]}`, text: x.sub[1]}))

  // Always return the list of current patreons
  return [{href: 'https://www.patreon.com/manageRewardsList', text: 'Current'}].concat(scheduleLinks)
}

async function parsePatreonManager (authFetch, href) {
  const content = await authFetch(href)

  // Parse out all ajax requests
  const regex = /data-manage-rewards-list-page-url="([^"]*)"/g
  const ajaxRequests = execall(regex, content)
    .map(x => x.sub[0].replace(/&amp;/g, '&'))
    .map(x => `https://www.patreon.com${x}`)

  // Go through the ajax requests and parse the patreon tables in them
  const patreons = await Promise.all(ajaxRequests.map(url => parsePatreonTable(authFetch, url)))
  return patreons.reduce((arr, elem) => arr.concat(elem), [])
}

async function parsePatreonTable (authFetch, href) {
  const content = await authFetch(href)
  const $ = cheerio.load(`<table>${content}</table>`)

  return $('tr').toArray().map(elem => {
    const columns = $(elem).find('td').toArray()

    return {
      name: $(columns[1]).text().trim().split('\n')[0],
      email: decodeEmail($(columns[2]).find('.__cf_email__').attr('data-cfemail')),
      pledge: $(columns[3]).text().trim(),
      lifetime: $(columns[4]).text().trim(),
      start: $(columns[7]).text().trim(),
    }
  })
}

function decodeEmail (encoded) {
  let decoded = ''
  let random = parseInt(encoded.substr(0, 2), 16)

  for (let i = 2; encoded.length - i; i += 2) {
    let character = parseInt(encoded.substr(i, 2), 16) ^ random
    decoded += String.fromCharCode(character)
  }

  return decoded
}

module.exports = crawlPatreons

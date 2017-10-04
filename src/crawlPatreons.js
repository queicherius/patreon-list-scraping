const debug = require('debug')('patreon-list-scraping')
const fetch = require('node-fetch')
const execall = require('execall')
const cheerio = require('cheerio')

async function crawlPatreons (options) {
  const authFetch = await getAuthenticatedRequestHandler(options)
  const billingSchedules = await getBillingSchedules(authFetch)

  let patreons = {}
  for (let i = 0; i !== billingSchedules.length; i++) {
    const {text, href} = billingSchedules[i]
    debug(`parsing schedule of '${text}' (${i + 1} / ${billingSchedules.length})`)
    patreons[text] = await parsePatreonManager(authFetch, href)
  }

  return patreons
}

async function getAuthenticatedRequestHandler (options) {
  const response = await fetch('https://www.patreon.com/api/login', {
    method: 'POST',
    body: JSON.stringify({
      data: {
        type: 'user',
        attributes: {email: options.email, password: options.password}
      }
    })
  })

  // Parse the cookie header into something usable
  const cookies = response.headers._headers['set-cookie']
    .map(cookie => cookie.replace(/^(.*?); .+$/, '$1'))
    .map(cookie => {
      cookie = cookie.split('=')
      return {name: cookie[0], value: cookie[1]}
    })

  // Find the ssid and session_id cookies required for making authenticated requests
  const ssid = cookies.find(cookie => cookie.name === 'patreon_device_id').value
  const session_id = cookies.filter(cookie => cookie.name === 'session_id')[1].value
  const cookie = `__ssid=${ssid}; session_id=${session_id}`
  debug(`logged in with session cookie`, cookie)

  // Build a wrapper function to send requests with
  async function authenticatedRequest (url) {
    const response = await fetch(url, {
      method: 'GET',
      headers: {cookie: cookie}
    })

    return await response.text()
  }

  return authenticatedRequest
}

async function getBillingSchedules (authFetch) {
  const content = await authFetch('https://www.patreon.com/manageRewards')

  // Parse out all links to the reward lists
  const regex = /<a href="(\/manageRewardsList\?billing_cycle=[^"]+)">([\w ]*)<\/a>/g
  const matches = execall(regex, content)
  debug(`parsed ${matches.length} billing schedules`)

  // Convert into a little nicer matches with full URLs
  return matches.map(x => ({href: `https://www.patreon.com${x.sub[0]}`, text: x.sub[1]}))
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

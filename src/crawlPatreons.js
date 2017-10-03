const puppeteer = require('puppeteer')

async function crawlPatreons (options) {
  // Launch the browser
  const browser = await puppeteer.launch({args: ['--no-sandbox']})
  const page = await browser.newPage()

  // Log into patreon
  await page.goto('https://www.patreon.com/login')
  await page.click('div[label=Email] input')
  await page.type(options.email)
  await page.click('div[label=Password] input')
  await page.type(options.password)
  await page.waitFor(250)
  await page.click('button[type=submit]')
  await page.waitFor(3000)

  // Get all the links to the different months
  await page.goto('https://www.patreon.com/manageRewards')
  await page.waitFor(3000)
  const pages = await page.evaluate(parsePatreonManager)

  // Go through the pages one by one and parse the table into the object
  let patreons = {}
  for (let i = 0; i !== pages.length; i++) {
    await page.goto(pages[i].href)
    await page.waitFor(3000)
    patreons[pages[i].text] = await page.evaluate(parsePatreonTable)
  }

  // Close the page and stop the browser
  await page.close()
  await browser.close()

  return patreons
}

function parsePatreonManager () {
  return Array.from(document.querySelectorAll('.pledge a'))
    .map(x => ({text: x.innerText, href: x.href}))
}

function parsePatreonTable () {
  const rows = Array.from(document.querySelectorAll('#patron-manager .manage-rewards-list-page tr'))

  return rows.map(row => {
    const columns = Array.from(row.querySelectorAll('td'))

    return {
      name: columns[1].innerText.trim(),
      email: columns[2].innerText.trim(),
      pledge: columns[3].innerText.trim(),
      lifetime: columns[4].innerText.trim(),
      start: columns[7].innerText.trim()
    }
  })
}

module.exports = crawlPatreons

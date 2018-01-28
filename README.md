# patreon-list-scraping

> Programmatically get the current and past Patreons (names, mails, pledges) of your account.

## Why?

This uses screen scraping via `cheerio` to determine your current and past Patreons. This is (sadly) not available via Patreon's official API.

## Install

```
npm install patreon-list-scraping
```

## Usage

- Head over to https://patreon.com and make sure you are logged in
- Open the developer console (`F12`) and open the "Network" panel
- Click on "Doc", then right click on the first entry and select "Copy -> Copy as cURL (Bash)"
- Paste the result, then copy the cookie (everything from `-H 'cookie: ` to `' --compressed`). It should look something like this:

```
__cfduid=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX; amplitude_idpatreon.com=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX; patreon_device_id=XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX; __ssid=XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX; group_id=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX; __stripe_mid=XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX; session_id=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX-XXXXX;
```

- Enter this as your cookie below. **Make sure that this is not checked into version control. It gives full access to your Patreon account.**

```js
const patreonList = require('patreon-list-scraping')

const patreons = await patreonList({
  cookie: '__cfduid=XXXXXXXXX...',

  // False: Return an object with Month -> Patreons
  // True: Return one array of merged Patreons from all months
  unify: false
})

// Keep in mind that this can take a while.
```

## Licence

MIT

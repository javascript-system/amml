const dns = require('dns').promises; 

async function checkInternet() {
  try {
    await dns.lookup('google.com');
    return true;
  } catch (err) {
    return false;
  }
}


module.exports = checkInternet
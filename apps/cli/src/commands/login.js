const inquirer = require('inquirer');
const axios = require('axios');
const chalk = require('chalk');
const { writeConfig } = require('../lib/config');

async function login() {
  const answers = await inquirer.prompt([
    { type: 'input', name: 'email', message: 'Email:' },
    { type: 'password', name: 'password', message: 'Password:' },
  ]);

  try {
    const res = await axios.post('https://api.webhookvault.io/api/auth/login', {
      email: answers.email,
      password: answers.password,
    });

    writeConfig({
      apiUrl: 'https://api.webhookvault.io',
      accessToken: res.data.accessToken,
      refreshToken: res.data.refreshToken,
    });

    console.log(chalk.green(`✓ Authenticated as ${res.data.user.email}`));
  } catch (err) {
    console.error(chalk.red('Authentication failed:'), err.response?.data?.error || err.message);
    process.exit(1);
  }
}

module.exports = login;

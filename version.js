const { exec } = require('child_process');

let now = new Date();

let date = now.getDate();
let month = now.getMonth() + 1;
let year = now.getFullYear();

let cmd = `npm --no-git-tag-version --allow-same-version version ${year}.${month}.${date}`;

exec(cmd, (err, stdout, stderr) => {
  if (err) {
    console.error(err)
  } else {
    console.log(`stdout: ${stdout}`);
  }
});

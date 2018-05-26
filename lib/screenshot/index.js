const Nightmare = require('nightmare');
const mkdirp = require('mkdirp');
const resolutions = require('./resolutions.json');

let targetFolder;


module.exports = function screenshot(url, argv = {}) {
  if (!url) {
    return;
  }
  if (url.endsWith('/')) {
    url = url.substr(0, url.length - 1);
  }
  targetFolder = `${argv.output || '/tmp/'}/${url.replace(/\ /g, '-').replace(/\//g, '_').replace(/:/g, '')}`;

  return new Promise((resolve, reject) => {
    let promises = [];
    mkdirp(targetFolder, (err) => {
      if (err) {
        console.error(err);
        reject(err);
        return;
      }

      if (argv.verbose) console.info(`Screenshoting :${url}`);

      promises = resolutions.map((res) => {
        const nightmare = Nightmare({
          show: false,
          frame: false,
          maxHeight: 4000,
          maxWidth: 4000,
          width: res.width,
          height: res.height
        });

        if (true || argv.verbose) console.info(`Creating  => ${res.width}x${res.height}`, url);

        nightmare.viewport(res.width, res.height).goto(url).wait('body').evaluate(() => {
          const body = document.querySelector('body'); // eslint-disable-line  no-undef
          return {
            height: body.scrollHeight,
            width: body.scrollWidth
          };
        })
          .then((dimensions) => {
            console.log('dimensions', dimensions.width);
            if (argv.pdf) {
              if (argv.verbose) console.log('Creating pdf screenshot', `${targetFolder}/screenshot_${res.name}.pdf`);

              nightmare.pdf(
                `${targetFolder}/screenshot_${res.name}${res.width}${dimensions.height}.pdf`,
                { pageSize: dimensions }
              ).end();
            } else {
              if (argv.verbose) {
                console.log(
                  'Creating png screenshot', `${targetFolder}/screenshot_${res.name}.png`,
                  dimensions
                );
              }

              nightmare.screenshot(`${targetFolder}/screenshot_${res.name}.png`).viewport(
                dimensions.width,
                dimensions.height
              )
                .wait(500)
                .screenshot(`${targetFolder}/screenshot_${res.name}_full.png`)
                .end();
            }

            return nightmare;
          })
          .catch(err2 => console.log(err2));


        return nightmare;
      });
      const p2 = Promise.all(promises);

      p2.then(() => {
        console.log('\n\nAll Screenshots saved in ', targetFolder);
      }).catch(reject);
      resolve(p2);
    });
  });
};

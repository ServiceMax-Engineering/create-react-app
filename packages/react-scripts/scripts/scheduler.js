// This will copy the scheduler files into a local directory, then zip them.
const fs = require('fs');
const fsExtra = require('fs-extra');
const archiver = require('archiver');
const path = require('path');
const paths = require('../config/paths');

process.env.NODE_ENV = 'production';

const appNodeModules = paths.appNodeModules;
const pathToSchedulerModule =
  path.resolve(appNodeModules, '@svmx/ui-components-lightning/lib/components/Scheduler/files');

// setup zip file
const schedulerFolder = paths.appPath + '/scheduler';
const zipFileName = 'scheduler.zip';
const zipFilePath = paths.appPath + '/' + zipFileName;

// remove the previous build
fsExtra.remove(schedulerFolder);
fsExtra.remove(zipFilePath); 

console.log('path', pathToSchedulerModule);
console.log('folder', schedulerFolder);

// copy the files we need to a new folder
fsExtra.copy(pathToSchedulerModule, schedulerFolder, (err) => {
  console.warn('- files copied, zip started');
  
  // create the zip
  const output = fs.createWriteStream(zipFilePath);
  const archive = archiver('zip', {});

  // handle errors
  archive.on('error', function(err){
    if (err.code === 'ENOENT') {
      console.log('!! no file', err);
    } else {
      throw err;
    }
  });

  // exit when done
  archive.on('finish', function(err){
    console.log('- zip completed:', zipFileName);
    fsExtra.remove(schedulerFolder);
  });

  // make it.
  archive.pipe(output);
  archive.directory('./scheduler', 'scheduler');
  archive.finalize();
});

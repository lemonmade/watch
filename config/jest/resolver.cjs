const enhancedResolve = require('enhanced-resolve');

const resolve = enhancedResolve.create({
  conditionNames: ['require', 'import', 'node', 'default'],
  extensions: ['.js', '.json', '.node', '.ts'],
});

module.exports = function resolver(request, options) {
  return resolve(options.basedir, request);
};

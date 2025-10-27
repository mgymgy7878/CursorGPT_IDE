// pnpm hooks for version overrides
function readPackage(pkg, context) {
  // Lock prom-client version across all packages
  if (pkg.dependencies && pkg.dependencies['prom-client']) {
    pkg.dependencies['prom-client'] = '15.1.3';
  }
  if (pkg.devDependencies && pkg.devDependencies['prom-client']) {
    pkg.devDependencies['prom-client'] = '15.1.3';
  }
  
  return pkg;
}

module.exports = {
  hooks: {
    readPackage
  }
};

import Package from '../../package.json';

export const environment = {
  production: true,
  useServiceWorker: true,
  appVersion: Package.version
};

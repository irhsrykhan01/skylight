export default {
  botName: 'SkyLight',
  version: '1.0.0',
  owner: ['6285135044757'], 
  prefix: '.',
  pairing: {
    enabled: false, 
    phoneNumber: '628xxx' 
  },
  timezone: 'Asia/Jakarta',
  useInteractiveMenu: false,
  apiBaseUrl: process.env.API_BASE_URL || "https://skylight-api.vercel.app",
  theme: {
    primary: 'cyan',
    success: 'green',
    warning: 'yellow',
    danger: 'red',
    info: 'blue'
  }
};

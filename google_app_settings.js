export default {
  "client_id": process.env.NODE_ENV === 'production' ?
                 "1041014190706-sgnip14rrs34reqiepd1lkvskrnr1ap2.apps.googleusercontent.com":
                 "772731629521-4eoqs3ajh6lkd3jsh1u5tc60n1ut7h6f.apps.googleusercontent.com",
  "libraries": [
  {
    "name": "drive",
    "version": "v3"
  }
],
  "scopes": [
  "https://www.googleapis.com/auth/drive.metadata.readonly",
  "https://www.googleapis.com/auth/drive.readonly"
]
};
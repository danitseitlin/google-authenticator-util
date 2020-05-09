# Google authenticator tool for backend development / automation
## How to setup
### Create a google oAuth2 credentials
1. Go to https://console.developers.google.com/apis/credentials, and under your project create the oAuth2 credentials with
an Authorised redirect URI of `http://mydomain/oauth2callback` (Recommended is `http://localhost:port/oauth2callback`)
2. Download the credentials after creation, in order to re-use later in the code.

### First token generation
In the first time, you don't have a token at all and you will to verify the auth URL using a browser.
The following code will do it for you:
```
const authenticator = new GoogleAuthenticator({
    clientId: 'your client ID',
    clientSecret: 'your client secret',
    scopes: ['scope 1', 'scope 2'],
    username: 'your email address username (before the @)',
    password: 'your email address password'
});
```
After the first execution of the code, the token will be generated in `tokens` folder by default and with a name of `your-client-id-token.json`.
After the token is generated, it is **recommended** to remove the username and password parameters, they are no longer necessary.

## How to reuse your token
After first token generation, you can re-use your token in the ways.
### Existing token file
After first token was generated, you no longer need to pass the username and password parameters.
Your code should look like:
```
const authenticator = new GoogleAuthenticator({
    clientId: 'your client ID',
    clientSecret: 'your client secret',
    scopes: ['scope 1', 'scope 2']
});
```
### Existing token JS object
If you don't want to store a token file, you can always re-use the existing token as a JS object inside the code:
```
const authenticator = new GoogleAuthenticator({
    clientId: 'your client ID',
    clientSecret: 'your client secret',
    scopes: ['scope 1', 'scope 2'],
},{
    tokenOptions: {
        token: {
            access_token: 'your access token',
            refresh_token: 'your refresh token',
            scope: ['scope 1', 'scope 2'],
            token_type: 'the type of the token',
            expiry_date: 1315241515
        }
    }
});
```
Now you can remove the generated token file and keep authenticating.

## oAuth2 Client
The strong point of this module, is it's pre-build easy to use oAuth2 client.
To get a built oAuth2 Client without knowing too much, do the following in your code:
```
const authenticator = new GoogleAuthenticator({
    clientId: 'your client ID',
    clientSecret: 'your client secret',
    scopes: ['scope 1', 'scope 2'],
    username: 'your email address username (before the @)', //only needed for first authentication
    password: 'your email address password' //only needed for first authentication
});
Now the authenticator variable holds the oAuth2 object you need.
```

## GMAIL Client
You can use the GMAIL Client used in the module, in order to perform your async actions:
```
const gmail = authenticator.getGmailClient();
const messages = await gmail.users.messages.list({
    userId: 'me',
    labelIds: parameters.labelIds,
    auth: authenticator.getAuth2Client(),
    q: `subject: ${parameters.subject}`
});

```
Or you can use the original gmail client:
```
const gmail = google.gmail('v1');
const messages = await gmail.users.messages.list({
    userId: 'me',
    labelIds: parameters.labelIds,
    auth: authenticator.getAuth2Client(),
    q: `subject: ${parameters.subject}`
});
```

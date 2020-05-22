# Google authenticator tool for backend development / automation
## How to setup
### Create a google oAuth2 credentials
1. Go to https://console.developers.google.com/apis/credentials, and under your project create the oAuth2 credentials with
an Authorised redirect URI of `http://mydomain/oauth2callback` (Recommended is `http://localhost:port/oauth2callback`) And type of `Web application`
2. Download the credentials after creation, in order to re-use later in the code.
3. Authorize your third party app to have access to your project, you need to only do it once.
### Initialize the constructor
Before starting, you need to initialize the constructor with the client and secret id's of oAuth2:
```
const authenticator = new GoogleAuthenticator({
    clientId: 'your client ID',
    clientSecret: 'your client secret'
});
```
### First token generation
In the first time, you don't have a token at all and you will to verify the auth URL using a browser.
The following code will do it for you:
```
const oAuth2 = authenticator.authorizeWithNewToken({
    scope: ['scope 1', 'scope 2'],
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
const oAuth2 = authenticator.authorizeWithTokenFile({
    name: 'my-token-file',
    directory: './my-token-directory'
});
//Final token path would be: ./my-token-directory/my-token-file.json
```
### Existing token JS object
If you don't want to store a token file, you can always re-use the existing token as a JS object inside the code:
```
const oAuth2 = authenticator.authorizeWithTokenFile({
    access_token: 'your access token',
    refresh_token: 'your refresh token',
    scope: ['scope 1', 'scope 2'],
    token_type: 'the type of the token',
    expiry_date: 1315241515
});
```
Now you can remove the generated token file and keep authenticating.

## oAuth2 Client
The strong point of this module, is it's pre-build easy to use oAuth2 client.
To get a built oAuth2 Client without knowing too much, do the following in your code:
```
const authenticator = new GoogleAuthenticator({
    clientId: 'your client ID',
    clientSecret: 'your client secret'
});
//I'm using the authorizeWithNewToken function, but this can also done with the authorizeWithTokenFile and authorizeWithToken functions, explained above.
const oAuth2 = authenticator.authorizeWithNewToken({
    scope: ['scope 1', 'scope 2'],
    username: 'your email address username (before the @)',
    password: 'your email address password'
});
```
Now the oAuth2 variable holds the oAuth2 object you need.

## GMAIL Client
You can use the GMAIL Client used in the module, in order to perform your async actions:
```
const authenticator = new GoogleAuthenticator({
    clientId: 'your client ID',
    clientSecret: 'your client secret'
});
//I'm using the authorizeWithNewToken function, but this can also done with the authorizeWithTokenFile and authorizeWithToken functions, explained above.
const oAuth2 = authenticator.authorizeWithNewToken({
    scope: ['scope 1', 'scope 2'],
    username: 'your email address username (before the @)',
    password: 'your email address password'
});
const gmail = authenticator.getGmailClient();
const messages = await gmail.users.messages.list({
    userId: 'me',
    labelIds: ['UNREAD'],
    auth: oAuth2,
    q: 'subject: my-email-title'
});
```
Or you can use the original gmail client:
```
const gmail = google.gmail('v1');
const messages = await gmail.users.messages.list({
    userId: 'me',
    labelIds: ['UNREAD'],
    auth: oAuth2,
    q: 'subject: my-email-title'
});
```
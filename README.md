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
const authenticator = new GoogleAuthenticator(
{
    clientId: 'your client ID',
    clientSecret: 'your client secret',
    scopes: ['scope 1', 'scope 2'],
    username: 'your email address username (before the @)',
    password: 'your email address password'
};
```
After the first execution of the code, the token will be generated in `tokens` folder by default and with a name of `your-client-id-token.json`.
After the token is generated, it is **recommended** to remove the username and password parameters, they are no longer necessary.

### Token re-usage
After first token generation, you can re-use your token in the ways.
1. re-using generated token:
After first token was generated, you no longer need to pass the username and password parameters.
Your code should look like:
```
const authenticator = new GoogleAuthenticator(
{
    clientId: 'your client ID',
    clientSecret: 'your client secret',
    scopes: ['scope 1', 'scope 2']
};
```
2. re-using the generated token as a JS object:
If you don't want a stored token, you can always re-use the existing token as a JS object inside the code:
```
const authenticator = new GoogleAuthenticator(
{
    clientId: 'your client ID',
    clientSecret: 'your client secret',
    scopes: ['scope 1', 'scope 2'],
},
{
    tokenOptions: {
        token: {
            access_token: 'your access token',
            refresh_token: 'your refresh token',
            scope: ['scope 1', 'scope 2'],
            token_type: 'the type of the token',
            expiry_date: 1315241515
        }
    }
};
```
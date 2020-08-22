import { GoogleAuthenticator } from '../index';
import { cliArguments } from 'cli-argument-parser';

describe('Google authenticator util', async function() {
    this.timeout(10 * 60 * 60 * 60);
    it('authorizeWithNewToken', async () => {
        const authenticator = new GoogleAuthenticator({
           clientId: cliArguments.clientId,
           clientSecret: cliArguments.clientSecret, 
        });
        await authenticator.authorizeWithNewToken({
            username: cliArguments.username,
            password: cliArguments.password,
            scope: [cliArguments.scope]
        })
    });
});
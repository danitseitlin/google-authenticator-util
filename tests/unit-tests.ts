import { GoogleAuthenticator } from '../index';
import { cliArguments } from 'cli-argument-parser';
import { expect } from 'chai';
let authenticator: GoogleAuthenticator;
describe('Tests', async function() {
    this.timeout(5 * 1000 * 60);
    before(async () => {
        authenticator = new GoogleAuthenticator({
            clientId: cliArguments.clientId,
            clientSecret: cliArguments.clientSecret
        }, {
            debug: (cliArguments.debug === 'true') ? true: false
        }); 
    });
    it('authorizeWithNewToken', async () => {
        await authenticator.authorizeWithNewToken({
            username: cliArguments.username,
            password: cliArguments.password,
            scope: [cliArguments.scope]
        })
        const emails = await authenticator.filterEmails({
            labelIds: [],
            subject: ''
        })
        expect(emails.length).to.be.greaterThan(0, 'The count of emails')
    });

    it('authorizeWithTokenFile', async () => {
        await authenticator.authorizeWithTokenFile({
            name: `${cliArguments.clientId}-token.json`,
            directory: './tokens'
        });
        const emails = await authenticator.filterEmails({
            labelIds: [],
            subject: ''
        })
        expect(emails.length).to.be.greaterThan(0, 'The count of emails')
    });
    it('authorizeWithToken', async () => {
        await authenticator.authorizeWithToken(require(`${process.env.INIT_CWD}/tokens/${cliArguments.clientId}-token.json`))
        const emails = await authenticator.filterEmails({
            labelIds: [],
            subject: ''
        })
        expect(emails.length).to.be.greaterThan(0, 'The count of emails')
    });
});
import { GoogleAuthenticator, filterEmails, getEmail, waitForEmail } from '../index';
import { cliArguments } from 'cli-argument-parser';
import { expect } from 'chai';
let authenticator: GoogleAuthenticator;
const emailQuery = 'subject: Security alert';
describe('Tests', async function() {
    this.timeout(15 * 100 * 60);
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
        const emails = await filterEmails({
            auth: authenticator.oAuth2Client,
            q: emailQuery
        })
        expect(emails.length).to.be.greaterThan(0, 'The emails count')
    });

    it('authorizeWithTokenFile', async () => {
        await authenticator.authorizeWithTokenFile({
            name: `${cliArguments.clientId}-token.json`,
            directory: './tokens'
        });
        const emails = await filterEmails({
            auth: authenticator.oAuth2Client,
            q: emailQuery
        })
        expect(emails.length).to.be.greaterThan(0, 'The emails count')
    });
    it('authorizeWithToken', async () => {
        await authenticator.authorizeWithToken(require(`${process.env.INIT_CWD}/tokens/${cliArguments.clientId}-token.json`))
        const emails = await filterEmails({
            auth: authenticator.oAuth2Client,
            q: emailQuery
        })
        expect(emails.length).to.be.greaterThan(0, 'The emails count')
    });
    it('waitForEmail', async () => {
        await authenticator.authorizeWithToken(require(`${process.env.INIT_CWD}/tokens/${cliArguments.clientId}-token.json`))
        const emails = await filterEmails({
            auth: authenticator.oAuth2Client,
            q: emailQuery
        })
        expect(emails.length).to.be.greaterThan(0, 'The emails count')
    });
    it('getEmail', async () => {
        await authenticator.authorizeWithToken(require(`${process.env.INIT_CWD}/tokens/${cliArguments.clientId}-token.json`))
        const emails = await filterEmails({
            auth: authenticator.oAuth2Client,
            q: emailQuery
        })
        expect(emails.length).to.be.greaterThan(0, 'The emails count')
        const email = await getEmail({
            auth: authenticator.oAuth2Client,
            id: emails[0].id
        })
        expect(email.data.raw).contains('Security alert', 'title of the email')
    });
});
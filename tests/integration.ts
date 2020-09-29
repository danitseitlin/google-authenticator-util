import { GoogleAuthenticator, filterEmails, getEmail, waitForEmail } from '../index';
import { cliArguments } from 'cli-argument-parser';
import { expect } from 'chai';
import { deleteEmail, sendEmail } from '../dir/utilities';
let authenticator: GoogleAuthenticator;
const scope = ['https://www.googleapis.com/auth/gmail.readonly', 'https://mail.google.com/', 'https://www.googleapis.com/auth/gmail.modify',
'https://www.googleapis.com/auth/gmail.compose', 'https://www.googleapis.com/auth/gmail.send', 'https://www.googleapis.com/auth/gmail.addons.current.action.compose']
const emailQuery = 'subject: Security alert';
describe('Tests', async function() {
    this.timeout(15 * 1000 * 60);
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
            scope: scope
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
        const emails = await waitForEmail({
            auth: authenticator.oAuth2Client,
            q: emailQuery
        })
        expect(emails.length).to.be.greaterThan(0, 'The emails count')
    });
    it('getEmail', async () => {
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
    it('sendEmail & deleteEmail', async () => {
        const emailTo = 'gaunpmp@gmail.com'
        const emailFrom = 'gaunpmp@gmail.com'
        const emailSubject = 'Attempting to send email via package'
        const emailMessage = 'Hello,\n this is an automatic email via the NPM package\nBest,'
        const emailQuery = `from: ${emailFrom} to: ${emailTo} subject: ${emailSubject} is:unread`
        await sendEmail({to: emailTo, 'from': emailFrom, subject: emailSubject, message: emailMessage, auth: authenticator.oAuth2Client})
        let emails = await waitForEmail({
            auth: authenticator.oAuth2Client,
            q: emailQuery
        })
        await deleteEmail({
            auth: authenticator.oAuth2Client,
            id: emails[0].threadId
        });
        emails = await filterEmails({
            auth: authenticator.oAuth2Client,
            q: emailQuery
        })
        expect(emails.length).to.be.equal(0, 'The emails count')
    })
});

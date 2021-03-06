import { google, gmail_v1 } from 'googleapis';
import { emailMessage } from './types';
const api: gmail_v1.Gmail = google.gmail('v1');

/**
 * Retrieving a list of emails
 * @param parameters The parameters to filter emails by
 * @param parameters.auth Auth client or API Key for the request
 * @param parameters.includeSpamTrash Include messages from SPAM and TRASH in the results.
 * @param parameters.labelIds Only return messages with labels that match all of the specified label IDs.
 * @param parameters.maxResults Maximum number of messages to return.
 * @param parameters.pageToken Page token to retrieve a specific page of results in the list.
 * @param parameters.q Only return messages matching the specified query. Supports the same query format as the Gmail search box. For example, "from:someuser@example.com rfc822msgid:<somemsgid@example.com> is:unread". Parameter cannot be used when accessing the api using the gmail.metadata scope.
 * @param parameters.userId The user's email address. The special value me can be used to indicate the authenticated user.
 */
export async function filterEmails(parameters: gmail_v1.Params$Resource$Users$Messages$List): Promise<gmail_v1.Schema$Message[]> {
    if(parameters.userId === undefined) parameters.userId = 'me';
    const response = await api.users.messages.list(parameters);
    return (response.data.resultSizeEstimate > 0 ? response.data.messages: [])
}

/**
 * Retrieve an email's contents
 * @param parameters The parameters to filter the email by
 * @param parameters.auth Auth client or API Key for the request
 * @param parameters.format The format to return the message in.
 * @param parameters.id The ID of the message to retrieve.
 * @param parameters.metadataHeaders When given and format is METADATA, only include headers specified.
 * @param parameters.userId The user's email address. The special value me can be used to indicate the authenticated user.
 */
export async function getEmail(parameters: gmail_v1.Params$Resource$Users$Messages$Get) {
    if(parameters.userId === undefined) parameters.userId = 'me';
    if(parameters.format === undefined) parameters.format = 'raw';
    const response = await api.users.messages.get(parameters);
    //Converting the raw email message to HTML string
    if(parameters.format === 'raw')
        response.data.raw = Buffer.from(response.data.raw, 'base64').toString('ascii');
    return response;
}

/**
 * Waiting for email to appear
 * @param parameters The parameters to filter emails by
 * @param parameters.auth Auth client or API Key for the request
 * @param parameters.includeSpamTrash Include messages from SPAM and TRASH in the results.
 * @param parameters.labelIds Only return messages with labels that match all of the specified label IDs.
 * @param parameters.maxResults Maximum number of messages to return.
 * @param parameters.pageToken Page token to retrieve a specific page of results in the list.
 * @param parameters.q Only return messages matching the specified query. Supports the same query format as the Gmail search box. For example, "from:someuser@example.com rfc822msgid:<somemsgid@example.com> is:unread". Parameter cannot be used when accessing the api using the gmail.metadata scope.
 * @param parameters.userId The user's email address. The special value me can be used to indicate the authenticated user.
 * @param timeoutInSeconds The amount of time to wait for the email. Default: 5 seconds
 */
export async function waitForEmail(parameters: gmail_v1.Params$Resource$Users$Messages$List, timeoutInSeconds = 5): Promise<gmail_v1.Schema$Message[]> {
    let emails = await filterEmails(parameters);
    let timePassedInSeconds = 0;
    while(emails.length === 0 && timePassedInSeconds < timeoutInSeconds) {
        await new Promise(resolve => setTimeout(resolve, 1000))
        timePassedInSeconds++;
        emails = await filterEmails(parameters);
    }
    if(timePassedInSeconds >= timePassedInSeconds && emails.length === 0)
        throw new Error(`Unable to find email after ${timePassedInSeconds}/${timeoutInSeconds}`);
    return emails;
}

/**
 * Sending an email
 * @param parameters The parameters of send email message
 * @param parameters.to The email address to recieve the email
 * @param parameters.from The email address to send the email from
 * @param parameters.subject The subject of the email address
 * @param parameters.message The message of the email address
 * @param parameters.auth Auth client or API Key for the request
 * @param parameters.userId The user's email address. The special value me can be used to indicate the authenticated user.
 * @param parameters.requestBody Request body metadata
 * @param parameters.media Media metadata
 * @param parameters.media.mimeType Media mime-type
 * @param parameters.media.body Media body contents
 */
export async function sendEmail(parameters: emailMessage) {
    if(parameters.userId === undefined) parameters.userId = 'me';
    const { to, from, subject, message, ...emailParameters } = parameters;
    const rawBody = ["Content-Type: text/plain; charset=\"UTF-8\"\n",
        "MIME-Version: 1.0\n",
        "Content-Transfer-Encoding: 7bit\n",
        "to: ", to, "\n",
        "from: ", from, "\n",
        "subject: ", subject, "\n\n",
        message
    ].join('');
    const encodedMail = Buffer.from(rawBody, 'ascii').toString('base64');
    emailParameters.requestBody = { raw: encodedMail };
    await api.users.messages.send(emailParameters)
}

/**
 * Deleting an email
 * @param parameters The parameters of email deletion
 * @param parameters.auth Auth client or API Key for the request
 * @param parameters.id The ID of the message to delete.
 * @param parameters.userId The user's email address. The special value me can be used to indicate the authenticated user.
 */
export async function deleteEmail(parameters: gmail_v1.Params$Resource$Users$Messages$Delete): Promise<void> {
    if(parameters.userId === undefined) parameters.userId = 'me';
    await api.users.messages.delete(parameters)
}
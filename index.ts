// const fs = require('fs').promises;
import { promises } from 'fs';
import { google, gmail_v1 } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';
import * as express from 'express';
import { createServer, Server } from 'http';
import * as puppeteer from 'puppeteer';

export class GoogleAuthenticator {
    private tokenDirectory = './tokens/';
    private tokenPath: string;
    private redirectURI: string;
    private isTokenGenerated: boolean = true;
    private authServer: Server;
    private oAuth2Client: OAuth2Client;
    private gmailAPI: gmail_v1.Gmail;
    
    /**
     * Initializing the Google Authenticator object
     * @param authenticationOptions The parameters to configure the authentication to Google
     * @param authenticationOptions.clientId The authentication client ID
     * @param authenticationOptions.clientSecret The authentication client secret
     * @param authenticationOptions.scopes The authentication scopes
     * @param authenticationOptions.username The authentication username
     * @param authenticationOptions.password The authentication password
     * @param redirectURIOptions The parameters to configure the redirectURI
     * @param redirectURIOptions.protocol The protocol of the redirectURI
     * @param redirectURIOptions.domain The domain of the redirectURI
     * @param redirectURIOptions.port The port of the redirectURI
     * @param redirectURIOptions.path The path of the RedirectURI
     * @param debugOptions The parameters to configure the debug logging
     * @param debugOptions.debug Is debug enabled
     * @param debugOptions.debugger The debugger of the debug printing
     */
    constructor(private authenticationOptions: AuthenticationOptions, private redirectURIOptions: RedirectURIOptions, private debugOptions?: DebugOptions) {
        this.configure();
        this.gmailAPI = google.gmail('v1');
        this.oAuth2Client = new google.auth.OAuth2(this.authenticationOptions.clientId, this.authenticationOptions.clientSecret, this.redirectURI);
    }

    /**
     * Authorizing the Google user
     */
    async authorize(): Promise<OAuth2Client> {
        this.debug('Setting up the token')
        try {
            const token = await promises.readFile(this.tokenPath, 'utf8');
            this.debug(`Setting the authentication credentials with token: ${JSON.stringify(token)}`)
            this.oAuth2Client.setCredentials(JSON.parse(token));
            return this.oAuth2Client;
        }
        catch(error) {
            this.debug(`authorization error: ${error}`);
            if(this.authenticationOptions.password === undefined || this.authenticationOptions.username === undefined)
                throw new Error('Cannot obtain first token without username and password');
            return await this.generateToken();
        }
    }

    /**
     * Generating a new token
     */
    async generateToken(): Promise<OAuth2Client> {
        this.debug('Retrieving a new token');
        const authUrl = this.oAuth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: this.authenticationOptions.scopes,
        });
        this.debug(`Generating new auth URL: ${authUrl}`);
        this.isTokenGenerated = false;
        const handler = express();
        const scope = this;
        handler.get(this.redirectURIOptions.path, async function (req, res) {
            scope.debug(`Getting a new token with code ${res.req.query.code}`)
            scope.oAuth2Client.getToken((res.req.query.code).toString(), async (err, token) => {
                if (err) return scope.debug(`Error retrieving access token ${err}`);
                scope.debug(`Setting the token as ${JSON.stringify(token)}`);
                scope.oAuth2Client.setCredentials(token);
                // Store the token to disk for later program executions
                await promises.writeFile(scope.tokenPath, JSON.stringify(token));
                scope.isTokenGenerated = true;
                scope.authServer.close();
                scope.debug('Killing the mock server....')
            });
        });
        this.debug(`Creating a mock server on port ${this.redirectURIOptions.port}, domain: ${this.redirectURIOptions.domain}`);
        this.authServer = createServer(handler).listen(this.redirectURIOptions.port, this.redirectURIOptions.domain);  
        await this.authenticateToken(authUrl);
        await new Promise(resolve => setTimeout(resolve, 5000));
        this.debug(`Token generation process is ${this.isTokenGenerated}`)
        return this.oAuth2Client;
    }

    /**
     * Getting a list of emails
     * @param parameters The parameters to filter with
     * @param parameters.labelIds The label ids of the filtered emails
     * @param parameters.subject The subject of the filtered emails
     */
    async filterEmails(parameters: FilterEmailsParameters): Promise<gmail_v1.Schema$Message[]> {
        const emails: gmail_v1.Schema$Message[] = [];
        const messagesParameters: gmail_v1.Params$Resource$Users$Messages$List = {
            userId: 'me',
            labelIds: parameters.labelIds,
            auth: this.oAuth2Client,
            q: `subject: ${parameters.subject}`
        };
        const messages = await this.gmailAPI.users.messages.list(messagesParameters);
        for(const messageObject of messages.data.messages) {
            const message = await this.gmailAPI.users.messages.get({
                userId: 'me',
                auth: this.oAuth2Client,
                id: messageObject.id,
                format: 'raw'
            });
            message.data.raw = new Buffer(message.data.raw, 'base64').toString('ascii');
            emails.push(message.data);
        }
        return emails;
    }

    /**
     * Authenticating the first token using the google UI
     * @param authUrl The authentication URL
     */
    private async authenticateToken(authUrl: string): Promise<void> {
        const browser = await puppeteer.launch({headless: false});
        const page = await browser.newPage();

        //UI authentication when there is no access token.
        await page.goto(authUrl);
        await page.waitForSelector('input[type=email]', {visible: true});
        await page.type('input[type=email]', this.authenticationOptions.username);
        await page.waitForSelector('#identifierNext', {visible: true});
        await page.click('#identifierNext');
        await page.waitForSelector('input[type=password]', {visible: true})
        await page.type('input[type=password]', this.authenticationOptions.password);
        await page.waitFor('#passwordNext');
        await page.click('#passwordNext');
        await new Promise(resolve => setTimeout(resolve, 5000));
        await browser.close();
        this.debug(`Waiting for token generation process to be finished`) 
    }

    /**
     * Configurating the Google Authenticator class properties
     */
    private configure(){
        //Configuring token path
        this.tokenPath = `${this.tokenDirectory}${this.authenticationOptions.clientId}-token.json`;
        //Configuring Redirect URI
        this.redirectURI = `${this.redirectURIOptions.protocol}://${this.redirectURIOptions.domain}`;
        if(this.redirectURIOptions.protocol !== undefined) this.redirectURI += `:${this.redirectURIOptions.port}`;
        this.redirectURI += this.redirectURIOptions.path;
        //Configuring debug options
        if(this.debugOptions === undefined) this.debugOptions = { debug: false, debugger: console.log };
        else if(this.debugOptions.debugger === undefined) this.debugOptions.debugger = console.log;
    }

    /**
     * Printing a message based on configured logger
     * @param message The printed message
     */
    private debug(message: string) {
        if(this.debugOptions.debug) this.debugOptions.debugger(message);
    }
}

/**
 * The parameters to configure the redirectURI
 * @param protocol The protocol of the redirectURI
 * @param domain The domain of the redirectURI
 * @param port The port of the redirectURI
 * @param path The path of the RedirectURI
 */
export interface RedirectURIOptions {
    protocol: string,
    domain: string,
    port?: number,
    path: string
}

/**
 * The parameters to configure the debug logging
 * @param debug Is debug enabled
 * @param debugger The debugger of the debug printing
 */
export interface DebugOptions {
    debug: boolean,
    debugger?: any
}

/**
 * The parameters to configure the authentication to Google
 * @param clientId The authentication client ID
 * @param clientSecret The authentication client secret
 * @param scopes The authentication scopes
 * @param username The authentication username
 * @param password The authentication password
 */
export interface AuthenticationOptions {
    clientId: string, 
    clientSecret: string, 
    scopes: string[]
    username?: string,
    password?: string
}

/**
 * The parameters of filterEmails function
 * @param labelIds The label ids of the filtered emails
 * @param subject The subject of the filtered emails
 */
export interface FilterEmailsParameters {
    labelIds: string[]
    subject: string
}
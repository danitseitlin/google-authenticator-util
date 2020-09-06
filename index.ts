import { promises } from 'fs';
import { MockServer, Request, Response } from 'dmock-server'
import { google, gmail_v1 } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';
import { Credentials } from 'google-auth-library';
import * as puppeteer from 'puppeteer-core';
import { cliArguments } from 'cli-argument-parser';

export class GoogleAuthenticator {
    private clientId: string
    private clientSecret: string
    private isTokenGenerated = true;
    private authServer: MockServer;
    private debugOptions: DebugOptions = { debug: false, debugger: console.log };
    public oAuth2Client: OAuth2Client;
    public gmailAPI: gmail_v1.Gmail;

    /**
     * Initializing the Google Authenticator object
     * @param authenticationOptions The parameters to configure the authentication to Google
     * @param authenticationOptions.clientId The authentication client ID
     * @param authenticationOptions.clientSecret The authentication client secret
     * @param debugOptions Optional. The parameters to configure the debug logging
     * @param debugOptions.debug Is debug enabled
     * @param debugOptions.debugger The debugger of the debug printing
     */
    constructor(authenticationOptions: BasicAuthentication, debugOptions?: DebugOptions) {
        this.clientId = authenticationOptions.clientId;
        this.clientSecret = authenticationOptions.clientSecret;
        this.gmailAPI = google.gmail('v1');
        this.oAuth2Client = new google.auth.OAuth2(this.clientId, this.clientSecret);
        if(debugOptions !== undefined && debugOptions.debug !== undefined)
            this.debugOptions.debug = debugOptions.debug;
        if(debugOptions !== undefined && debugOptions.debugger !== undefined)
            this.debugOptions.debugger = debugOptions.debugger;
    } 
    
    /**
     * Authorizing a google account with a new token
     * @param options The new token authentication parameters
     * @param options.username Required. The gmail username
     * @param options.password Required. The gmail password
     * @param options.scope Required. The authentication scope
     * @param options.redirectURI Optional. The configuration of the redirect URI
     * @param options.tokenName Optional. The name of the token
     * @param options.tokenDirectory Optional. The directory of the token
     */
    async authorizeWithNewToken(options: NewTokenAuthentication) {
        try {
            this.debug('Configurating given parameters');
            const configuratedOptions = this.configure(options);
            this.debug('==== Configurated parameters ====');
            this.debug(`Username: ${(configuratedOptions.username !== undefined) ? '***': 'undefined'}`)
            this.debug(`Password: ${(configuratedOptions.password !== undefined) ? '***': 'undefined'}`)
            this.debug(`Token Name: ${(configuratedOptions.tokenName.indexOf(this.clientId) !== -1) ? 
                configuratedOptions.tokenName.replace(this.clientId, '*****'): configuratedOptions.tokenName}`
            )
            this.debug(`Token Directory: ${configuratedOptions.tokenDirectory}`);
            this.debug(`Scope: ${configuratedOptions.scope}`)
            this.debug('=================================');
            this.oAuth2Client = new google.auth.OAuth2(this.clientId, this.clientSecret, configuratedOptions.redirectURI);
            await this.generateToken(configuratedOptions);
            return this.oAuth2Client;
        }
        catch(error) {
            throw new Error(error);
        }
    }

    /**
     * Authorizing a google account with an existing token file
     * @param options The token file authentication parameters
     * @param options.name The name of the token
     * @param options.directory The directory of the token
     */
    async authorizeWithTokenFile(options: TokenFileAuthentication): Promise<OAuth2Client> {
        try {
            let directory = options.directory;
            if(directory[directory.length - 1] !== '/') directory += '/';
            const name = (options.name.indexOf('.json') !== -1) ? options.name: `${options.name}.json`;
            const tokenFullPath = directory + name;
            this.debug(`Retrieving token from file: ${tokenFullPath}`)
            const token = JSON.parse(await promises.readFile(tokenFullPath, 'utf8'));
            this.debug('Setting the token');
            this.oAuth2Client.setCredentials(token);
            return this.oAuth2Client;
        }
        catch(error) {
            throw new Error(error);
        }
    }

    /**
     * Authorizing using a token
     * @param token The token
     */
    async authorizeWithToken(token: Token): Promise<OAuth2Client> {
        try {
            this.debug('Setting the token');
            this.oAuth2Client.setCredentials(token);
            return this.oAuth2Client;
        }
        catch(error) {
            throw new Error(error);
        }
    }

    /**
     * Generating a new oAuth2 token
     * @param options The generate token parameters
     * @param options.username The email address username
     * @param options.password The email address password
     * @param options.scope The authorization scope
     * @param options.tokenName The name of the token
     * @param options.tokenDirectory The directory of the token
     * @param options.redirectURI The full redirectURI
     * @param options.redirectURIOptions The redirectURI options
     */
    private async generateToken(options: GenerateTokenParameters): Promise<OAuth2Client> {
        this.debug('Retrieving a new token');
        const authUrl = this.oAuth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: options.scope,
        });
        this.debug(`Generating new auth URL: ${authUrl}`);
        this.isTokenGenerated = false;
        this.debug(`Creating a mock server on port ${options.redirectURIOptions.port}, domain: ${options.redirectURIOptions.domain}`);
        this.authServer = new MockServer({
            hostname: options.redirectURIOptions.domain,
            port: options.redirectURIOptions.port,
            routes: [{
                path: options.redirectURIOptions.path,
                method: 'get',
                response: (res: Response, req: Request) => this.retrieveToken((req as {[key: string]: any}).req.query.code, options)
            }]
        })
        this.authServer.start();
        this.debug('Authenticating to get the first token')
        await this.authenticateToken(authUrl, options.username, options.password);
        await new Promise(resolve => setTimeout(resolve, 5000));
        this.debug(`Token generation process is ${this.isTokenGenerated}`)
        return this.oAuth2Client;
    }

    /**
     * Authenticating the first token using the google UI
     * @param authUrl The authentication URL
     * @param username The email address username
     * @param password The email address password
     */
    private async authenticateToken(authUrl: string, username: string, password: string): Promise<void> {
        const browserFetcher = puppeteer.createBrowserFetcher();
        const revisionInfo = await browserFetcher.download('737027');
        const headless = (cliArguments.headless === 'false') ? false: true;
        const browser = await puppeteer.launch({
            executablePath: '/usr/bin/chromium-browser',//revisionInfo.executablePath,
            headless: headless,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
        });
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3419.0 Safari/537.36');
        //Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3419.0 Safari/537.36
        //UI authentication when there is no access token.
        await page.goto(authUrl, {waitUntil: 'networkidle2'});
        await page.waitForSelector('input[type=email]', {visible: true});
        this.debug('Filling the username');
        await page.type('input[type=email]', username);
        await page.click('#identifierNext');
        await page.waitForSelector('input[type=password]', {visible: true})
        this.debug('Filling the password');
        await page.type('input[type=password]', password);
        await page.click('#passwordNext');
        while(this.isTokenGenerated !== true) 
            await new Promise(resolve => setTimeout(resolve, 500))
        await browser.close();
        this.debug(`Waiting for token generation process to be finished`)
        await browserFetcher.remove(revisionInfo.revision);
    }

    /**
     * Configurating the Google Authenticator class properties
     * @param options Required. The configuration options
     * @param username Required. The gmail username
     * @param password Required. The gmail password
     * @param scope Required. The authentication scope
     * @param redirectURI Optional. The configuration of the redirect URI
     * @param tokenName Optional. The name of the token
     * @param tokenDirectory Optional. The directory of the token
     */
    private configure(options: NewTokenAuthentication): GenerateTokenParameters {
        let tokenDirectory = './tokens/';
        let tokenName = `${this.clientId}-token`;
        let tmpRedirectURIOptions: RedirectURIOptions = { protocol: 'http', domain: 'localhost', path: '/oauth2callback' };
        //token related options
        this.debug('Configurating token path');
        if(options.tokenDirectory !== undefined) tokenDirectory = options.tokenDirectory;
        if(tokenDirectory[tokenDirectory.length - 1] !== '/') tokenDirectory += '/';
        if(options.tokenName !== undefined) tokenName = options.tokenName;
        //redirect URI related options
        this.debug('Configurating redirect URI options');
        if(options.redirectURIOptions !== undefined && options.redirectURIOptions.protocol !== undefined) tmpRedirectURIOptions.protocol = options.redirectURIOptions.protocol;
        if(options.redirectURIOptions !== undefined && options.redirectURIOptions.domain !== undefined) tmpRedirectURIOptions.domain = options.redirectURIOptions.domain;
        if(options.redirectURIOptions !== undefined && options.redirectURIOptions.path !== undefined) tmpRedirectURIOptions.path = options.redirectURIOptions.path;
        if(options.redirectURIOptions !== undefined && options.redirectURIOptions.port !== undefined) tmpRedirectURIOptions.port = options.redirectURIOptions.port;
        else tmpRedirectURIOptions.port = 3000;
        //building the redirect URI
        this.debug('Configurating the redirect URI')
        let redirectURI = `${tmpRedirectURIOptions.protocol}://${tmpRedirectURIOptions.domain}`;
        if(tmpRedirectURIOptions.port !== undefined) redirectURI += `:${tmpRedirectURIOptions.port}`;
        redirectURI += tmpRedirectURIOptions.path;
        this.debug('Configurating scope');
        if(options.scope === undefined) options.scope = ['https://www.googleapis.com/auth/gmail.readonly']
        const redirectURIOptions: RedirectURIOptions = tmpRedirectURIOptions;
        return {
            username: options.username,
            password: options.password,
            scope: options.scope,
            tokenName: tokenName,
            tokenDirectory: tokenDirectory,
            tokenFullPath: `${tokenDirectory}${tokenName}.json`,
            redirectURI: redirectURI,
            redirectURIOptions: redirectURIOptions
        };
    }

    /**
     * Retrieving a token
     * @param code The code of the authentication
     * @param options The options of token generation
     */
    private retrieveToken(code: string, options: GenerateTokenParameters) {
        this.debug(`Getting a new token with code ${code}`)
        this.oAuth2Client.getToken(code, async (err, token) => {
            if (err) return this.debug(`Error retrieving access token ${err}`);
            this.debug('Setting the token');
            this.oAuth2Client.setCredentials(token);
            // Store the token to disk for later program executions
            await this.verifyDirectory(options.tokenDirectory);
            await promises.writeFile(options.tokenFullPath, JSON.stringify(token));
            this.isTokenGenerated = true;
            this.authServer.stop();
            this.debug('Stopping the authentication server')
        });
    }

    /**
     * Printing a message based on configured logger
     * @param message The printed message
     */
    private debug(message: string): void {
        if(this.debugOptions.debug) this.debugOptions.debugger(`DEBUG: ${message}`);
    }

    /**
     * Verifying the token directory exists
     * @param directory The directory to verify
     */
    private async verifyDirectory(directory: string): Promise<void> {
        try {
            this.debug(`Verifying directory ${directory} exists`)
            await promises.access(directory);
        }
        catch(error) {
            this.debug(`Directory ${directory} doesn't exists, creating it.`)
            await promises.mkdir(directory);
        }
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
        const messagesResponse = await this.gmailAPI.users.messages.list(messagesParameters);
        //Verifying we have at least 1 response
        if(messagesResponse.data.resultSizeEstimate > 0) {
            for(const message of messagesResponse.data.messages) {
                const messageResponse = await this.gmailAPI.users.messages.get({
                    userId: 'me',
                    auth: this.oAuth2Client,
                    id: message.id,
                    format: 'raw'
                });
                //Converting the raw email message to HTML string
                messageResponse.data.raw = Buffer.from(messageResponse.data.raw, 'base64').toString('ascii');
                emails.push(messageResponse.data);
            }
        }
        return emails;
    }
}

/**
 * The parameters to configure the authentication to Google
 * @param clientId Required. The authentication client ID
 * @param clientSecret Required. The authentication client secret
 */
export interface BasicAuthentication {
    clientId: string, 
    clientSecret: string
}

/**
 * The new token authentication parameters
 * @param username Required. The gmail username
 * @param password Required. The gmail password
 * @param scope Required. The authentication scope
 * @param redirectURI Optional. The configuration of the redirect URI
 * @param tokenName Optional. The name of the token
 * @param tokenDirectory Optional. The directory of the token
 */
export interface NewTokenAuthentication {
    username: string,
    password: string,
    scope: string[]
    redirectURIOptions?: RedirectURIOptions,
    tokenName?: string,
    tokenDirectory?: string
}

/**
 * The token file authentication parameters
 * @param name Required. The name of the token
 * @param directory Required. The directory of the token
 */
export interface TokenFileAuthentication {
    name: string,
    directory: string
}

/**
 * The token authentication parameters
 * @param token Required. The token JS object
 */
export interface TokenAuthentication { 
    token: Credentials
}

/**
 * The parameters to configure class options
 * @param debugOptions Optional. The debug options
 */
export interface Options {
    debugOptions?: DebugOptions
}

/**
 * The parameters to pass to the generateToken function
 * @param username Required. The email address username
 * @param password Required. The email address password
 * @param scope Required. The authorization scope
 * @param tokenName Required. The name of the token
 * @param tokenDirectory Required. The directory of the token
 * @param redirectURI Required. The full redirectURI
 * @param redirectURIOptions Required. The redirectURI options
 */
export interface GenerateTokenParameters { 
    username: string,
    password: string,
    scope: string[],
    tokenName: string,
    tokenDirectory: string,
    tokenFullPath: string,
    redirectURI: string,
    redirectURIOptions: RedirectURIOptions
}

/**
 * The parameters to configure the redirectURI
 * @param protocol Required. The protocol of the redirectURI
 * @param domain Required. The domain of the redirectURI
 * @param port Optional. The port of the redirectURI
 * @param path Required. The path of the RedirectURI
 */
export interface RedirectURIOptions {
    protocol: string,
    domain: string,
    port?: number,
    path: string
}

/**
 * The parameters to configure the debug logging
 * @param debug Required. Is debug enabled
 * @param debugger Optional. The debugger of the debug printing
 */
export interface DebugOptions {
    debug: boolean,
    debugger?: any
}

/**
 * The token object
 * @param access_token Required. The access token to authenticate the Google user
 * @param refresh_token Required. The refresh token to use when the access token is outdated
 * @param scope Required. The permissions scope of the token
 * @param token_type Required. The type of the token
 * @param expiry_date Required. The expiry date of the token
 */
export interface Token {
    access_token: string,
    refresh_token: string,
    scope: string,
    token_type: string,
    expiry_date: number
}

/**
 * The parameters of filterEmails function
 * @param labelIds Required. The label ids of the filtered emails
 * @param subject Required. The subject of the filtered emails
 */
export interface FilterEmailsParameters {
    labelIds: string[]
    subject: string
}
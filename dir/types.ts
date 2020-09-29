import { Credentials } from 'google-auth-library';

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
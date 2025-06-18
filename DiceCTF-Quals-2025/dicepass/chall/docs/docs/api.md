---
sidebar_position: 5
---

# API reference

dicepass provides an extensive API for interacting with the extension. Once installed, the global `window.dicepass` object becomes accessible.  

## Functions  

#### `dicepass.isLoggedIn(): Promise<boolean>`  
Returns `true` if the user is currently logged into the dicepass extension.  

#### `dicepass.hasAutofill(): Promise<boolean>`  
Returns `true` if the current page has saved credentials available for autofill.  

#### `dicepass.saveCredentials(username: string, password: string): Promise<void>`  
Attempts to save the provided credentials to the dicepass vault.  
- Requires user confirmation before storing the data.  

#### `dicepass.autofill(): Promise<void>`  
Attempts to autofill saved credentials on the current page.  
- Equivalent to clicking the dicepass extension button.  

## Properties  

#### `version: Promise<number>`  
Returns the current version of the dicepass extension.  

#### `extensionId: Promise<string>`  
Returns the unique identifier for the installed dicepass extension.  

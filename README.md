### 1. Create an app

https://dev.fitbit.com/apps/new


OAuth 2.0 Application Type: Client
Callback URL: http://localhost
Default Access Type: Read & Write

Register creates the app and gives you three values you will need

##### ClientId

OAuth 2.0 Client ID
<6 digit number>

##### ClientSecret

Client Secret
<hash>

### 2. Get authorization code

##### Call
 
```
https://www.fitbit.com/oauth2/authorize?response_type=token&expires_in=31536000&client_id=<CLIENT_ID>&redirect_uri=http://localhost&scope=activity%20nutrition%20heartrate%20location%20nutrition%20profile%20settings%20sleep%20social%20weight
```

##### Grant Permission in popup

##### Take code from url of failed redirect

```
http://localhost/#access_token=<ACCESS_TOKEN>&user_id=<USER_ID>&scope=nutrition+sleep+settings+profile+location+heartrate+activity+social+weight&token_type=Bearer&expires_in=31536000
```

The request will fail to load a webpage but give you two important bits of information


Your `ACCESS_TOKEN` and your `USER_ID`

# Table of Contents  
- [Nodejs-AuthApp](#nodejs-authapp)  
 - [Project structure](#project-structure)  
  - [Middlewares](#middlewares)  
      - [login_token.auth](#1--login-tokenauth--https---githubcom-sbtopzzz-lg-nodejs-authapp-blob-main-src-middlewares-login-tokenauthjs-)  
      - [login_token.unverified.auth](#2--login-tokenunverifiedauth--https---githubcom-sbtopzzz-lg-nodejs-authapp-blob-main-src-middlewares-login-tokenunverifiedauthjs-)  
      - [2fa.auth](#3--2faauth--https---githubcom-sbtopzzz-lg-nodejs-authapp-blob-main-src-middlewares-2faauthjs-)  
  * [Routes](#routes)  
    + [I. UserAuth](#i-userauth)  
      - [`/user/auth/signin`](#1---user-auth-signin-)  
      - [`/user/auth/signup`](#2---user-auth-signup-)  
      - [`/user/auth/resetPassword`](#3---user-auth-resetpassword-)  
    + [II. UserInfo](#ii-userinfo)  
      - [`/user`](#1---user-)  
      - [`/user/update`](#2---user-update-)  
      - [`/user/avatar`](#3---user-avatar-)  
      - [`/user/verify`](#4---user-verify-)  
      - [`/user/verify/requestEmail`](#5---user-verify-requestemail-)  
      - [`/user/verify/requestPhone`](#6---user-verify-requestphone-)  
    + [III. User2FA](#iii-user2fa)  
      - [`/user/2fa`](#1---user-2fa-)  
      - [`/user/2fa/enable`](#2---user-2fa-enable-)  
      - [`/user/2fa/disable`](#3---user-2fa-disable-)  
      - [`/user/2fa/resetPassword`](#4---user-2fa-resetpassword-)  
   
  
# Nodejs-AuthApp  
  
A Node.js app that implements APIs to emulate basic User authentication.  
  
|  Host  |  Domain |  
|--------|---------|  
|  Heroku  |https://nodejs-authapp.herokuapp.com/  |  
  
# Postman collection link  
Go to **Postman** > **Import** > **Link** (Tab) > Paste the link and **Continue**    
https://www.getpostman.com/collections/c319720e2fc33dd89af7  
  
# Technologies/Packages Used!  
  
- [Express.js](https://www.npmjs.com/package/express) - For routing  
- [Firebase](https://www.npmjs.com/package/firebase-admin) (Free tier) - For file storage  
- [JsonWebToken](https://www.npmjs.com/package/jsonwebtoken) - To hide password  
- [MongoDB](https://www.npmjs.com/package/mongoose) (Shared cluster) - For database  
- [Nodemailer](https://www.npmjs.com/package/nodemailer) - To send emails  
- [Twilio SMS API](https://www.npmjs.com/package/twilio) (Free tier) - To send sms  
  
## Project structure  
  
[**src**](https://github.com/SBTopZZZ-LG/nodejs-authapp/tree/main/src) is the root of the project tree.  
  
- [middlewares](https://github.com/SBTopZZZ-LG/nodejs-authapp/tree/main/src/middlewares) holds files that are essential for APIs where user authentication is a must.  
- [models](https://github.com/SBTopZZZ-LG/nodejs-authapp/tree/main/src/models) holds all schemas that will be used to model mongoose documents.  
- [routes](https://github.com/SBTopZZZ-LG/nodejs-authapp/tree/main/src/routes) holds all the files that implement certain APIs to the app. Each file is organized based on the APIs it holds.  
- [scripts](https://github.com/SBTopZZZ-LG/nodejs-authapp/tree/main/src/scripts) holds files that act like scripts, i.e, they initiate services. These scripts are executed only once (inside the [index.js](https://github.com/SBTopZZZ-LG/nodejs-authapp/blob/main/src/index.js)).  
- [utils](https://github.com/SBTopZZZ-LG/nodejs-authapp/blob/main/src/utils) provides utilities that provide functionality to certain areas of the app. For example, [twilio.sms.js](https://github.com/SBTopZZZ-LG/nodejs-authapp/blob/main/src/utils/twilio.sms.js) provides a class with method `sendSms` to send an SMS.  
  
## Middlewares  
All the [middlewares](https://github.com/SBTopZZZ-LG/nodejs-authapp/tree/main/src/middlewares) focus on validating the user's authenticity by obtaining required fields from the request.  
#### 1. [login_token.auth](https://github.com/SBTopZZZ-LG/nodejs-authapp/blob/main/src/middlewares/login_token.auth.js)  
Method - **POST**  
Query params -  
- id  
  
Headers -  
- Authorization  
---  
#### 2. [login_token.unverified.auth](https://github.com/SBTopZZZ-LG/nodejs-authapp/blob/main/src/middlewares/login_token.unverified.auth.js)  
The key difference between **login_token.auth** and **login_token.unverified.auth** is that this middleware ignores the state of user's email or phone's verification.  
  
Method - **POST**  
Query params -  
- id  
  
Headers -  
- Authorization  
---  
#### 3. [2fa.auth](https://github.com/SBTopZZZ-LG/nodejs-authapp/blob/main/src/middlewares/2fa.auth.js)  
This middleware validates user's authenticity by validating user's two-factor authentication security questions. This is the only authentication that does not rely on the login token.  
  
Method - **POST**  
Query params -  
- id  
  
Body - **application/json**  
Body params -  
- first_question_answer  
- second_question_answer  
- third_question_answer  
  
## Routes  
  
The routing can be simplified by splitting the routes into three parts.  
### I. UserAuth  
#### 1. `/user/auth/signin`  
*Use this api to sign in as a User*  
  
Method - **POST**  
Body - **application/json**  
Body params -  
- email (*Not required if phone is provided*)  
- phone (*Not required if email is provided*)  
- password  
  
#### 2. `/user/auth/signup`  
*Use this api to sign up as a User*  
  
Method - **POST**  
Body - **application/json**  
Body params -  
- data {  
	- full_name  
	- email  
	- phone  
	- password  
}  
  
#### 3. `/user/auth/resetPassword`  
*Use this api to reset password (while signed in)*  
  
Method - **POST**  
Body - **application/json**  
Body params -  
- password (*New password*)  
  
---  
### II. UserInfo  
#### 1. `/user`  
*Use this api to fetch user's details*  
  
Method - **POST**  
Middlewares - **login_token.auth**  
  
#### 2. `/user/update`  
*Use this api to update user fields*  
  
Method - **POST**  
Middlewares - **login_token.auth**  
Body params -  
- data {  
	- full_name?  
	- email?  
	- phone?  
	}  
  
#### 3. `/user/avatar`  
*Use this api to set a new avatar*  
  
Method - **POST**  
Middlewares - **login_token.auth**  
Body params -  
- avatar (*File*)  
  
*Use this api to delete an avatar*  
  
Method - **DELETE**  
Middlewares - **login_token.auth**  
  
#### 4. `/user/verify`  
*Not meant to be used. This api will be used to confirm verification (either for emails, phones, or password resets)*  
  
Method - **GET**  
Query params -  
- token  
  
#### 5. `/user/verify/requestEmail`  
*Use this api to request an email confirmation (timeout. 120s)*  
  
Method - **POST**  
Middlewares - **login_token.unverified.auth**  
Body params -  
- email? (*Provide email to update old unverified email with new one*)  
  
#### 6. `/user/verify/requestPhone`  
*Use this api to request a phone confirmation (timeout. 120s)*  
  
Method - **POST**  
Middlewares - **login_token.unverified.auth**  
Body params -  
- phone? (*Provide phone to update old unverified phone with new one*)  
  
---  
### III. User2FA  
#### 1. `/user/2fa`  
*Use this api to fetch user's 2fa details*  
  
Method - **POST**  
Middlewares - **login_token.auth**  
  
#### 2. `/user/2fa/enable`  
*Use this api to enable and/or update user's 2fa details*  
  
Method - **POST**  
Middlewares - **login_token.auth**  
Body params -  
- data {  
	- first_question? {  
		- question  
		- answer  
		}  
	- second_question? {  
		- question  
		- answer  
		}  
	- third_question? {  
		- question  
		- answer  
		}  
  
#### 3. `/user/2fa/disable`  
*Use this api to disable user's 2fa*  
  
Method - **PATCH**  
Middlewares - **login_token.auth**  
  
*Use this api to disable and clear user's 2fa details*  
  
Method - **DELETE**  
Middlewares - **login_token.auth**  
  
#### 4. `/user/2fa/resetPassword`  
*Use this api to reset password (while signed out)*  
  
Method - **POST**  
Middlewares - **2fa.auth**  
Body params -  
- password (*New password*)

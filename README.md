# chat1-be
Node/Express back end for demo chat app


## Deploy to Azure
- Make sure that Azure App Service CI is configured per instuctions in chat1-azure/README.md
- Push to the "master" branch on github
- Azure App Service CI will deploy the latest build automatically
- Configure environment variables (App settings -> Configuration -> Application settings):
    - SERVER_SECRET: "secret value used for server side crypto operations"
    - MONGODB_URI: mongodb+srv://chat1:chat1@cluster0-vruvz.azure.mongodb.net/chat1?retryWrites=true&w=majority
    - FRONTEND_URL: https://chat1.imatviyenko.xyz


## Debug on Azure
- Make sure that "Application Logging (Filesystem)" setting is set to "On" and the level is set to "Verbose" in the App settings -> Monitoring -> App Service logs section
- Open this URL in browser and click on "stderr" link  to see the errors (logger.error output), "stdout" link for logger.log output for the current date: https://webappchat1.scm.azurewebsites.net/vfs/LogFiles/Application/index.html

## Run locally
1. Install MongoDB on local dev machine
2. Configure a single node replica set (more details here: https://docs.mongodb.com/manual/tutorial/deploy-replica-set, all steps below are for MongoDB on Windows installed as a service):
    - Stop "MongoDB Server" service
    - Open config file C:\Program Files\MongoDB\Server\4.2\bin\mongod.cfg in editor
    - Add the following config section in the end of the file to create rs0 replica set:
        ```
        replication:
            replSetName: rs0
        ```
    - Start "MongoDB Server" service
    - Run "mongo" command in Windows command prompt or in PowerShell
    - In mongo shell, execute this command to initialize replica set rs0:
        ```
        rs.initiate()
        ```
    - In mongo shell, execute this command to verify replica set status:
        ```
        rs.status()
        ```        
3. Execute in VSCode command prompt: npm start

After that the back-end service instance will be started on http://localhost:3001
Please note that chat1-worker component which runs background tasks cannot be run locally, so you may need to reset user's online status manually by editing documents in the MongoDB 'users' collection if after back-end service restart user status remains set to 'online'.


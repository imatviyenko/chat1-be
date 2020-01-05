# chat1-be
Node/Express back end for demo chat app


## Deploy to Azure
- Make sure that Azure App Service CI is configured per instuctions in chat1-azure/README.md
- Push to the "master" branch on github
- Azure App Service CI will deploy the latest build automatically

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
